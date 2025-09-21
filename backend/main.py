from fastapi import FastAPI
from typing import List, Optional
from models import Question, Answer, Guess
from thefuzz import process
import random

app = FastAPI()

db: List[Question] = [
    Question(text="Name a popular search engine.", answers=[
        Answer(text="Google", weight=60),
        Answer(text="Bing", weight=20),
        Answer(text="Yahoo", weight=10),
        Answer(text="DuckDuckGo", weight=10)
    ]),
    Question(text="Name a fruit that is typically red.", answers=[
        Answer(text="Apple", weight=50),
        Answer(text="Strawberry", weight=30),
        Answer(text="Cherry", weight=15),
        Answer(text="Raspberry", weight=5)
    ])
]

class GameState:
    def __init__(self):
        self.current_question: Optional[Question] = None
        self.revealed_answers: List[Answer] = []
        self.score: int = 0
        self.strikes: int = 0

game = GameState()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/api/questions", response_model=Question)
async def create_question(question: Question):
    db.append(question)
    return question

@app.get("/api/questions", response_model=List[Question])
async def get_questions():
    return db

@app.get("/api/game/next-question", response_model=Question)
async def next_question():
    game.current_question = random.choice(db)
    game.revealed_answers = []
    game.score = 0
    game.strikes = 0
    return game.current_question

@app.post("/api/game/guess")
async def guess(player_guess: Guess):
    if not game.current_question:
        return {"message": "No active question"}

    choices = [answer.text for answer in game.current_question.answers]
    best_match = process.extractOne(player_guess.text, choices)

    if best_match and best_match[1] > 80: # 80 is the confidence threshold
        # Find the answer object
        for answer in game.current_question.answers:
            if answer.text == best_match[0] and answer not in game.revealed_answers:
                game.revealed_answers.append(answer)
                game.score += answer.weight
                return {"correct": True, "answer": answer, "score": game.score}
        return {"correct": False, "message": "Answer already revealed"}
    else:
        game.strikes += 1
        return {"correct": False, "strikes": game.strikes}

@app.get("/api/game/state")
async def get_game_state():
    return {
        "question": game.current_question,
        "revealed_answers": game.revealed_answers,
        "score": game.score,
        "strikes": game.strikes
    }
