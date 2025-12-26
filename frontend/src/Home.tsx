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
        <main className="home-container" role="main">
            {/* SEO-friendly header with proper heading hierarchy */}
            <header className="home-hero">
                <h1 className="home-title">Family Feud Online</h1>
                <p className="home-subtitle">
                    Play Family Feud free with friends and family - no download required!
                </p>
            </header>

            <section className="home-cards" aria-label="Game options">
                {/* Create Game Card */}
                <article className="home-card">
                    <h2>Create Game</h2>
                    <p>Start a new Family Feud game with custom survey questions and share the code with friends</p>

                    <div className="mode-selector" role="radiogroup" aria-label="Game mode selection">
                        <label className="mode-option">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'auto'}
                                onChange={() => setMode('auto')}
                                aria-describedby="auto-mode-desc"
                            />
                            <span className="mode-label">
                                <strong>Auto Advance</strong>
                                <small id="auto-mode-desc">Moves to next question automatically</small>
                            </span>
                        </label>
                        <label className="mode-option">
                            <input
                                type="radio"
                                name="mode"
                                checked={mode === 'host'}
                                onChange={() => setMode('host')}
                                aria-describedby="host-mode-desc"
                            />
                            <span className="mode-label">
                                <strong>Host Controlled</strong>
                                <small id="host-mode-desc">Host decides when to advance</small>
                            </span>
                        </label>
                    </div>

                    <button
                        className="btn-gold btn-large"
                        onClick={handleCreateGame}
                        disabled={isCreating}
                        aria-busy={isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Free Game'}
                    </button>
                </article>

                {/* Join Game Card */}
                <article className="home-card">
                    <h2>Join Game</h2>
                    <p>Enter a 4-letter game code to join an existing Family Feud game</p>

                    <form onSubmit={handleJoinGame} className="join-form" aria-label="Join game form">
                        <label htmlFor="game-code" className="visually-hidden">Game Code</label>
                        <input
                            id="game-code"
                            type="text"
                            className="code-input"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="ABCD"
                            maxLength={4}
                            autoComplete="off"
                            aria-label="Enter 4-letter game code"
                        />
                        <button type="submit" className="btn-primary-custom btn-large">
                            Join Game
                        </button>
                    </form>
                </article>
            </section>

            {error && (
                <div className="home-error" role="alert" aria-live="polite">{error}</div>
            )}

            {/* SEO Content Section - Visible for crawlers and users */}
            <section className="seo-content" aria-label="About Family Feud Online">
                <h2>The Best Free Family Feud Game Online</h2>
                <p>
                    Welcome to Family Feud Online at feud.family - the easiest way to play Family Feud
                    with friends, family, coworkers, or classmates! Create your own custom survey
                    questions or use popular Family Feud-style questions for parties, game nights,
                    team building, and virtual gatherings.
                </p>

                <h3>How to Play Family Feud Online</h3>
                <ol>
                    <li><strong>Create a Game:</strong> Click "Create Free Game" to start hosting</li>
                    <li><strong>Add Questions:</strong> Write your own survey questions with answers and point values</li>
                    <li><strong>Share the Code:</strong> Give players your 4-letter game code</li>
                    <li><strong>Play Together:</strong> Guess the top answers - 3 strikes and you're out!</li>
                </ol>

                <h3>Why Choose Our Free Family Feud Game?</h3>
                <ul>
                    <li><strong>100% Free:</strong> No hidden fees, no ads, no premium features</li>
                    <li><strong>No Download:</strong> Play instantly in your browser on any device</li>
                    <li><strong>No Sign Up:</strong> Start playing immediately without creating an account</li>
                    <li><strong>Unlimited Players:</strong> Invite as many friends as you want</li>
                    <li><strong>Custom Questions:</strong> Create personalized Family Feud games</li>
                    <li><strong>Mobile Friendly:</strong> Works perfectly on phones, tablets, and computers</li>
                </ul>

                <h3>Perfect For</h3>
                <p>
                    Family game nights, birthday parties, holiday gatherings, classroom activities,
                    corporate team building, Zoom calls, Discord hangouts, and any time you want
                    to have fun with a group!
                </p>
            </section>
        </main>
    );
};

export default Home;
