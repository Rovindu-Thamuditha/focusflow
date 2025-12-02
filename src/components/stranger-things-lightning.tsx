
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface Bolt {
    id: number;
    x: number;
    y: number;
    height: number;
    width: number;
}

export function StrangerThingsLightning() {
  const { theme } = useTheme();
  const [bolts, setBolts] = useState<Bolt[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (theme !== 'stranger-things') {
      setIsFlashing(false);
      return;
    }

    const flashInterval = setInterval(() => {
      setIsFlashing(true);
      
      const createBolts = () => {
        const newBolts: Bolt[] = [];
        const numBolts = Math.floor(Math.random() * 3) + 1; // 1 to 3 bolts
        for (let i = 0; i < numBolts; i++) {
          newBolts.push({
            id: Date.now() + i,
            x: Math.random() * 100,
            y: Math.random() * 20, // Start from top
            height: Math.random() * 60 + 30, // 30% to 90% of height
            width: Math.random() * 2 + 1, // 1px to 3px wide
          });
        }
        setBolts(newBolts);
      }
      createBolts();
      
      setTimeout(() => {
        setIsFlashing(false);
        setBolts([]);
      }, 300);

    }, 7000 + Math.random() * 3000); // Every 7-10 seconds

    return () => clearInterval(flashInterval);

  }, [theme]);

  if (!isFlashing || theme !== 'stranger-things') {
    return null;
  }

  return (
    <div className="lightning flash">
      {bolts.map(bolt => (
        <div
          key={bolt.id}
          className="lightning-bolt"
          style={{
            left: `${bolt.x}%`,
            top: `${bolt.y}%`,
            height: `${bolt.height}vh`,
            width: `${bolt.width}px`,
          }}
        />
      ))}
    </div>
  );
}
