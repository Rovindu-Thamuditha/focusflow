
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TimeBlockState, Subject } from '@/lib/types';
import { AccountabilityGrid } from '@/components/accountability-grid';
import { DailyChallenge } from '@/components/daily-challenge';
import { MainHeader } from '@/components/main-header';
import { dailyQuestions } from '@/lib/questions';
import { getDayOfYear, format, addDays, subDays, startOfDay, isToday, isFuture, differenceInHours } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsDialog } from '@/components/settings-dialog';
import { defaultSubjects } from '@/lib/subjects';
import { useUser, useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { CurrentTime } from '@/components/current-time';
import { TodoList } from '@/components/todo-list';

const createInitialState = (sleepHours: number[], date: Date): TimeBlockState[] => {
  const dateString = format(date, 'yyyy-MM-dd');
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const isSleep = sleepHours.includes(hour);
    return {
      hour: hour,
      subject: isSleep ? 'sleep' : 'idle',
      duration: 0,
      date: dateString,
    };
  }).sort((a, b) => a.hour - b.hour);
};

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [liveTime, setLiveTime] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>(createInitialState([], new Date()));
  const [isChallengeSolved, setChallengeSolved] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sleepHours, setSleepHours] = useState<number[]>([]);
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
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000); // Update every second
    return () => clearInterval(timer);
  }, [user, isUserLoading, router]);

  const loadDayData = useCallback(async (dateToLoad: Date) => {
    if (!user || !firestore || !userDataLoaded) return;
  
    const dateString = format(dateToLoad, 'yyyy-MM-dd');
    
    try {
      const timeBlockQuery = query(
        collection(firestore, 'users', user.uid, 'time_blocks'), 
        where('date', '==', dateString)
      );
      const querySnapshot = await getDocs(timeBlockQuery);
  
      if (!querySnapshot.empty) {
        const blocksFromDb = querySnapshot.docs.map(d => d.data() as TimeBlockState);
        // Normalize data to ensure exactly 24 blocks
        const normalizedBlocks = Array.from({ length: 24 }, (_, i) => {
            const foundBlock = blocksFromDb.find(b => b.hour === i);
            if (foundBlock) return foundBlock;
            // If a block is missing from DB, create a default one
            const isSleep = sleepHours.includes(i);
            return { hour: i, subject: isSleep ? 'sleep' : 'idle', duration: 0, date: dateString };
        });
        setTimeBlocks(normalizedBlocks.sort((a, b) => a.hour - b.hour));

      } else {
        // No data for this day, create a fresh grid
        setTimeBlocks(createInitialState(sleepHours, dateToLoad));
      }
  
      if (isToday(dateToLoad)) {
        const userDoc = await getDoc(userDocRef!);
        if (userDoc.exists()) {
          setChallengeSolved(userDoc.data().isChallengeSolved || false);
        } else {
          setChallengeSolved(false);
        }
      } else {
        setChallengeSolved(false);
      }
  
    } catch (e) {
      console.error("Error loading day data: ", e);
    }
  }, [user, firestore, userDocRef, sleepHours, userDataLoaded]);

  useEffect(() => {
    if (user && userDocRef && !userDataLoaded) {
      const loadInitialUserData = async () => {
        try {
          const userDoc = await getDoc(userDocRef);
        
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.username || user.displayName || '');
            const userSleepHours = data.settings?.sleepHours || [];
            setSleepHours(userSleepHours);
            setSubjects(data.settings?.subjects || defaultSubjects);
            setLanguage(data.settings?.language || 'english');
          } else {
             setUserName(user.displayName || '');
          }
        } catch (e) {
            console.error("Error loading user data", e);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userDocRef.path, operation: 'get' }));
        } finally {
            setUserDataLoaded(true); 
        }
      };
      loadInitialUserData();
    }
  }, [user, userDocRef, userDataLoaded]);
  
  useEffect(() => {
    if (userDataLoaded) {
      loadDayData(currentDate);
    }
  }, [currentDate, userDataLoaded, loadDayData]);
  
  useEffect(() => {
    if (!isClient || !userDataLoaded || !user || !userDocRef ) return;

    const handler = setTimeout(() => {
        if (!firestore) return;
        const batch = writeBatch(firestore);
        
        const settingsData = {
            username: userName,
            settings: { sleepHours, subjects, language },
             ...(isToday(currentDate) && {isChallengeSolved})
        };
        batch.set(userDocRef, settingsData, { merge: true });

        const isEditable = differenceInHours(new Date(), currentDate) <= 36;
        if (isEditable && timeBlocks.length === 24) {
            const dateString = format(currentDate, 'yyyy-MM-dd');

            timeBlocks.forEach(block => {
                const blockWithDate = { ...block, date: dateString };
                const blockDocRef = doc(firestore, 'users', user.uid, 'time_blocks', `${dateString}_${block.hour}`);
                batch.set(blockDocRef, blockWithDate);
            });
        }
        
        batch.commit().catch(error => {
          console.error("Error saving data batch:", error);
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${user.uid}`, operation: 'write', requestResourceData: { settings: settingsData, timeBlocks } }));
        });

    }, 2000);

    return () => clearTimeout(handler);

  }, [timeBlocks, isChallengeSolved, sleepHours, subjects, language, userName, currentDate, user, userDocRef, firestore, isClient, userDataLoaded]);
  
  const handleBlockUpdate = (hour: number, subject: string, duration: number) => {
    setTimeBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.hour === hour ? { ...block, subject, duration, date: format(currentDate, 'yyyy-MM-dd') } : block
      )
    );
  };

  const handleSettingsSave = (
    newSleepHours: number[], 
    newSubjects: Subject[], 
    newLanguage: 'english' | 'sinhala'
    ) => {
      setSleepHours(newSleepHours);
      setSubjects(newSubjects);
      setLanguage(newLanguage);
  
      setTimeBlocks(currentBlocks => {
          const newGrid = createInitialState(newSleepHours, currentDate);
          
          return newGrid.map(newBlock => {
              if (newBlock.subject === 'sleep') {
                  return newBlock; 
              }
              const oldBlock = currentBlocks.find(b => b.hour === newBlock.hour);
              if (oldBlock && oldBlock.subject !== 'idle' && oldBlock.subject !== 'sleep') {
                  return oldBlock;
              }
              return newBlock;
          });
      });
  };

  const handleResetDay = () => {
    setTimeBlocks(createInitialState(sleepHours, currentDate));
  };

  const changeDay = (offset: number) => {
    const newDate = startOfDay(offset > 0 ? addDays(currentDate, offset) : subDays(currentDate, -offset));
    if (isFuture(newDate)) return;
    setCurrentDate(newDate);
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

  if (isUserLoading || !isClient || !userDataLoaded) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <GridFocusLoader />
          <p className="mt-4 text-lg">Loading GridFocus...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader totalFocusedTime={totalFocusedTime}>
         <CurrentTime time={liveTime} />
         <SettingsDialog
            subjects={subjects}
            sleepHours={sleepHours}
            language={language}
            onSave={handleSettingsSave}
          />
      </MainHeader>
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              {userName && <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back, {userName}!</h2>}
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="icon" onClick={() => changeDay(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg sm:text-xl font-semibold text-center w-48 sm:w-64">{format(currentDate, 'PPP')}</h3>
                <Button variant="outline" size="icon" onClick={() => changeDay(1)} disabled={isToday(currentDate)}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <Card className="lg:col-span-2">
            <CardContent className="p-4 sm:p-6">
              <AccountabilityGrid
                blocks={timeBlocks}
                subjects={subjects}
                onBlockUpdate={handleBlockUpdate}
                viewingDate={currentDate}
                liveTime={liveTime}
              />
            </CardContent>
          </Card>
          <div className="space-y-6">
             <DailyChallenge
                question={currentQuestion}
                isSolved={isChallengeSolved}
                onSolveChange={isToday(currentDate) ? setChallengeSolved : () => {}}
                language={language}
                isToday={isToday(currentDate)}
              />
              <TodoList />
          </div>
        </div>
         <div className="mt-8 flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset Day
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all progress for {format(currentDate, 'PPP')}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetDay}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </main>

      <FeedbackDialog />

      <footer className="text-center py-4 text-muted-foreground text-sm">
        <p>Made with ♥ for focused minds by <a href="https://github.com/Rovindu-Thamuditha/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Tipiz</a></p>
      </footer>
    </div>
  );
}
