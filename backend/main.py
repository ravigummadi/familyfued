import os

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Annotated
import uuid

from firebase_config import get_db
from game_service import (
    create_game,
    get_game,
    update_game,
    add_question_to_game,
    start_game,
    advance_question,
)
from models import (
    Answer,
    CreateGameRequest,
    GameMode,
    GameSession,
    GameStatus,
    Guess,
    GuessResponse,
    Question,
    QuestionCreate,
)
from game_logic import GameStateMachine


app = FastAPI(title="Family Feud API", version="2.0.0")

# CORS configuration - restrict to known domains
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else [
    "https://feud.family",
    "https://www.feud.family",
    "https://feud-family.web.app",
    "https://feud-family.firebaseapp.com",
    "http://localhost:3000",  # Local development
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Host-Id", "Authorization"],
)

# Configuration - can be overridden via environment variables
FUZZ_THRESHOLD = int(os.getenv("FUZZ_THRESHOLD", "80"))
MAX_STRIKES = int(os.getenv("MAX_STRIKES", "3"))

# Game state machine for processing guesses (pure functional core)
game_state_machine = GameStateMachine(max_strikes=MAX_STRIKES, fuzz_threshold=FUZZ_THRESHOLD)


# FastAPI dependency for game lookup - eliminates repeated get_game() + 404 pattern
async def get_game_or_404(code: str) -> GameSession:
    """Dependency to fetch a game by code, raising 404 if not found."""
    db = get_db()
    game = get_game(db, code.upper())
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


# Type alias for cleaner endpoint signatures
GameDep = Annotated[GameSession, Depends(get_game_or_404)]


def _build_game_status(game: GameSession, is_host: bool = False) -> GameStatus:
    """Build public game status from session."""
    question = game.current_question()
    revealed_answers = game.get_revealed_answer_objects()
    
    # For players, hide the full answers list to not reveal count
    # Create a sanitized question copy without exposing all answers
    sanitized_question = None
    total_answers = 0
    if question:
        sanitized_question = Question(
            id=question.id,
            text=question.text,
            answers=revealed_answers if not is_host else question.answers
        )
        total_answers = len(question.answers)
    
    return GameStatus(
        code=game.code,
        mode=game.mode,
        status=game.status,
        question=sanitized_question,
        revealed_answers=revealed_answers,
        score=game.score,
        strikes=game.strikes,
        max_strikes=game.max_strikes,
        current_index=game.current_index if game.status == "playing" else None,
        total_questions=len(game.questions),
        total_answers=total_answers,
        is_host=is_host,
    )


@app.get("/")
async def read_root() -> dict:
    return {"app": "family-feud", "version": "2.0.0"}


@app.post("/api/games")
async def create_new_game(
    request: CreateGameRequest,
    x_host_id: Optional[str] = Header(None)
) -> dict:
    """Create a new game and return the game code with host_id."""
    db = get_db()
    # Use provided host ID or generate a new one
    host_id = x_host_id or str(uuid.uuid4())
    game = create_game(db, request.mode, host_id)
    
    # Return status with host_id for the host to store
    status = _build_game_status(game, is_host=True)
    return {
        **status.model_dump(),
        "host_id": host_id  # Include host_id for frontend to store
    }


@app.get("/api/games/{code}", response_model=GameStatus)
async def get_game_status(
    game: GameDep,
    x_host_id: Optional[str] = Header(None)
) -> GameStatus:
    """Get the current game status."""
    is_host = x_host_id == game.host_id
    return _build_game_status(game, is_host=is_host)


@app.post("/api/games/{code}/questions", response_model=GameStatus)
async def add_question(
    game: GameDep,
    question: QuestionCreate,
    x_host_id: Optional[str] = Header(None)
) -> GameStatus:
    """Add a question to the game."""
    # Only host can add questions in waiting state
    if game.status != "waiting":
        raise HTTPException(status_code=400, detail="Cannot add questions after game started")

    # Validate question
    answers = [Answer(text=a.text.strip(), weight=a.weight) for a in question.answers if a.text.strip()]
    if not answers:
        raise HTTPException(status_code=400, detail="At least one answer required")
    if not question.text.strip():
        raise HTTPException(status_code=400, detail="Question text required")

    new_question = Question(
        id=len(game.questions) + 1,
        text=question.text.strip(),
        answers=answers
    )
    game.questions.append(new_question)

    db = get_db()
    update_game(db, game)

    is_host = x_host_id == game.host_id
    return _build_game_status(game, is_host=is_host)


@app.post("/api/games/{code}/start", response_model=GameStatus)
async def start_game_endpoint(
    code: str,
    x_host_id: str = Header(...)
) -> GameStatus:
    """Start the game (host only)."""
    db = get_db()
    try:
        game = start_game(db, code.upper(), x_host_id)
        return _build_game_status(game, is_host=True)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.post("/api/games/{code}/next", response_model=GameStatus)
async def next_question(
    code: str,
    x_host_id: Optional[str] = Header(None)
) -> GameStatus:
    """Advance to the next question."""
    db = get_db()
    try:
        game = advance_question(db, code.upper(), x_host_id)
        is_host = x_host_id == game.host_id
        return _build_game_status(game, is_host=is_host)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@app.post("/api/games/{code}/guess", response_model=GuessResponse)
async def make_guess(
    game: GameDep,
    player_guess: Guess,
    x_host_id: Optional[str] = Header(None)
) -> GuessResponse:
    """Submit a guess for the current question."""
    if game.status != "playing":
        raise HTTPException(status_code=400, detail="Game is not in progress")

    if not game.current_question():
        raise HTTPException(status_code=400, detail="No active question")

    guess_text = player_guess.text.strip()
    if not guess_text:
        raise HTTPException(status_code=400, detail="Guess cannot be empty")

    # Process guess using pure game logic (Functional Core)
    result, updated_game = game_state_machine.process_guess(game, guess_text)

    # Persist updated state (Imperative Shell)
    db = get_db()
    update_game(db, updated_game)

    is_host = x_host_id == updated_game.host_id
    return GuessResponse(
        correct=result.correct,
        answer=result.matched_answer,
        message=result.message,
        strikes=updated_game.strikes,
        score=updated_game.score,
        advanced=result.should_advance,
        status=_build_game_status(updated_game, is_host=is_host),
    )


# Keep the old endpoints for backwards compatibility during transition
@app.get("/api/game/state", response_model=dict)
async def legacy_game_state() -> dict:
    """Legacy endpoint - returns empty state."""
    return {
        "question": None,
        "revealed_answers": [],
        "score": 0,
        "strikes": 0,
        "max_strikes": 3,
        "completed": False,
        "current_index": None,
        "total_questions": 0,
        "total_answers": 0,
    }
