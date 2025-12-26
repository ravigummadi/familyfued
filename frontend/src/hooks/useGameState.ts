import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { GameStatus } from '../types';

// Configuration constants
const POLL_INTERVAL_MS = 2000;

interface UseGameStateOptions {
    hostId?: string;
    enabled?: boolean;
}

interface UseGameStateResult {
    gameState: GameStatus | null;
    error: string | null;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

/**
 * Custom hook for fetching and polling game state.
 * Eliminates duplicated polling logic between Host and Player components.
 *
 * @param code - The 4-character game code
 * @param options - Configuration options
 * @returns Game state, error, loading status, and refresh function
 */
export function useGameState(
    code: string | undefined,
    options: UseGameStateOptions = {}
): UseGameStateResult {
    const { hostId, enabled = true } = options;

    const [gameState, setGameState] = useState<GameStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchGame = useCallback(async () => {
        if (!code || !enabled) return;

        try {
            const response = await api.get(`/api/games/${code}`, {
                headers: hostId ? { 'X-Host-Id': hostId } : {}
            });
            setGameState(response.data);
            setError(null);
        } catch (err) {
            setError('Game not found');
        } finally {
            setIsLoading(false);
        }
    }, [code, hostId, enabled]);

    // Initial fetch
    useEffect(() => {
        if (enabled) {
            setIsLoading(true);
            fetchGame();
        }
    }, [fetchGame, enabled]);

    // Set up polling
    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(fetchGame, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchGame, enabled]);

    return {
        gameState,
        error,
        isLoading,
        refresh: fetchGame
    };
}

export default useGameState;
