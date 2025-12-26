"""Game session management service with Firestore persistence."""
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from google.cloud.firestore_v1 import Client, DocumentReference

from models import GameSession, GameMode, Question, Answer

# Characters for game codes (avoid confusing characters: 0/O, 1/I/L)
CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 4
GAME_EXPIRY_HOURS = 24


def generate_code(db: Client) -> str:
    """Generate a unique 4-character game code."""
    max_attempts = 100
    for _ in range(max_attempts):
        code = ''.join(random.choices(CODE_CHARS, k=CODE_LENGTH))
        # Check if code already exists and is not expired
        doc = db.collection("games").document(code).get()
        if not doc.exists:
            return code
        # Check if existing game is expired (can recycle)
        game_data = doc.to_dict()
        if game_data and game_data.get("expires_at"):
            expires_at = game_data["expires_at"]
            if expires_at < datetime.now(timezone.utc):
                return code  # Recycle expired code
    raise RuntimeError("Could not generate unique game code")


def create_game(db: Client, mode: GameMode, host_id: str) -> GameSession:
    """Create a new game session in Firestore."""
    code = generate_code(db)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=GAME_EXPIRY_HOURS)
    
    game = GameSession(
        code=code,
        mode=mode,
        host_id=host_id,
        questions=[],
        current_index=-1,
        score=0,
        strikes=0,
        max_strikes=3,
        status="waiting",
        revealed_answers=[],
        created_at=now,
        expires_at=expires_at,
    )
    
    # Save to Firestore
    db.collection("games").document(code).set(game.to_dict())
    return game


def get_game(db: Client, code: str) -> Optional[GameSession]:
    """Get a game session by code."""
    doc = db.collection("games").document(code.upper()).get()
    if not doc.exists:
        return None
    return GameSession.from_dict(doc.to_dict())


def update_game(db: Client, game: GameSession) -> None:
    """Update a game session in Firestore."""
    db.collection("games").document(game.code).set(game.to_dict())


def delete_game(db: Client, code: str) -> None:
    """Delete a game session."""
    db.collection("games").document(code.upper()).delete()


def add_question_to_game(db: Client, code: str, question: Question) -> GameSession:
    """Add a question to a game."""
    game = get_game(db, code)
    if not game:
        raise ValueError(f"Game {code} not found")
    
    # Generate question ID
    question.id = len(game.questions) + 1
    game.questions.append(question)
    update_game(db, game)
    return game


def start_game(db: Client, code: str, host_id: str) -> GameSession:
    """Start a game (transition from waiting to playing)."""
    game = get_game(db, code)
    if not game:
        raise ValueError(f"Game {code} not found")
    if game.host_id != host_id:
        raise PermissionError("Only the host can start the game")
    if not game.questions:
        raise ValueError("Cannot start game with no questions")
    
    game.status = "playing"
    game.current_index = 0
    game.revealed_answers = []
    game.score = 0
    game.strikes = 0
    update_game(db, game)
    return game


def advance_question(db: Client, code: str, host_id: Optional[str] = None) -> GameSession:
    """Advance to the next question."""
    game = get_game(db, code)
    if not game:
        raise ValueError(f"Game {code} not found")
    
    # In host mode, only host can advance
    if game.mode == GameMode.HOST_CONTROLLED and host_id != game.host_id:
        raise PermissionError("Only the host can advance questions")
    
    game.current_index += 1
    game.revealed_answers = []
    game.strikes = 0
    
    if game.current_index >= len(game.questions):
        game.status = "completed"
    
    update_game(db, game)
    return game


def cleanup_expired_games(db: Client) -> int:
    """Delete expired games. Returns count of deleted games."""
    now = datetime.now(timezone.utc)
    expired_games = db.collection("games").where("expires_at", "<", now).stream()
    
    count = 0
    for doc in expired_games:
        doc.reference.delete()
        count += 1
    
    return count
