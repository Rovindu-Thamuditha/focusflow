
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { defaultSubjects } from '@/lib/subjects';

interface TimerContextType {
  timerIsRunning: boolean;
  elapsedSeconds: number;
  timerSubject: string;
  lastStopTime: number | null;
  setTimerSubject: (subject: string) => void;
  startTimer: () => void;
  stopTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerSubject, setTimerSubject] = useState<string>(defaultSubjects[0]?.id || 'math');
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [lastStopTime, setLastStopTime] = useState<number | null>(null);

  const startTimer = useCallback(() => {
    if (!timerIsRunning) {
      setElapsedSeconds(0); // Reset on new start
      setTimerIsRunning(true);
      setLastStopTime(null);
    }
  }, [timerIsRunning]);

  const stopTimer = useCallback(() => {
    if (timerIsRunning) {
      setTimerIsRunning(false);
      setLastStopTime(Date.now());
    }
  }, [timerIsRunning]);

  useEffect(() => {
    if (timerIsRunning) {
      const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      setTimerIntervalId(interval);

      return () => {
        clearInterval(interval);
        setTimerIntervalId(null);
      };
    }
  }, [timerIsRunning]);

  const value = {
    timerIsRunning,
    elapsedSeconds,
    timerSubject,
    lastStopTime,
    setTimerSubject,
    startTimer,
    stopTimer,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
