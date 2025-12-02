
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface Bolt {
    id: number;
    left: number;
    top: number;
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
        const numBolts = Math.floor(Math.random() * 2) + 1; // 1 to 2 bolts
        for (let i = 0; i < numBolts; i++) {
          newBolts.push({
            id: Date.now() + i,
            left: Math.random() * 100,
            top: (Math.random() * -30) - 20, // Start off-screen
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
            left: `${bolt.left}%`,
            top: `${bolt.top}%`,
          }}
        />
      ))}
    </div>
  );
}
