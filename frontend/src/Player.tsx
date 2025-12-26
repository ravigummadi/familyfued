import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { GameStatus, GuessResponse } from './types';

const Player: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameStatus | null>(null);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; text: string } | null>(null);
  const [error, setError] = useState('');

  const fetchGameState = useCallback(async () => {
    if (!code) return;

    try {
      const response = await api.get(`/api/games/${code}`);
      setGameState(response.data);
      setError('');
    } catch (err) {
      setError('Game not found');
    }
  }, [code]);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !code) return;

    try {
      const response = await api.post<GuessResponse>(`/api/games/${code}/guess`, { text: guess });
      const result = response.data;

      if (result.correct) {
        setFeedback({
          type: 'correct',
          text: `✓ ${result.answer?.text} - ${result.answer?.weight} points!`
        });
      } else {
        setFeedback({
          type: 'wrong',
          text: result.message || 'Wrong answer!'
        });
      }

      setGameState(result.status);
      setGuess('');

      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback({ type: 'info', text: 'Error submitting guess' });
    }
  };

  // Render answer slots
  const renderAnswerSlots = () => {
    if (!gameState || !gameState.question) return null;

    const totalSlots = gameState.total_answers;
    const slots = [];

    for (let i = 0; i < totalSlots; i++) {
      const revealedAnswer = gameState.revealed_answers[i];
      const isRevealed = i < gameState.revealed_answers.length;

      slots.push(
        <div key={i} className={`answer-slot ${isRevealed ? 'revealed' : ''}`}>
          <span className="slot-number">{i + 1}</span>
          {isRevealed && revealedAnswer ? (
            <>
              <span className="answer-text">{revealedAnswer.text}</span>
              <span className="answer-points">{revealedAnswer.weight}</span>
            </>
          ) : (
            <span className="answer-text hidden-text">• • • • •</span>
          )}
        </div>
      );
    }

    return slots;
  };

  // Render strike X marks
  const renderStrikes = () => {
    const strikes = [];
    const maxStrikes = gameState?.max_strikes || 3;

    for (let i = 0; i < maxStrikes; i++) {
      strikes.push(
        <span
          key={i}
          className={`strike-x ${gameState && i < gameState.strikes ? 'active' : ''}`}
        >
          ✕
        </span>
      );
    }

    return strikes;
  };

  // Error state
  if (error) {
    return (
      <div className="game-container">
        <div className="game-board">
          <div className="no-game">
            <h2>❌ {error}</h2>
            <p>The game code "{code}" was not found.</p>
            <button className="btn-primary-custom" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading
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
            <h2>⏳ Waiting for Host</h2>
            <p>The host is setting up the game...</p>
            <p style={{ color: '#94a3b8', marginTop: '1rem' }}>
              {gameState.total_questions} question{gameState.total_questions !== 1 ? 's' : ''} added so far
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Game completed
  if (gameState.status === 'completed') {
    return (
      <div className="game-container">
        <div className="game-board">
          <div className="game-over">
            <h2>🎉 Game Over!</h2>
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

  // Active game
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
        <div className="answers-grid">
          {renderAnswerSlots()}
        </div>

        {/* Score and Strikes */}
        <div className="game-stats">
          <div className="stat-box">
            <p className="stat-label">Score</p>
            <div className="score-display">{gameState.score}</div>
          </div>
          <div className="stat-box">
            <p className="stat-label">Strikes</p>
            <div className="strikes-display">
              {renderStrikes()}
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div style={{
            textAlign: 'center',
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '1.1rem',
            background: feedback.type === 'correct'
              ? 'rgba(34, 197, 94, 0.2)'
              : feedback.type === 'wrong'
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(59, 130, 246, 0.2)',
            color: feedback.type === 'correct'
              ? '#22c55e'
              : feedback.type === 'wrong'
                ? '#ef4444'
                : '#3b82f6'
          }}>
            {feedback.text}
          </div>
        )}

        {/* Guess Input */}
        <form className="guess-form" onSubmit={handleGuess}>
          <input
            type="text"
            className="guess-input"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type your answer..."
            autoFocus
          />
          <button type="submit" className="btn-guess">
            Guess!
          </button>
        </form>
      </div>
    </div>
  );
};

export default Player;
