import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { GuessResponse } from './types';
import { useGameState } from './hooks/useGameState';
import AnswerSlots from './components/AnswerSlots';
import StrikesDisplay from './components/StrikesDisplay';
import GuessForm from './components/GuessForm';
import FeedbackMessage, { FeedbackType } from './components/FeedbackMessage';

// Configuration
const FEEDBACK_DURATION_MS = 2000;

const Player: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState<{ type: FeedbackType; text: string } | null>(null);

    // Use shared game state hook
    const { gameState, error, refresh } = useGameState(code);

    const handleGuess = async (guessText: string) => {
        if (!code) return;

        try {
            const response = await api.post<GuessResponse>(`/api/games/${code}/guess`, { text: guessText });
            const result = response.data;

            if (result.correct) {
                setFeedback({
                    type: 'correct',
                    text: `${result.answer?.text} - ${result.answer?.weight} points!`
                });
            } else {
                setFeedback({
                    type: 'wrong',
                    text: result.message || 'Wrong answer!'
                });
            }

            refresh();
            setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
        } catch (err) {
            setFeedback({ type: 'info', text: 'Error submitting guess' });
            setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
        }
    };

    // Error state
    if (error) {
        return (
            <div className="game-container">
                <div className="game-board">
                    <div className="no-game">
                        <h2>{error}</h2>
                        <p>The game code "{code}" was not found.</p>
                        <button className="btn-primary-custom" onClick={() => navigate('/')}>
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (!gameState) {
        return (
            <div className="game-container">
                <div className="game-board">
                    <div className="no-game">
                        <h2>Loading game {code}...</h2>
                    </div>
                </div>
            </div>
        );
    }

    // Waiting state
    if (gameState.status === 'waiting') {
        return (
            <div className="game-container">
                <div className="game-board">
                    <div className="no-game">
                        <div className="game-code-badge">{code}</div>
                        <h2>Waiting for Host</h2>
                        <p>The host is setting up the game...</p>
                        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
                            {gameState.total_questions} question{gameState.total_questions !== 1 ? 's' : ''} added so far
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Game completed state
    if (gameState.status === 'completed') {
        return (
            <div className="game-container">
                <div className="game-board">
                    <div className="game-over">
                        <h2>Game Over!</h2>
                        <p className="final-score">Final Score</p>
                        <p className="score-value">{gameState.score}</p>
                        <button className="btn-gold" onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
                            Play Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Active game state
    return (
        <div className="game-container">
            <div className="game-board">
                {/* Game Code Badge */}
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    <span className="game-code-badge-small">{code}</span>
                </div>

                {/* Question Display */}
                <div className="question-display">
                    <p className="question-number">
                        Question {(gameState.current_index ?? 0) + 1} of {gameState.total_questions}
                    </p>
                    <h2 className="question-text">{gameState.question?.text}</h2>
                </div>

                {/* Answer Slots */}
                <AnswerSlots
                    totalAnswers={gameState.total_answers}
                    revealedAnswers={gameState.revealed_answers}
                />

                {/* Score and Strikes */}
                <div className="game-stats">
                    <div className="stat-box">
                        <p className="stat-label">Score</p>
                        <div className="score-display">{gameState.score}</div>
                    </div>
                    <div className="stat-box">
                        <p className="stat-label">Strikes</p>
                        <StrikesDisplay
                            strikes={gameState.strikes}
                            maxStrikes={gameState.max_strikes}
                        />
                    </div>
                </div>

                {/* Feedback Message */}
                {feedback && (
                    <FeedbackMessage type={feedback.type} text={feedback.text} />
                )}

                {/* Guess Input */}
                <GuessForm onSubmit={handleGuess} />
            </div>
        </div>
    );
};

export default Player;
