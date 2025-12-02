"use client";

import { useEffect, useRef, useState } from 'react';

interface UsePeriodicStrikeOptions {
    baseInterval?: number;
    jitter?: number;
}

/**
 * Custom hook to handle random interval logic for periodic effects.
 * @param {UsePeriodicStrikeOptions} options - Configuration for the interval.
 * @returns {number} A trigger value that updates every time a strike occurs.
 */
export const usePeriodicStrike = ({ baseInterval = 7000, jitter = 1000 }: UsePeriodicStrikeOptions = {}) => {
  const [strikeTrigger, setStrikeTrigger] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Function to calculate the next random strike time
    const setRandomTimeout = () => {
      // Calculates a delay between (baseInterval - jitter) and (baseInterval + jitter)
      const delay = baseInterval + (Math.random() * 2 * jitter) - jitter;

      timerRef.current = setTimeout(() => {
        // Increment the trigger to force a re-render/effect in the main component
        setStrikeTrigger(prev => prev + 1); 
        setRandomTimeout(); // Loop the function
      }, delay);
    };

    setRandomTimeout(); // Start the loop on mount

    // Cleanup on unmount
    return () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };
  }, [baseInterval, jitter]);

  return strikeTrigger; // Returns a value that updates every time a strike occurs
};
