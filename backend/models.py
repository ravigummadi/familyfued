from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class GameMode(str, Enum):
    HOST_CONTROLLED = "host"    # Host advances questions manually
    AUTO_ADVANCE = "auto"       # Auto-advance when all revealed or 3 strikes


class Answer(BaseModel):
    text: str
    weight: Optional[int] = Field(default=None, ge=0)


class Question(BaseModel):
    id: int = 0
    text: str
    answers: List[Answer]


class QuestionCreate(BaseModel):
    text: str
    answers: List[Answer]


class GameSession(BaseModel):
    code: str
    mode: GameMode
    host_id: str
    questions: List[Question] = []
    current_index: int = -1
    score: int = 0
    strikes: int = 0
    max_strikes: int = 3
    status: str = "waiting"  # waiting, playing, completed
    revealed_answers: List[str] = []  # Store answer texts that are revealed
    created_at: datetime
    expires_at: datetime
    
    def to_dict(self) -> dict:
        """Convert to Firestore-compatible dictionary."""
        return {
            "code": self.code,
            "mode": self.mode.value,
            "host_id": self.host_id,
            "questions": [q.model_dump() for q in self.questions],
            "current_index": self.current_index,
            "score": self.score,
            "strikes": self.strikes,
            "max_strikes": self.max_strikes,
            "status": self.status,
            "revealed_answers": self.revealed_answers,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "GameSession":
        """Create from Firestore document."""
        return cls(
            code=data["code"],
            mode=GameMode(data["mode"]),
            host_id=data["host_id"],
            questions=[Question(**q) for q in data.get("questions", [])],
            current_index=data.get("current_index", -1),
            score=data.get("score", 0),
            strikes=data.get("strikes", 0),
            max_strikes=data.get("max_strikes", 3),
            status=data.get("status", "waiting"),
            revealed_answers=data.get("revealed_answers", []),
            created_at=data["created_at"],
            expires_at=data["expires_at"],
        )
    
    def current_question(self) -> Optional[Question]:
        """Get the current question."""
        if self.status != "playing" or self.current_index < 0:
            return None
        if self.current_index >= len(self.questions):
            return None
        return self.questions[self.current_index]
    
    def get_revealed_answer_objects(self) -> List[Answer]:
        """Get Answer objects for revealed answers."""
        question = self.current_question()
        if not question:
            return []
        return [a for a in question.answers if a.text in self.revealed_answers]


class CreateGameRequest(BaseModel):
    mode: GameMode = GameMode.AUTO_ADVANCE


class JoinGameRequest(BaseModel):
    player_name: Optional[str] = None


class Guess(BaseModel):
    text: str


class GameStatus(BaseModel):
    """Public game status (sent to players)."""
    code: str
    mode: GameMode
    status: str
    question: Optional[Question] = None
    revealed_answers: List[Answer] = []
    score: int
    strikes: int
    max_strikes: int
    current_index: Optional[int] = None
    total_questions: int
    total_answers: int = 0
    is_host: bool = False


class GuessResponse(BaseModel):
    correct: bool
    answer: Optional[Answer] = None
    message: Optional[str] = None
    strikes: int
    score: int
    advanced: bool = False
    status: GameStatus
