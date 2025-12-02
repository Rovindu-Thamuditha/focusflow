'use client';

import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';
import { usePeriodicStrike } from '@/hooks/use-periodic-strike';

// Generates a jagged path string for an SVG lightning bolt.
const generateJaggedBolt = (width: number, height: number): string => {
    let path = `M ${width / 2} 0`;
    let currentY = 0;
    const segmentLength = 20;
    const jitter = 40;

    while (currentY < height) {
        const nextY = currentY + segmentLength;
        const nextX = width / 2 + (Math.random() * 2 - 1) * jitter;
        path += ` L ${nextX} ${nextY}`;
        currentY = nextY;
    }
    return path;
};


export function StrangerThingsLightning() {
  const { theme } = useTheme();
  const lightningPath = useRef('');
  const [isStriking, setIsStriking] = useState(false);

  // Use the custom hook to get a trigger that updates periodically.
  const strikeCount = usePeriodicStrike({ baseInterval: 7000, jitter: 3000 });

  useEffect(() => {
    if (theme !== 'stranger-things') {
        setIsStriking(false);
        // Ensure the class is removed when switching themes
        if (document.body.classList.contains('strike-active')) {
            document.body.classList.remove('strike-active');
        }
        return;
    }

    // Only trigger on subsequent strikes, not the initial mount.
    if (strikeCount > 0) {
        // 1. Generate the unique shape
        lightningPath.current = generateJaggedBolt(window.innerWidth, window.innerHeight);
        setIsStriking(true);

        // 2. Trigger the CSS animation for the glitch/shake
        document.body.classList.add('strike-active');

        // 3. Remove the class after the animation finishes
        const timeout = setTimeout(() => {
            document.body.classList.remove('strike-active');
            setIsStriking(false);
        }, 300); // Duration should match the visual event

        return () => clearTimeout(timeout);
    }
  }, [strikeCount, theme]); // Reruns every time the strike timer triggers or theme changes

  if (!isStriking || theme !== 'stranger-things') {
    return null;
  }

  // Render the dynamically created lightning bolt (using SVG)
  return (
    <svg className="lightning-svg" preserveAspectRatio="none">
        <path 
            d={lightningPath.current} 
            className="lightning-bolt" 
        />
    </svg>
  );
}