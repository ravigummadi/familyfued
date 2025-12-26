import React, { useState } from 'react';

interface Answer {
    text: string;
    weight: number;
}

interface QuestionFormProps {
    onSubmit: (question: string, answers: Answer[]) => Promise<void>;
}

/**
 * Form component for adding new questions to the game.
 * Handles answer management and validation.
 */
const QuestionForm: React.FC<QuestionFormProps> = ({ onSubmit }) => {
    const [question, setQuestion] = useState('');
    const [answers, setAnswers] = useState<Answer[]>([{ text: '', weight: 10 }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddAnswer = () => {
        setAnswers([...answers, { text: '', weight: 10 }]);
    };

    const handleRemoveAnswer = (index: number) => {
        if (answers.length > 1) {
            setAnswers(answers.filter((_, i) => i !== index));
        }
    };

    const handleAnswerChange = (index: number, field: 'text' | 'weight', value: string) => {
        const updated = [...answers];
        if (field === 'text') {
            updated[index].text = value;
        } else {
            updated[index].weight = parseInt(value, 10) || 0;
        }
        setAnswers(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || answers.every(a => !a.text.trim())) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(question, answers.filter(a => a.text.trim()));
            // Reset form on success
            setQuestion('');
            setAnswers([{ text: '', weight: 10 }]);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label className="form-label">Survey Question</label>
                <input
                    type="text"
                    className="form-input"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Name something people do on vacation..."
                    disabled={isSubmitting}
                />
            </div>

            {answers.map((answer, index) => (
                <div key={index} className="answer-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Answer {index + 1}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={answer.text}
                            onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                            placeholder="Enter answer..."
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Points</label>
                        <input
                            type="number"
                            className="form-input"
                            value={answer.weight}
                            onChange={(e) => handleAnswerChange(index, 'weight', e.target.value)}
                            min="0"
                            disabled={isSubmitting}
                        />
                    </div>
                    <button
                        type="button"
                        className="btn-danger-custom"
                        onClick={() => handleRemoveAnswer(index)}
                        style={{ height: '44px', marginTop: '1.5rem' }}
                        disabled={isSubmitting || answers.length <= 1}
                    >
                        X
                    </button>
                </div>
            ))}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                    type="button"
                    className="btn-primary-custom"
                    onClick={handleAddAnswer}
                    disabled={isSubmitting}
                >
                    + Add Answer
                </button>
                <button
                    type="submit"
                    className="btn-gold"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Question'}
                </button>
            </div>
        </form>
    );
};

export default QuestionForm;
