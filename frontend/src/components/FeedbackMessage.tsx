import React from 'react';

export type FeedbackType = 'correct' | 'wrong' | 'info';

interface FeedbackMessageProps {
    type: FeedbackType;
    text: string;
}

const FEEDBACK_STYLES: Record<FeedbackType, { background: string; color: string }> = {
    correct: {
        background: 'rgba(34, 197, 94, 0.2)',
        color: '#22c55e'
    },
    wrong: {
        background: 'rgba(239, 68, 68, 0.2)',
        color: '#ef4444'
    },
    info: {
        background: 'rgba(59, 130, 246, 0.2)',
        color: '#3b82f6'
    }
};

/**
 * Displays feedback messages for guess results.
 */
const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ type, text }) => {
    const style = FEEDBACK_STYLES[type];

    return (
        <div style={{
            textAlign: 'center',
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '1.1rem',
            background: style.background,
            color: style.color
        }}>
            {text}
        </div>
    );
};

export default FeedbackMessage;
