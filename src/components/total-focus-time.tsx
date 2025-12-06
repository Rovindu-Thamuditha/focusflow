
"use client"

import { Timer } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface TotalFocusTimeProps {
  totalHours: number;
}

export function TotalFocusTime({ totalHours }: TotalFocusTimeProps) {
  const [displayHours, setDisplayHours] = useState(totalHours);
  const prevHoursRef = useRef(totalHours);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const startValue = prevHoursRef.current;
    const endValue = totalHours;
    const duration = 1000;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const newDisplayValue = startValue + (endValue - startValue) * progress;
      setDisplayHours(newDisplayValue);

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // Ensure the final value is precise
        setDisplayHours(endValue);
        prevHoursRef.current = endValue;
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Update ref in case of interruption
      prevHoursRef.current = totalHours; 
    };
  }, [totalHours]);

  const hours = Math.floor(displayHours);
  const minutes = Math.round((displayHours * 60) % 60);

  return (
    <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-semibold p-2 rounded-lg bg-secondary">
      <Timer className="h-5 w-5 text-accent" />
      <div className="flex items-baseline">
        <span className="text-lg text-foreground">{String(hours).padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground">h</span>
        <span className="text-lg text-foreground ml-1">{String(minutes).padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground">m</span>
      </div>
    </div>
  );
}
