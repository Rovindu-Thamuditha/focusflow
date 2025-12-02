'use client';

import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';
import { usePeriodicStrike } from '@/hooks/use-periodic-strike';

// Generates a jagged, branching path string for an SVG lightning bolt.
const generateJaggedBolt = (width: number, height: number): [string, number] => {
  let path = '';
  const strokeWidth = Math.floor(Math.random() * 3) + 2; // Random thickness between 2 and 4

  const startSide = Math.floor(Math.random() * 4);
  let x, y, dx, dy;

  // Randomize starting edge
  switch (startSide) {
    case 0: // Top
      x = Math.random() * width;
      y = 0;
      dx = 0;
      dy = 1;
      break;
    case 1: // Right
      x = width;
      y = Math.random() * height;
      dx = -1;
      dy = 0;
      break;
    case 2: // Bottom
      x = Math.random() * width;
      y = height;
      dx = 0;
      dy = -1;
      break;
    default: // Left
      x = 0;
      y = Math.random() * height;
      dx = 1;
      dy = 0;
      break;
  }

  path += `M ${x} ${y}`;
  let currentX = x;
  let currentY = y;
  const segments = 15;
  const segmentLengthX = width / segments;
  const segmentLengthY = height / segments;
  const jitter = 80;

  for (let i = 0; i < segments; i++) {
    const nextX = currentX + (dx * segmentLengthX) + (Math.random() * 2 - 1) * jitter;
    const nextY = currentY + (dy * segmentLengthY) + (Math.random() * 2 - 1) * jitter;
    
    path += ` L ${nextX} ${nextY}`;

    // Random chance to create a branch
    if (Math.random() > 0.85) {
      const branchJitter = 40;
      const branchLength = 3 + Math.floor(Math.random() * 3);
      let branchX = nextX;
      let branchY = nextY;
      path += ` M ${nextX} ${nextY}`; // Move to branch start
      for (let j = 0; j < branchLength; j++) {
        branchX += (Math.random() * 2 - 1) * branchJitter;
        branchY += (Math.random() * 2 - 1) * branchJitter;
        path += ` L ${branchX} ${branchY}`;
      }
      path += ` M ${nextX} ${nextY}`; // Return to main path
    }

    currentX = nextX;
    currentY = nextY;
    
    // Stop if it goes way off screen
    if(currentX < -width || currentX > width*2 || currentY < -height || currentY > height*2) {
      break;
    }
  }

  return [path, strokeWidth];
};

export function StrangerThingsLightning() {
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
      const [newPath, newStrokeWidth] = generateJaggedBolt(window.innerWidth, window.innerHeight);
      setLightningPath(newPath);
      setStrokeWidth(newStrokeWidth);
      setIsStriking(true);

      document.body.classList.add('strike-active');

      const timeout = setTimeout(() => {
        document.body.classList.remove('strike-active');
        setIsStriking(false);
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [strikeCount, theme]);

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
