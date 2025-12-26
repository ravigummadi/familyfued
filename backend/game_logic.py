"""Pure game logic functions (Functional Core).

This module contains pure functions with no side effects for game state management.
All I/O operations (database, HTTP) are handled by the imperative shell (main.py, game_service.py).
"""
from dataclasses import dataclass
from typing import Optional, List, Tuple
from thefuzz import process

from models import GameSession, GameMode, Answer, Question


@dataclass
class GuessResult:
    """Result of processing a guess - pure data, no side effects."""
    correct: bool
    matched_answer: Optional[Answer] = None
    message: Optional[str] = None
    points_earned: int = 0
    strikes_added: int = 0
    should_advance: bool = False
    game_completed: bool = False
    already_revealed: bool = False


class AnswerMatcher:
    """Handles fuzzy matching of player guesses to answers."""

    def __init__(self, threshold: int = 80):
        self.threshold = threshold

    def find_match(self, guess: str, answers: List[Answer]) -> Optional[Answer]:
        """Find the best matching answer for a guess.

        Args:
            guess: Player's guess text
            answers: List of possible answers

        Returns:
            Matched Answer if found above threshold, None otherwise
        """
        if not guess or not answers:
            return None

        choices = [a.text for a in answers]
        match = process.extractOne(guess, choices)

        if match and match[1] >= self.threshold:
            return next((a for a in answers if a.text == match[0]), None)
        return None


class GameStateMachine:
    """Handles game state transitions as pure functions."""

    def __init__(self, max_strikes: int = 3, fuzz_threshold: int = 80):
        self.max_strikes = max_strikes
        self.matcher = AnswerMatcher(fuzz_threshold)

    def process_guess(self, game: GameSession, guess_text: str) -> Tuple[GuessResult, GameSession]:
        """Process a player's guess and return the result with updated game state.

        This is a pure function - it returns a new game state rather than mutating.

        Args:
            game: Current game session (not mutated)
            guess_text: Player's guess

        Returns:
            Tuple of (GuessResult, updated GameSession copy)
        """
        # Create a copy to avoid mutation
        updated_game = game.model_copy(deep=True)

        question = updated_game.current_question()
        if not question:
            return GuessResult(correct=False, message="No active question"), updated_game

        # Try to match the guess
        matched = self.matcher.find_match(guess_text.strip(), question.answers)

        if matched:
            return self._handle_correct_guess(updated_game, matched, question)
        else:
            return self._handle_wrong_guess(updated_game)

    def _handle_correct_guess(
        self, game: GameSession, matched: Answer, question: Question
    ) -> Tuple[GuessResult, GameSession]:
        """Handle a correct guess."""
        # Check if already revealed
        if matched.text in game.revealed_answers:
            return GuessResult(
                correct=False,
                message="Already revealed!",
                already_revealed=True
            ), game

        # Reveal the answer and add points
        game.revealed_answers.append(matched.text)
        points = matched.weight or 0
        game.score += points

        # Check if all answers revealed
        all_revealed = len(game.revealed_answers) == len(question.answers)
        should_advance = all_revealed and game.mode == GameMode.AUTO_ADVANCE

        if should_advance:
            game = self._advance_to_next(game)

        return GuessResult(
            correct=True,
            matched_answer=matched,
            points_earned=points,
            should_advance=should_advance,
            game_completed=game.status == "completed"
        ), game

    def _handle_wrong_guess(self, game: GameSession) -> Tuple[GuessResult, GameSession]:
        """Handle an incorrect guess."""
        game.strikes += 1

        max_strikes_reached = game.strikes >= self.max_strikes
        should_advance = max_strikes_reached and game.mode == GameMode.AUTO_ADVANCE

        message = "Strike!"
        if should_advance:
            game = self._advance_to_next(game)
            message = f"{self.max_strikes} strikes! Moving on..."

        return GuessResult(
            correct=False,
            message=message,
            strikes_added=1,
            should_advance=should_advance,
            game_completed=game.status == "completed"
        ), game

    def _advance_to_next(self, game: GameSession) -> GameSession:
        """Advance to the next question, resetting per-question state."""
        game.current_index += 1
        game.revealed_answers = []
        game.strikes = 0

        if game.current_index >= len(game.questions):
            game.status = "completed"

        return game


# Default instances for convenience
default_matcher = AnswerMatcher()
default_state_machine = GameStateMachine()
