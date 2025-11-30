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
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';

const createInitialState = (sleepHours: number[]): TimeBlockState[] => {
  return Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // 8 AM to 7 PM
    const isSleep = sleepHours.includes(hour);
    return {
      hour: hour,
      subject: isSleep ? 'sleep' : 'idle',
      duration: isSleep ? 60 : 0,
      date: new Date().toISOString(),
    };
  });
};

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>([]);
  const [isChallengeSolved, setChallengeSolved] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sleepHours, setSleepHours] = useState<number[]>([22, 23, 0, 1, 2, 3, 4, 5, 6, 7]);
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [language, setLanguage] = useState<'english' | 'sinhala'>('english');
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [userName, setUserName] = useState('');
  
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  useEffect(() => {
    setIsClient(true);
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
    if (user && userDocRef && isClient && !userDataLoaded) {
      const loadUserData = async () => {
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          const todayString = new Date().toDateString();
          const lastVisitDate = data.lastVisit;

          setUserName(data.username || user.displayName || '');
          setSleepHours(data.settings?.sleepHours || [22, 23, 0, 1, 2, 3, 4, 5, 6, 7]);
          setSubjects(data.settings?.subjects || defaultSubjects);
          setLanguage(data.settings?.language || 'english');

          const timeBlockQuery = query(collection(firestore, 'users', user.uid, 'time_blocks'), where('date', '>=', new Date(todayString).toISOString()));
          const querySnapshot = await getDocs(timeBlockQuery);

          if (lastVisitDate !== todayString || querySnapshot.empty) {
             setChallengeSolved(false);
             const newBlocks = createInitialState(data.settings?.sleepHours || sleepHours);
             setTimeBlocks(newBlocks);
          } else {
             setTimeBlocks(querySnapshot.docs.map(d => d.data() as TimeBlockState));
             setChallengeSolved(data.isChallengeSolved || false);
          }
        } else {
          // New user, set initial state
          setUserName(user.displayName || '');
          const newBlocks = createInitialState(sleepHours);
          setTimeBlocks(newBlocks);
        }
        setUserDataLoaded(true);
      };
      loadUserData();
    } else if (!user && !isUserLoading && isClient) {
        router.push('/login');
    }
  }, [user, userDocRef, isClient, userDataLoaded, router, firestore, isUserLoading, sleepHours]);


  useEffect(() => {
    const saveData = async () => {
        if (!isClient || !userDataLoaded || !user || !timeBlocks.length || !userDocRef) return;

        const todayString = new Date().toDateString();
        
        const dataToSave = {
            lastVisit: todayString,
            isChallengeSolved,
            settings: { sleepHours, subjects, language },
            username: userName
        };
        await setDoc(userDocRef, dataToSave, { merge: true });

        const batch = writeBatch(firestore);
        const todayBlocksQuery = query(collection(firestore, 'users', user.uid, 'time_blocks'), where('date', '>=', new Date(todayString).toISOString()));
        const oldBlocksSnapshot = await getDocs(todayBlocksQuery);
        oldBlocksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        timeBlocks.forEach(block => {
            const blockDate = new Date(block.date);
            if (blockDate.toDateString() === todayString) {
                const blockRef = doc(collection(firestore, 'users', user.uid, 'time_blocks'));
                batch.set(blockRef, block);
            }
        });
        await batch.commit();
    };

    const debounceSave = setTimeout(saveData, 1000); 
    return () => clearTimeout(debounceSave);

  }, [timeBlocks, isChallengeSolved, sleepHours, subjects, language, user, userDocRef, isClient, userDataLoaded, userName, firestore]);

  
  const handleBlockUpdate = (hour: number, subject: string, duration: number) => {
    const todayString = new Date().toISOString();
    setTimeBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.hour === hour ? { ...block, subject, duration, date: todayString } : block
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
    const todayString = new Date().toDateString();
    return timeBlocks.reduce((total, block) => {
      const blockDate = new Date(block.date);
      if (blockDate.toDateString() === todayString && block.subject !== 'idle' && block.subject !== 'sleep') {
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

  if (isUserLoading || !isClient || !userDataLoaded) {
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
        {userName && <h2 className="text-3xl font-bold text-foreground mb-6">Welcome back, {userName}!</h2>}
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
