import React, { useEffect, useState } from 'react';

interface StrikeFlashOverlayProps {
    show: boolean;
    onComplete?: () => void;
}

/**
 * Full-screen dramatic strike effect with giant X overlay.
 * Shows when a wrong answer is submitted.
 */
const StrikeFlashOverlay: React.FC<StrikeFlashOverlayProps> = ({ show, onComplete }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                onComplete?.();
            }, 600); // Match animation duration
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!isVisible) return null;

    return (
        <>
            <div className="strike-flash-overlay" />
            <div className="strike-x-overlay">X</div>
        </>
    );
};

export default StrikeFlashOverlay;
