'use client';

import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import { usePeriodicStrike } from '@/hooks/use-periodic-strike';

// Generates a more realistic, downward-branching lightning bolt path.
const generateJaggedBolt = (width: number, height: number, isFlipped: boolean): [string, number] => {
  let path = '';
  const strokeWidth = Math.floor(Math.random() * 2) + 2; // Random thickness between 2 and 4

  // Start at a random position along the top (or bottom if flipped) edge
  const startX = Math.random() * width;
  const startY = isFlipped ? height : 0;
  path += `M ${startX} ${startY}`;
  
  let currentX = startX;
  let currentY = startY;
  const segments = 15;
  const segmentLength = height / segments * (isFlipped ? -1 : 1);
  const jitter = 0.3 * Math.abs(segmentLength); // Jitter is proportional to segment length

  // Create the main bolt path
  while (isFlipped ? currentY > 0 : currentY < height) {
    const nextY = currentY + segmentLength;
    const nextX = currentX + (Math.random() * 2 - 1) * jitter * 2;
    path += ` L ${nextX} ${nextY}`;

    // Chance to create a branch
    if (Math.random() > 0.8) {
      let branchX = nextX;
      let branchY = nextY;
      const branchSegments = Math.floor(Math.random() * 5) + 3;
      path += ` M ${nextX} ${nextY}`; // Move to branch start

      for (let j = 0; j < branchSegments; j++) {
        branchY += segmentLength * 0.8; // Branches are also biased in the same direction
        branchX += (Math.random() * 2 - 1) * jitter * 3;
        path += ` L ${branchX} ${branchY}`;
        if(isFlipped ? branchY < 0 : branchY > height) break;
      }
      path += ` M ${nextX} ${nextY}`; // Return to main path
    }
    
    currentX = nextX;
    currentY = nextY;
  }

  return [path, strokeWidth];
};

interface StrangerThingsLightningProps {
    isFlipped: boolean;
}

export function StrangerThingsLightning({ isFlipped }: StrangerThingsLightningProps) {
  const { theme } = useTheme();
  const [lightningPath, setLightningPath] = useState('');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isStriking, setIsStriking] = useState(false);
  const strikeCount = usePeriodicStrike({ baseInterval: 7000, jitter: 3000 });

  useEffect(() => {
    if (theme !== 'stranger-things') {
      setIsStriking(false);
      if (document.body.classList.contains('strike-active')) {
        document.body.classList.remove('strike-active');
      }
      return;
    }

    if (strikeCount > 0) {
      const [newPath, newStrokeWidth] = generateJaggedBolt(window.innerWidth, window.innerHeight, isFlipped);
      setLightningPath(newPath);
      setStrokeWidth(newStrokeWidth);
      setIsStriking(true);

      document.body.classList.add('strike-active');

      const timeout = setTimeout(() => {
        document.body.classList.remove('strike-active');
        setIsStriking(false);
      }, 150); // Shortened duration for a quicker flash

      return () => clearTimeout(timeout);
    }
  }, [strikeCount, theme, isFlipped]);

  if (!isStriking || theme !== 'stranger-things') {
    return null;
  }

  return (
    <svg className="lightning-svg" preserveAspectRatio="none">
      <path 
        d={lightningPath} 
        className="lightning-bolt" 
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}
