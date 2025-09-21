from pydantic import BaseModel
from typing import List

class Answer(BaseModel):
    text: str
    weight: int

class Question(BaseModel):
    text: str
    answers: List[Answer]

class Guess(BaseModel):
    text: str
