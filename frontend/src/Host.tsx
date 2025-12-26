import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { GameStatus } from './types';

const Host: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState<GameStatus | null>(null);
    const [hostId, setHostId] = useState<string>('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // New question form
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswers, setNewAnswers] = useState([{ text: '', weight: 10 }]);

    // Initialize or fetch game
    const fetchGame = useCallback(async () => {
        if (!code) return;

        try {
            const response = await api.get(`/api/games/${code}`, {
                headers: hostId ? { 'X-Host-Id': hostId } : {}
            });
            setGameState(response.data);
        } catch (err) {
            setError('Game not found');
        }
    }, [code, hostId]);

    useEffect(() => {
        // Generate a host ID for this session
        const storedHostId = sessionStorage.getItem(`host_${code}`);
        if (storedHostId) {
            setHostId(storedHostId);
        } else {
            const newHostId = crypto.randomUUID();
            sessionStorage.setItem(`host_${code}`, newHostId);
            setHostId(newHostId);
        }
    }, [code]);

    useEffect(() => {
        fetchGame();
        const interval = setInterval(fetchGame, 2000);
        return () => clearInterval(interval);
    }, [fetchGame]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddAnswer = () => {
        setNewAnswers([...newAnswers, { text: '', weight: 10 }]);
    };

    const handleRemoveAnswer = (index: number) => {
        if (newAnswers.length > 1) {
            setNewAnswers(newAnswers.filter((_, i) => i !== index));
        }
    };

    const handleAnswerChange = (index: number, field: 'text' | 'weight', value: string) => {
        const updated = [...newAnswers];
        if (field === 'text') {
            updated[index].text = value;
        } else {
            updated[index].weight = parseInt(value, 10) || 0;
        }
        setNewAnswers(updated);
    };

    const handleSubmitQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim() || newAnswers.every(a => !a.text.trim())) {
            return;
        }

        try {
            await api.post(`/api/games/${code}/questions`, {
                text: newQuestion,
                answers: newAnswers.filter(a => a.text.trim())
            }, {
                headers: { 'X-Host-Id': hostId }
            });
            setNewQuestion('');
            setNewAnswers([{ text: '', weight: 10 }]);
            fetchGame();
        } catch (err) {
            setError('Failed to add question');
        }
    };

    const handleStartGame = async () => {
        try {
            await api.post(`/api/games/${code}/start`, {}, {
                headers: { 'X-Host-Id': hostId }
            });
            fetchGame();
        } catch (err) {
            setError('Failed to start game');
        }
    };

    const handleNextQuestion = async () => {
        try {
            await api.post(`/api/games/${code}/next`, {}, {
                headers: { 'X-Host-Id': hostId }
            });
            fetchGame();
        } catch (err) {
            setError('Failed to advance');
        }
    };

    if (error) {
        return (
            <div className="game-container">
                <div className="game-board">
                    <div className="no-game">
                        <h2>❌ {error}</h2>
                        <button className="btn-primary-custom" onClick={() => navigate('/')}>
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className="game-container">
                <div className="game-board">
                    <div className="no-game">
                        <h2>Loading...</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            {/* Game Code Display */}
            <div className="admin-section code-display-section">
                <div className="game-code-display">
                    <span className="code-label">Game Code:</span>
                    <span className="code-value">{code}</span>
                    <button className="btn-copy" onClick={handleCopyCode}>
                        {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                </div>
                <p className="share-hint">
                    Share this code with players! They can join at <strong>feud.family/game/{code}</strong>
                </p>
            </div>

            {/* Game Status */}
            <div className="admin-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>
                        {gameState.status === 'waiting' && '⏳ Waiting to Start'}
                        {gameState.status === 'playing' && '🎮 Game in Progress'}
                        {gameState.status === 'completed' && '🎉 Game Completed'}
                    </h2>
                    <div style={{ color: '#94a3b8' }}>
                        Mode: {gameState.mode === 'auto' ? 'Auto Advance' : 'Host Controlled'}
                    </div>
                </div>

                {gameState.status === 'waiting' && (
                    <div className="game-controls">
                        <button
                            className="btn-gold"
                            onClick={handleStartGame}
                            disabled={gameState.total_questions === 0}
                        >
                            ▶️ Start Game ({gameState.total_questions} questions)
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
                            <button className="btn-primary-custom" onClick={handleNextQuestion} style={{ marginTop: '1rem' }}>
                                ➡️ Next Question
                            </button>
                        )}
                    </div>
                )}

                {gameState.status === 'completed' && (
                    <div className="game-over">
                        <h2>🏆 Final Score: {gameState.score}</h2>
                        <button className="btn-gold" onClick={() => navigate('/')}>
                            Create New Game
                        </button>
                    </div>
                )}
            </div>

            {/* Add Questions (only in waiting state) */}
            {gameState.status === 'waiting' && (
                <div className="admin-section">
                    <h2>➕ Add Questions</h2>

                    <form onSubmit={handleSubmitQuestion}>
                        <div className="form-group">
                            <label className="form-label">Survey Question</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Name something people do on vacation..."
                            />
                        </div>

                        {newAnswers.map((answer, index) => (
                            <div key={index} className="answer-row">
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Answer {index + 1}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={answer.text}
                                        onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                                        placeholder="Enter answer..."
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Points</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={answer.weight}
                                        onChange={(e) => handleAnswerChange(index, 'weight', e.target.value)}
                                        min="0"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="btn-danger-custom"
                                    onClick={() => handleRemoveAnswer(index)}
                                    style={{ height: '44px', marginTop: '1.5rem' }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn-primary-custom" onClick={handleAddAnswer}>
                                + Add Answer
                            </button>
                            <button type="submit" className="btn-gold">
                                Save Question
                            </button>
                        </div>
                    </form>

                    {/* Existing Questions */}
                    {gameState.total_questions > 0 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h3>Added Questions: {gameState.total_questions}</h3>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Host;
