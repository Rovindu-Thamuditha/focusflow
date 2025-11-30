"use client";

import { useState, useEffect, useMemo } from 'react';
import type { TimeBlockState, TimeBlockStatus } from '@/components/time-block';
import { AccountabilityGrid } from '@/components/accountability-grid';
import { DailyChallenge } from '@/components/daily-challenge';
import { MainHeader } from '@/components/main-header';
import { dailyQuestions } from '@/lib/questions';
import { getDayOfYear } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

const createInitialState = (): TimeBlockState[] => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    status: 'rest',
  }));
};

export default function Home() {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>([]);
  const [isChallengeSolved, setChallengeSolved] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const todayString = new Date().toDateString();
    const lastVisitDate = localStorage.getItem('focusflow_last_visit');
    
    // Load state from localStorage
    const savedBlocks = localStorage.getItem('focusflow_time_blocks');
    const savedSolved = localStorage.getItem('focusflow_challenge_solved');

    if (lastVisitDate !== todayString) {
      // Daily reset logic
      localStorage.setItem('focusflow_last_visit', todayString);
      localStorage.setItem('focusflow_challenge_solved', 'false');
      setChallengeSolved(false);
      // We keep the time blocks from the previous day
       setTimeBlocks(savedBlocks ? JSON.parse(savedBlocks) : createInitialState());
    } else {
      setTimeBlocks(savedBlocks ? JSON.parse(savedBlocks) : createInitialState());
      setChallengeSolved(savedSolved === 'true');
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('focusflow_time_blocks', JSON.stringify(timeBlocks));
    }
  }, [timeBlocks, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('focusflow_challenge_solved', String(isChallengeSolved));
    }
  }, [isChallengeSolved, isClient]);
  
  const handleBlockChange = (hour: number, newStatus: TimeBlockStatus) => {
    setTimeBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.hour === hour ? { ...block, status: newStatus } : block
      )
    );
  };

  const totalFocusedTime = useMemo(() => {
    return timeBlocks.reduce((total, block) => {
      if (block.status === 'focus') return total + 1;
      if (block.status === 'partial') return total + 0.5;
      return total;
    }, 0);
  }, [timeBlocks]);

  const currentQuestion = useMemo(() => {
    if (!isClient) return dailyQuestions[0];
    const dayIndex = getDayOfYear(new Date());
    return dailyQuestions[dayIndex % dailyQuestions.length];
  }, [isClient]);

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader totalFocusedTime={totalFocusedTime} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <Card className="lg:col-span-2">
            <CardContent className="p-4 sm:p-6">
              <AccountabilityGrid
                blocks={timeBlocks}
                onBlockChange={handleBlockChange}
              />
            </CardContent>
          </Card>
          <div className="lg:col-span-1">
             <DailyChallenge
                question={currentQuestion}
                isSolved={isChallengeSolved}
                onSolveChange={setChallengeSolved}
              />
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-muted-foreground text-sm">
        <p>Made with &hearts; for focused minds.</p>
      </footer>
    </div>
  );
}
