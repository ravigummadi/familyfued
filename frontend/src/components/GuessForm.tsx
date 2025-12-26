import React, { useState } from 'react';

interface GuessFormProps {
    onSubmit: (guess: string) => Promise<void>;
    disabled?: boolean;
}

/**
 * Form for submitting guesses during gameplay.
 */
const GuessForm: React.FC<GuessFormProps> = ({ onSubmit, disabled = false }) => {
    const [guess, setGuess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guess.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(guess.trim());
            setGuess('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="guess-form" onSubmit={handleSubmit}>
            <input
                type="text"
                className="guess-input"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Type your answer..."
                autoFocus
                disabled={disabled || isSubmitting}
            />
            <button
                type="submit"
                className="btn-guess"
                disabled={disabled || isSubmitting || !guess.trim()}
            >
                {isSubmitting ? '...' : 'Guess!'}
            </button>
        </form>
    );
};

export default GuessForm;
