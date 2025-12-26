import React from 'react';
import { GameStatus } from '../types';

interface GameStatusDisplayProps {
    gameState: GameStatus;
    onStartGame: () => void;
    onNextQuestion: () => void;
    onCreateNew: () => void;
}

/**
 * Displays the current game status with appropriate controls.
 * Handles waiting, playing, and completed states.
 */
const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({
    gameState,
    onStartGame,
    onNextQuestion,
    onCreateNew
}) => {
    const getStatusTitle = () => {
        switch (gameState.status) {
            case 'waiting':
                return 'Waiting to Start';
            case 'playing':
                return 'Game in Progress';
            case 'completed':
                return 'Game Completed';
            default:
                return 'Unknown';
        }
    };

    const getStatusEmoji = () => {
        switch (gameState.status) {
            case 'waiting':
                return '';
            case 'playing':
                return '';
            case 'completed':
                return '';
            default:
                return '';
        }
    };

    return (
        <div className="admin-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>
                    {getStatusEmoji()} {getStatusTitle()}
                </h2>
                <div style={{ color: '#94a3b8' }}>
                    Mode: {gameState.mode === 'auto' ? 'Auto Advance' : 'Host Controlled'}
                </div>
            </div>

            {gameState.status === 'waiting' && (
                <div className="game-controls">
                    <button
                        className="btn-gold"
                        onClick={onStartGame}
                        disabled={gameState.total_questions === 0}
                    >
                        Start Game ({gameState.total_questions} questions)
                    </button>
                </div>
            )}

            {gameState.status === 'playing' && (
                <div>
                    <div style={{ marginBottom: '1rem', color: '#94a3b8' }}>
                        Question {(gameState.current_index ?? 0) + 1} of {gameState.total_questions} |
                        Score: {gameState.score} | Strikes: {gameState.strikes}/{gameState.max_strikes}
                    </div>
                    {gameState.question && (
                        <div className="current-question-display">
                            <h3>{gameState.question.text}</h3>
                            <div className="question-answers" style={{ marginTop: '1rem' }}>
                                {gameState.question.answers.map((a, i) => (
                                    <span
                                        key={i}
                                        className={`answer-chip ${gameState.revealed_answers.some(r => r.text === a.text) ? 'revealed' : ''}`}
                                    >
                                        {a.text} <span className="weight">({a.weight})</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {gameState.mode === 'host' && (
                        <button className="btn-primary-custom" onClick={onNextQuestion} style={{ marginTop: '1rem' }}>
                            Next Question
                        </button>
                    )}
                </div>
            )}

            {gameState.status === 'completed' && (
                <div className="game-over">
                    <h2>Final Score: {gameState.score}</h2>
                    <button className="btn-gold" onClick={onCreateNew}>
                        Create New Game
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameStatusDisplay;
