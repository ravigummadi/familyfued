import React from 'react';
import { Answer } from '../types';

interface AnswerSlotsProps {
    totalAnswers: number;
    revealedAnswers: Answer[];
}

/**
 * Displays the answer slots for the current question.
 * Shows revealed answers and placeholders for hidden ones.
 */
const AnswerSlots: React.FC<AnswerSlotsProps> = ({ totalAnswers, revealedAnswers }) => {
    const slots = [];

    for (let i = 0; i < totalAnswers; i++) {
        const revealedAnswer = revealedAnswers[i];
        const isRevealed = i < revealedAnswers.length;

        slots.push(
            <div key={i} className={`answer-slot ${isRevealed ? 'revealed' : ''}`}>
                <span className="slot-number">{i + 1}</span>
                {isRevealed && revealedAnswer ? (
                    <>
                        <span className="answer-text">{revealedAnswer.text}</span>
                        <span className="answer-points">{revealedAnswer.weight}</span>
                    </>
                ) : (
                    <span className="answer-text hidden-text">. . . . .</span>
                )}
            </div>
        );
    }

    return <div className="answers-grid">{slots}</div>;
};

export default AnswerSlots;
