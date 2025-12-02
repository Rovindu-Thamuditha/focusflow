
'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Subject } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  hour: number;
  subjects: Subject[];
  currentSubjectId: string;
  currentDuration: number;
  onBlockUpdate: (hour: number, subject: string, duration: number) => void;
}

export function FocusTimer({ hour, subjects, currentSubjectId, currentDuration, onBlockUpdate }: FocusTimerProps) {
  const [sessionSubject, setSessionSubject] = useState(currentSubjectId === 'idle' ? subjects[0].id : currentSubjectId);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // When the component unmounts (e.g., hour changes), stop the timer
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    if (currentSubjectId === 'idle') {
      onBlockUpdate(hour, sessionSubject, currentDuration);
    }
    setIsRunning(true);
    startTimeRef.current = Date.now() - elapsedTime * 1000;
    intervalRef.current = setInterval(() => {
      const newElapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(newElapsedTime);
      const newTotalDuration = Math.round(currentDuration + newElapsedTime / 60);
      onBlockUpdate(hour, sessionSubject, Math.min(newTotalDuration, 60));
    }, 1000);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const finalElapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const newTotalDuration = Math.round(currentDuration + finalElapsedTime / 60);
    onBlockUpdate(hour, sessionSubject, Math.min(newTotalDuration, 60));
    setElapsedTime(0); // Reset for next session
  };

  const handleStart = () => {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const displayDuration = currentDuration + Math.floor(elapsedTime / 60);

  return (
    <div className="focus-timer-container flex flex-col items-center justify-center w-full h-full gap-1">
      <div className="text-xs font-bold -mt-1">
        {displayDuration > 0 ? `${displayDuration} min` : 'Current Hour'}
      </div>
      
      <div className="timer-display">{formatTime(elapsedTime)}</div>
      
      <Select
        onValueChange={setSessionSubject}
        defaultValue={sessionSubject}
        disabled={isRunning}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Subject" />
        </SelectTrigger>
        <SelectContent>
          {subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep').map(s => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="timer-controls">
        <Button 
            size="icon" 
            onClick={handleStart} 
            className={cn(isRunning && "bg-destructive hover:bg-destructive/80")}
            title={isRunning ? "Stop Timer" : "Start Timer"}
        >
          {isRunning ? <Square /> : <Play />}
        </Button>
      </div>
    </div>
  );
}
