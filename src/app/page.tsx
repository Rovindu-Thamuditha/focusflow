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
import { defaultSubjects } from '@/lib/subjects';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

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
  const { user, loading } = useUser();
  const router = useRouter();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>([]);
  const [isChallengeSolved, setChallengeSolved] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sleepHours, setSleepHours] = useState<number[]>([22, 23, 0, 1, 2, 3, 4, 5, 6, 7]);
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [language, setLanguage] = useState<'english' | 'sinhala'>('english');
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && isClient && !userDataLoaded) {
      const loadUserData = async () => {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          const todayString = new Date().toDateString();
          const lastVisitDate = data.lastVisit;

          setSleepHours(data.settings?.sleepHours || [22, 23, 0, 1, 2, 3, 4, 5, 6, 7]);
          setSubjects(data.settings?.subjects || defaultSubjects);
          setLanguage(data.settings?.language || 'english');

          if (lastVisitDate !== todayString) {
             setChallengeSolved(false);
             setTimeBlocks(createInitialState(data.settings?.sleepHours || sleepHours));
          } else {
            setTimeBlocks(data.timeBlocks || createInitialState(data.settings?.sleepHours || sleepHours));
            setChallengeSolved(data.isChallengeSolved || false);
          }
        } else {
          // New user, set initial state
          setTimeBlocks(createInitialState(sleepHours));
        }
        setUserDataLoaded(true);
      };
      loadUserData();
    } else if (!user && isClient) {
        // Handle no user case (localStorage for guests)
        const savedBlocks = localStorage.getItem('focusflow_time_blocks');
        const savedSolved = localStorage.getItem('focusflow_challenge_solved');
        const savedSleepHours = localStorage.getItem('focusflow_sleep_hours');
        const savedSubjects = localStorage.getItem('focusflow_subjects');
        const savedLanguage = localStorage.getItem('focusflow_language');
        const todayString = new Date().toDateString();
        const lastVisitDate = localStorage.getItem('focusflow_last_visit');

        if (savedSleepHours) setSleepHours(JSON.parse(savedSleepHours));
        if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
        if (savedLanguage) setLanguage(savedLanguage as 'english' | 'sinhala');

        if (lastVisitDate !== todayString) {
             localStorage.setItem('focusflow_last_visit', todayString);
             localStorage.setItem('focusflow_challenge_solved', 'false');
             setChallengeSolved(false);
             setTimeBlocks(createInitialState(savedSleepHours ? JSON.parse(savedSleepHours) : sleepHours));
        } else {
             setTimeBlocks(savedBlocks ? JSON.parse(savedBlocks) : createInitialState(savedSleepHours ? JSON.parse(savedSleepHours) : sleepHours));
             setChallengeSolved(savedSolved === 'true');
        }
    }
  }, [user, isClient, userDataLoaded, router]);


  useEffect(() => {
    const saveData = async () => {
      if (!isClient || !userDataLoaded) return;

      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const dataToSave = {
          lastVisit: new Date().toDateString(),
          timeBlocks,
          isChallengeSolved,
          settings: { sleepHours, subjects, language }
        };
        await setDoc(userDocRef, dataToSave, { merge: true });
      } else {
        localStorage.setItem('focusflow_time_blocks', JSON.stringify(timeBlocks));
        localStorage.setItem('focusflow_challenge_solved', String(isChallengeSolved));
        localStorage.setItem('focusflow_sleep_hours', JSON.stringify(sleepHours));
        localStorage.setItem('focusflow_subjects', JSON.stringify(subjects));
        localStorage.setItem('focusflow_language', language);
      }
    };
    saveData();
  }, [timeBlocks, isChallengeSolved, sleepHours, subjects, language, user, isClient, userDataLoaded]);

  
  const handleBlockUpdate = (hour: number, subject: string, duration: number) => {
    setTimeBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.hour === hour ? { ...block, subject, duration } : block
      )
    );
  };

  const handleSettingsSave = (newSleepHours: number[], newSubjects: Subject[], newLanguage: 'english' | 'sinhala') => {
    const sleepChanged = JSON.stringify(newSleepHours) !== JSON.stringify(sleepHours);
    
    setSleepHours(newSleepHours);
    setSubjects(newSubjects);
    setLanguage(newLanguage);
    
    if(sleepChanged) {
       setTimeBlocks(createInitialState(newSleepHours));
    }
  };

  const totalFocusedTime = useMemo(() => {
    if (!timeBlocks) return 0;
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

  if (loading || (isClient && !userDataLoaded && user)) {
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
            language={language}
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
                language={language}
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
