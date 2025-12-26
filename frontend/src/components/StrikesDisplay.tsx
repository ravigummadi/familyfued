import React from 'react';

interface StrikesDisplayProps {
    strikes: number;
    maxStrikes: number;
}

/**
 * Displays the current strike count as X marks.
 */
const StrikesDisplay: React.FC<StrikesDisplayProps> = ({ strikes, maxStrikes }) => {
    const strikeMarks = [];

    for (let i = 0; i < maxStrikes; i++) {
        strikeMarks.push(
            <span
                key={i}
                className={`strike-x ${i < strikes ? 'active' : ''}`}
            >
                X
            </span>
        );
    }

    return <div className="strikes-display">{strikeMarks}</div>;
};

export default StrikesDisplay;
