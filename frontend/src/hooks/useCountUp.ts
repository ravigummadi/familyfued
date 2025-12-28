import { useState, useEffect, useRef } from 'react';

/**
 * Hook for animating a number counting up to a target value
 * @param target The target number to count to
 * @param duration Animation duration in milliseconds
 * @returns Object containing current count and whether it's currently animating
 */
export function useCountUp(target: number, duration: number = 400) {
    const [count, setCount] = useState(target);
    const [isAnimating, setIsAnimating] = useState(false);
    const previousTarget = useRef(target);
    const animationRef = useRef<number | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip if target hasn't changed
        if (previousTarget.current === target) {
            return;
        }

        const start = previousTarget.current;
        previousTarget.current = target;

        // On first meaningful change from 0, just set immediately
        if (isFirstRender.current && start === 0) {
            isFirstRender.current = false;
            setCount(target);
            return;
        }
        isFirstRender.current = false;

        const startTime = performance.now();
        setIsAnimating(true);

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic for satisfying deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentCount = Math.round(start + (target - start) * eased);

            setCount(currentCount);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [target, duration]);

    return { count, isAnimating };
}

export default useCountUp;
