"use client";

import { useState, useEffect, useMemo } from 'react';
import type { TimeBlockState, Subject } from '@/lib/types';
import { AccountabilityGrid } from '@/components/accountability-grid';
import { DailyChallenge } from '@/components/daily-challenge';
import { MainHeader } from '@/components/main-header';
import { dailyQuestions } from '@/lib/questions';
import { getDayOfYear } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsDialog } from '@/components/settings-dialog';
import { subjects as allSubjects } from '@/lib/subjects';

const createInitialState = (sleepHours: number[]): TimeBlockState[] => {
  return Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // 8 AM to 7 PM
    const isSleep = sleepHours.includes(hour);
    return {
      hour: hour,
      subject: isSleep ? 'sleep' : 'idle',
      duration: isSleep ? 60 : 0,
    };
  });
};

export default function Home() {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>([]);
  const [isChallengeSolved, setChallengeSolved] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sleepHours, setSleepHours] = useState<number[]>([22, 23, 0, 1, 2, 3, 4, 5, 6, 7]);
  const [subjects, setSubjects] = useState<Subject[]>(allSubjects);

  useEffect(() => {
    setIsClient(true);

    const todayString = new Date().toDateString();
    const lastVisitDate = localStorage.getItem('focusflow_last_visit');
    
    // Load state from localStorage
    const savedBlocks = localStorage.getItem('focusflow_time_blocks');
    const savedSolved = localStorage.getItem('focusflow_challenge_solved');
    const savedSleepHours = localStorage.getItem('focusflow_sleep_hours');

    if (savedSleepHours) {
      setSleepHours(JSON.parse(savedSleepHours));
    }

    if (lastVisitDate !== todayString) {
      localStorage.setItem('focusflow_last_visit', todayString);
      localStorage.setItem('focusflow_challenge_solved', 'false');
      setChallengeSolved(false);
      setTimeBlocks(createInitialState(savedSleepHours ? JSON.parse(savedSleepHours) : sleepHours));
    } else {
      setTimeBlocks(savedBlocks ? JSON.parse(savedBlocks) : createInitialState(savedSleepHours ? JSON.parse(savedSleepHours) : sleepHours));
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

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('focusflow_sleep_hours', JSON.stringify(sleepHours));
    }
  }, [sleepHours, isClient]);
  
  const handleBlockUpdate = (hour: number, subject: string, duration: number) => {
    setTimeBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.hour === hour ? { ...block, subject, duration } : block
      )
    );
  };

  const handleSettingsSave = (newSleepHours: number[]) => {
    setSleepHours(newSleepHours);
    // Reset blocks according to new sleep hours for the day
    setTimeBlocks(createInitialState(newSleepHours));
  };

  const totalFocusedTime = useMemo(() => {
    return timeBlocks.reduce((total, block) => {
      if (block.subject !== 'idle' && block.subject !== 'sleep') {
        return total + (block.duration / 60);
      }
      return total;
    }, 0);
  }, [timeBlocks]);

  const currentQuestion = useMemo(() => {
    if (!isClient) return dailyQuestions[0];
    const dayIndex = getDayOfYear(new Date());
    return dailyQuestions[dayIndex % dailyQuestions.length];
  }, [isClient]);

  if (!isClient) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading FocusFlow...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader totalFocusedTime={totalFocusedTime}>
         <SettingsDialog
            subjects={subjects}
            sleepHours={sleepHours}
            onSave={handleSettingsSave}
          />
      </MainHeader>
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <Card className="lg:col-span-2">
            <CardContent className="p-4 sm:p-6">
              <AccountabilityGrid
                blocks={timeBlocks}
                subjects={subjects}
                onBlockUpdate={handleBlockUpdate}
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
