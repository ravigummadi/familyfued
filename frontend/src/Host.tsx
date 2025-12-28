import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';
import { useGameState } from './hooks/useGameState';
import QuestionForm from './components/QuestionForm';
import GameStatusDisplay from './components/GameStatusDisplay';

const Host: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [hostId, setHostId] = useState<string>('');
    const [authError, setAuthError] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const shareUrl = `https://feud.family/game/${code}`;

    // Verify host access before enabling polling
    useEffect(() => {
        const storedHostId = sessionStorage.getItem(`host_${code}`);
        if (storedHostId) {
            setHostId(storedHostId);
        } else {
            setAuthError('You are not the host of this game');
        }
    }, [code]);

    // Use shared game state hook (only enable if we have a valid hostId)
    const { gameState, error: fetchError, refresh } = useGameState(code, {
        hostId,
        enabled: !!hostId
    });

    // Combine auth errors and fetch errors
    const error = authError || fetchError;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleSubmitQuestion = async (question: string, answers: { text: string; weight: number }[]) => {
        try {
            await api.post(`/api/games/${code}/questions`, {
                text: question,
                answers
            }, {
                headers: { 'X-Host-Id': hostId }
            });
            refresh();
        } catch (err) {
            setAuthError('Failed to add question');
        }
    };

    const handleStartGame = async () => {
        try {
            await api.post(`/api/games/${code}/start`, {}, {
                headers: { 'X-Host-Id': hostId }
            });
            refresh();
        } catch (err) {
            setAuthError('Failed to start game');
        }
    };

    const handleNextQuestion = async () => {
        try {
            await api.post(`/api/games/${code}/next`, {}, {
                headers: { 'X-Host-Id': hostId }
            });
            refresh();
        } catch (err) {
            setAuthError('Failed to advance');
        }
    };

    // Error state
    if (error) {
        const isNotHost = error.includes('not the host');
        return (
            <div className="game-container">
                <div className="game-board">
                    <div className="no-game">
                        <h2>{isNotHost ? '' : ''} {error}</h2>
                        {isNotHost && (
                            <button className="btn-gold" onClick={() => navigate(`/game/${code}`)} style={{ marginBottom: '1rem' }}>
                                Join as Player
                            </button>
                        )}
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
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <p className="share-hint">Share this code with players! They can join at:</p>
                <div className="share-link-display">
                    <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-link-value"
                    >
                        feud.family/game/{code}
                    </a>
                    <button className="btn-copy" onClick={handleCopyLink}>
                        {linkCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
            </div>

            {/* Game Status */}
            <GameStatusDisplay
                gameState={gameState}
                onStartGame={handleStartGame}
                onNextQuestion={handleNextQuestion}
                onCreateNew={() => navigate('/')}
            />

            {/* Add Questions (only in waiting state) */}
            {gameState.status === 'waiting' && (
                <div className="admin-section">
                    <h2>Add Questions</h2>
                    <QuestionForm onSubmit={handleSubmitQuestion} />
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
