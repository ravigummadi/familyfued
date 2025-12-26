import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from './api';
import { GameStatus } from './types';

const Display: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [gameState, setGameState] = useState<GameStatus | null>(null);
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
        // Faster polling for TV display - update every 1.5 seconds
        const interval = setInterval(fetchGameState, 1500);
        return () => clearInterval(interval);
    }, [fetchGameState]);

    // Render answer slots for TV display
    const renderAnswerSlots = () => {
        if (!gameState || !gameState.question) return null;

        const totalSlots = gameState.total_answers;
        const slots = [];

        for (let i = 0; i < totalSlots; i++) {
            const revealedAnswer = gameState.revealed_answers[i];
            const isRevealed = i < gameState.revealed_answers.length;

            slots.push(
                <div key={i} className={`display-slot ${isRevealed ? 'revealed' : ''}`}>
                    <span className="display-slot-number">{i + 1}</span>
                    {isRevealed && revealedAnswer ? (
                        <>
                            <span className="display-slot-text">{revealedAnswer.text}</span>
                            <span className="display-slot-points">{revealedAnswer.weight}</span>
                        </>
                    ) : (
                        <span className="display-slot-text display-hidden">• • • • •</span>
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
                    className={`display-strike ${gameState && i < gameState.strikes ? 'active' : ''}`}
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
            <div className="display-container">
                <div className="display-error">
                    <h1>❌ {error}</h1>
                    <p>Game code: {code}</p>
                </div>
            </div>
        );
    }

    // Loading state
    if (!gameState) {
        return (
            <div className="display-container">
                <div className="display-loading">
                    <h1>Loading game {code}...</h1>
                </div>
            </div>
        );
    }

    // Waiting state - show QR prominently
    if (gameState.status === 'waiting') {
        return (
            <div className="display-container">
                <div className="display-waiting">
                    <h1 className="display-title">🎯 Family Feud</h1>
                    <div className="display-code-large">{code}</div>
                    <p className="display-waiting-text">Waiting for host to start the game...</p>
                    <div className="display-qr-center">
                        <QRCodeSVG
                            value={`https://feud.family/game/${code}`}
                            size={200}
                            bgColor="transparent"
                            fgColor="#fbbf24"
                            level="M"
                        />
                        <p>Scan to join</p>
                    </div>
                    <p className="display-players-hint">
                        {gameState.total_questions} question{gameState.total_questions !== 1 ? 's' : ''} ready
                    </p>
                </div>
            </div>
        );
    }

    // Game completed
    if (gameState.status === 'completed') {
        return (
            <div className="display-container">
                <div className="display-gameover">
                    <h1>🎉 Game Over!</h1>
                    <div className="display-final-score">
                        <span className="label">Final Score</span>
                        <span className="value">{gameState.score}</span>
                    </div>
                    <p className="display-thanks">Thanks for playing!</p>
                </div>
            </div>
        );
    }

    // Active game - main display
    return (
        <div className="display-container">
            {/* QR Code in corner */}
            <div className="display-qr-corner">
                <QRCodeSVG
                    value={`https://feud.family/game/${code}`}
                    size={80}
                    bgColor="transparent"
                    fgColor="#fbbf24"
                    level="L"
                />
                <span className="display-qr-code">{code}</span>
            </div>

            {/* Question */}
            <div className="display-question">
                <span className="display-question-number">
                    Question {(gameState.current_index ?? 0) + 1} of {gameState.total_questions}
                </span>
                <h1 className="display-question-text">{gameState.question?.text}</h1>
            </div>

            {/* Answer Board */}
            <div className="display-board">
                {renderAnswerSlots()}
            </div>

            {/* Score and Strikes */}
            <div className="display-footer">
                <div className="display-score">
                    <span className="label">Score</span>
                    <span className="value">{gameState.score}</span>
                </div>
                <div className="display-strikes">
                    {renderStrikes()}
                </div>
            </div>
        </div>
    );
};

export default Display;
