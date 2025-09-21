from pydantic import BaseModel, Field
from typing import List, Optional


class Answer(BaseModel):
    text: str
    weight: Optional[int] = Field(default=None, ge=0)


class Question(BaseModel):
    id: int
    text: str
    answers: List[Answer]


class QuestionCreate(BaseModel):
    text: str
    answers: List[Answer]


class Guess(BaseModel):
    text: str


class GameSetup(BaseModel):
    question_ids: List[int]
    shuffle: bool = False


class GameStatus(BaseModel):
    question: Optional[Question]
    revealed_answers: List[Answer]
    score: int
    strikes: int
    max_strikes: int
    completed: bool
    current_index: Optional[int]
    total_questions: int


class GuessResponse(BaseModel):
    correct: bool
    answer: Optional[Answer] = None
    message: Optional[str] = None
    strikes: int
    score: int
    advanced: bool = False
    status: GameStatus
