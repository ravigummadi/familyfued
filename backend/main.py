from fastapi import FastAPI, HTTPException
from typing import Dict, List, Optional, Set
from thefuzz import process
import random

from models import (
    Answer,
    GameSetup,
    GameStatus,
    Guess,
    GuessResponse,
    Question,
    QuestionCreate,
)


app = FastAPI()

FUZZ_THRESHOLD = 80
MAX_STRIKES = 3

questions: Dict[int, Question] = {}
next_question_id: int = 1


class GameState:
    def __init__(self) -> None:
        self.question_ids: List[int] = []
        self.current_index: int = -1
        self.revealed_answer_texts: Set[str] = set()
        self.score: int = 0
        self.strikes: int = 0
        self.completed: bool = False

    def start(self, question_ids: List[int]) -> None:
        if not question_ids:
            raise ValueError("At least one question is required to start a game.")
        self.question_ids = question_ids
        self.current_index = -1
        self.score = 0
        self.strikes = 0
        self.completed = False
        self.revealed_answer_texts = set()
        self.advance()

    def advance(self) -> bool:
        self.current_index += 1
        if self.current_index >= len(self.question_ids):
            self.completed = True
            self.revealed_answer_texts = set()
            self.strikes = 0
            return False

        self.revealed_answer_texts = set()
        self.strikes = 0
        return True

    def current_question(self) -> Optional[Question]:
        if self.completed:
            return None
        if 0 <= self.current_index < len(self.question_ids):
            qid = self.question_ids[self.current_index]
            return questions.get(qid)
        return None

    def reveal(self, answer: Answer) -> None:
        self.revealed_answer_texts.add(answer.text)

    def revealed_answers(self) -> List[Answer]:
        question = self.current_question()
        if not question:
            return []
        return [answer for answer in question.answers if answer.text in self.revealed_answer_texts]

    def reset(self) -> None:
        self.question_ids = []
        self.current_index = -1
        self.revealed_answer_texts = set()
        self.score = 0
        self.strikes = 0
        self.completed = False


game = GameState()


def _register_question(payload: QuestionCreate) -> Question:
    """Create a Question with a new ID and store it in the in-memory registry."""
    global next_question_id

    answers: List[Answer] = []
    for answer in payload.answers:
        text = answer.text.strip()
        if not text:
            continue
        answers.append(Answer(text=text, weight=answer.weight))

    if not answers:
        raise HTTPException(status_code=400, detail="At least one answer with text is required.")

    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Question text cannot be empty.")

    question = Question(id=next_question_id, text=text, answers=answers)
    questions[next_question_id] = question
    next_question_id += 1
    return question


def _bootstrap_questions() -> None:
    if questions:
        return

    defaults = [
        (
            "Name a popular search engine.",
            [
                ("Google", 60),
                ("Bing", 20),
                ("Yahoo", 10),
                ("DuckDuckGo", 10),
            ],
        ),
        (
            "Name a fruit that is typically red.",
            [
                ("Apple", 50),
                ("Strawberry", 30),
                ("Cherry", 15),
                ("Raspberry", 5),
            ],
        ),
    ]

    for text, answers in defaults:
        payload = QuestionCreate(
            text=text,
            answers=[Answer(text=answer_text, weight=weight) for answer_text, weight in answers],
        )
        _register_question(payload)


def _build_game_status() -> GameStatus:
    question = game.current_question()
    revealed_answers = game.revealed_answers()
    current_index: Optional[int] = None
    if question and 0 <= game.current_index < len(game.question_ids):
        current_index = game.current_index

    return GameStatus(
        question=question,
        revealed_answers=revealed_answers,
        score=game.score,
        strikes=game.strikes,
        max_strikes=MAX_STRIKES,
        completed=game.completed,
        current_index=current_index,
        total_questions=len(game.question_ids),
    )


@app.on_event("startup")
async def on_startup() -> None:
    _bootstrap_questions()


@app.get("/")
async def read_root() -> dict:
    return {"app": "family-feud"}


@app.post("/api/questions", response_model=Question)
async def create_question(question: QuestionCreate) -> Question:
    return _register_question(question)


@app.get("/api/questions", response_model=List[Question])
async def get_questions() -> List[Question]:
    return [questions[qid] for qid in sorted(questions.keys())]


@app.post("/api/game/session", response_model=GameStatus)
async def start_game(game_setup: GameSetup) -> GameStatus:
    if not game_setup.question_ids:
        raise HTTPException(status_code=400, detail="Provide at least one question id to start a game.")

    missing = [qid for qid in game_setup.question_ids if qid not in questions]
    if missing:
        raise HTTPException(status_code=404, detail=f"Question ids not found: {missing}")

    # Preserve admin order unless shuffle is requested, and drop duplicates while preserving order.
    ordered_ids: List[int] = []
    seen: Set[int] = set()
    for qid in game_setup.question_ids:
        if qid not in seen:
            ordered_ids.append(qid)
            seen.add(qid)

    if game_setup.shuffle:
        random.shuffle(ordered_ids)

    try:
        game.start(ordered_ids)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    return _build_game_status()


@app.post("/api/game/next-question", response_model=GameStatus)
async def next_question() -> GameStatus:
    if not game.question_ids:
        raise HTTPException(status_code=400, detail="No active game. Start one from the admin panel.")

    if game.completed:
        return _build_game_status()

    game.advance()
    return _build_game_status()


@app.post("/api/game/guess", response_model=GuessResponse)
async def guess(player_guess: Guess) -> GuessResponse:
    question = game.current_question()
    if not question:
        raise HTTPException(status_code=400, detail="No active question. Start a game from the admin panel.")

    guess_text = player_guess.text.strip()
    if not guess_text:
        raise HTTPException(status_code=400, detail="Guess cannot be empty.")

    choices = [answer.text for answer in question.answers]
    match = process.extractOne(guess_text, choices)

    if match and match[1] >= FUZZ_THRESHOLD:
        matched_answer = next((answer for answer in question.answers if answer.text == match[0]), None)
        if matched_answer is None:
            # Should not happen, but guard just in case the answer list changed mid-game.
            raise HTTPException(status_code=500, detail="Matched answer is no longer available.")

        if matched_answer.text in game.revealed_answer_texts:
            return GuessResponse(
                correct=False,
                message="Answer already revealed.",
                strikes=game.strikes,
                score=game.score,
                status=_build_game_status(),
            )

        game.reveal(matched_answer)
        game.score += matched_answer.weight or 0

        advanced = False
        if len(game.revealed_answer_texts) == len(question.answers):
            advanced = game.advance()

        return GuessResponse(
            correct=True,
            answer=matched_answer,
            strikes=game.strikes,
            score=game.score,
            advanced=advanced,
            status=_build_game_status(),
        )

    game.strikes += 1
    strike_count = game.strikes

    if strike_count >= MAX_STRIKES:
        advanced = game.advance()
        status = _build_game_status()
        return GuessResponse(
            correct=False,
            message="Strike! Moving to next question.",
            strikes=MAX_STRIKES,
            score=game.score,
            advanced=advanced,
            status=status,
        )

    return GuessResponse(
        correct=False,
        message="Strike!",
        strikes=strike_count,
        score=game.score,
        status=_build_game_status(),
    )


@app.get("/api/game/state", response_model=GameStatus)
async def get_game_state() -> GameStatus:
    return _build_game_status()
