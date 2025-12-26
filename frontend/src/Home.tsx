import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { GameMode } from './types';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState('');
    const [mode, setMode] = useState<GameMode>('auto');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleCreateGame = async () => {
        setIsCreating(true);
        setError('');

        try {
            const response = await api.post('/api/games', { mode });
            const gameCode = response.data.code;
            const hostId = response.data.host_id;

            // Store host ID for this game session
            sessionStorage.setItem(`host_${gameCode}`, hostId);

            navigate(`/game/${gameCode}/host`);
        } catch (err) {
            setError('Failed to create game. Please try again.');
            setIsCreating(false);
        }
    };

    const handleJoinGame = (e: React.FormEvent) => {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (code.length !== 4) {
            setError('Please enter a 4-character game code');
            return;
        }
        navigate(`/game/${code}`);
    };

    return (
        <div className="home-container">
            <div className="home-hero">
                <h1 className="home-title">🎯 Family Feud</h1>
                <p className="home-subtitle">Create a game and play with friends!</p>
            </div>

            <div className="home-cards">
                {/* Create Game Card */}
                <div className="home-card">
                    <h2>🎮 Create Game</h2>
                    <p>Start a new game and share the code with friends</p>

                    <div className="mode-selector">
                        <label className="mode-option">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'auto'}
                                onChange={() => setMode('auto')}
                            />
                            <span className="mode-label">
                                <strong>Auto Advance</strong>
                                <small>Moves to next question automatically</small>
                            </span>
                        </label>
                        <label className="mode-option">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'host'}
                                onChange={() => setMode('host')}
                            />
                            <span className="mode-label">
                                <strong>Host Controlled</strong>
                                <small>Host decides when to advance</small>
                            </span>
                        </label>
                    </div>

                    <button
                        className="btn-gold btn-large"
                        onClick={handleCreateGame}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Game'}
                    </button>
                </div>

                {/* Join Game Card */}
                <div className="home-card">
                    <h2>🎲 Join Game</h2>
                    <p>Enter a 4-character code to join</p>

                    <form onSubmit={handleJoinGame} className="join-form">
                        <input
                            type="text"
                            className="code-input"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="ABCD"
                            maxLength={4}
                            autoComplete="off"
                        />
                        <button type="submit" className="btn-primary-custom btn-large">
                            Join Game
                        </button>
                    </form>
                </div>
            </div>

            {error && (
                <div className="home-error">{error}</div>
            )}
        </div>
    );
};

export default Home;
