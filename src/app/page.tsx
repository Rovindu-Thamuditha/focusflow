
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
import { SandTimerLoader } from '@/components/sand-timer-loader';
import { FeedbackDialog } from '@/components/feedback-dialog';

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
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>([]);
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
        const blocks = querySnapshot.docs.map(d => d.data() as TimeBlockState);
        setTimeBlocks(blocks.sort((a, b) => a.hour - b.hour));
      } else {
        // When no data exists for the selected day, create a fresh slate.
        // This uses the already-loaded sleepHours from user settings.
        setTimeBlocks(createInitialState(sleepHours, dateToLoad));
      }
  
      // Challenge solved state only matters for today
      if (isToday(dateToLoad)) {
        const userDoc = await getDoc(userDocRef!);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setChallengeSolved(data.isChallengeSolved || false);
        } else {
          setChallengeSolved(false);
        }
      } else {
        // Not today, so challenge is not solved for this view
        setChallengeSolved(false);
      }
  
    } catch (e) {
      console.error("Error loading day data: ", e);
    }
  }, [user, firestore, userDocRef, sleepHours, userDataLoaded]);

  // Effect for initial user data load
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
             // Leave other settings as default for a new user
          }
        } catch (e) {
            console.error("Error loading user data", e);
            const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setUserDataLoaded(true); 
        }
      };
      loadInitialUserData();
    }
  }, [user, userDocRef, userDataLoaded]);
  
  // Effect to load data for the current date once user data is loaded
  useEffect(() => {
    if (userDataLoaded) {
      loadDayData(currentDate);
    }
    // This should run when the date changes or when user data is first loaded.
  }, [currentDate, userDataLoaded, loadDayData]);
  
  // Consolidated effect for saving all data to Firestore
  useEffect(() => {
    // Don't save anything until the initial data load is complete.
    if (!isClient || !userDataLoaded || !user || !userDocRef ) return;

    const handler = setTimeout(() => {
        const batch = writeBatch(firestore);
        
        // 1. Save user settings (username, language, subjects, sleepHours)
        const settingsData = {
            username: userName,
            settings: { sleepHours, subjects, language },
             ...(isToday(currentDate) && {isChallengeSolved})
        };
        batch.set(userDocRef, settingsData, { merge: true });

        // 2. Save time blocks for the current day
        // Only allow edits for the last 36 hours for performance/security
        const isEditable = differenceInHours(new Date(), currentDate) <= 36;
        if (isEditable && timeBlocks.length === 24) {
            const dateString = format(currentDate, 'yyyy-MM-dd');

            // This is a "blind write" - it doesn't query first.
            // It just creates/overwrites the blocks for the current date.
            timeBlocks.forEach(block => {
                const blockWithDate = { ...block, date: dateString };
                // We create a predictable doc ID to ensure we are overwriting.
                const blockDocRef = doc(firestore, 'users', user.uid, 'time_blocks', `${dateString}_${block.hour}`);
                batch.set(blockDocRef, blockWithDate);
            });
        }
        
        // Commit all batched writes
        batch.commit().catch(error => {
          console.error("Error saving data batch:", error);
          // Emitting a generic error as this could be settings or time_blocks write failing
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: `users/${user.uid}`,
              operation: 'write', 
              requestResourceData: { settings: settingsData, timeBlocks }
            })
          )
        });

    }, 2000); // Debounce saves by 2 seconds

    return () => clearTimeout(handler);

  }, [timeBlocks, isChallengeSolved, sleepHours, subjects, language, userName, currentDate, user, userDocRef, firestore, isClient, userDataLoaded]);
  
  const handleBlockUpdate = (hour: number, subject: string, duration: number) => {
    setTimeBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.hour === hour ? { ...block, subject, duration, date: format(currentDate, 'yyyy-MM-dd') } : block
      )
    );
  };

  const handleSettingsSave = (newSleepHours: number[], newSubjects: Subject[], newLanguage: 'english' | 'sinhala') => {
      setSleepHours(newSleepHours);
      setSubjects(newSubjects);
      setLanguage(newLanguage);
  
      // After saving settings, rebuild the current day's grid state
      // This is the key part to prevent duplication.
      setTimeBlocks(currentBlocks => {
          // Start with a fresh grid based on new sleep hours
          const newGrid = createInitialState(newSleepHours, currentDate);
          
          // Re-apply any existing work from the *current* blocks onto the new grid
          return newGrid.map(newBlock => {
              if (newBlock.subject === 'sleep') {
                  return newBlock; // New sleep hours take precedence
              }
              const oldBlock = currentBlocks.find(b => b.hour === newBlock.hour);
              // If there was an old block that was not idle/sleep, preserve its state
              if (oldBlock && oldBlock.subject !== 'idle' && oldBlock.subject !== 'sleep') {
                  return oldBlock;
              }
              // Otherwise, use the new idle block
              return newBlock;
          }).sort((a, b) => a.hour - b.hour);
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
          <SandTimerLoader />
          <p className="mt-4 text-lg">Loading GridFocus...</p>
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
              />
            </CardContent>
          </Card>
          <div className="lg:col-span-1">
             <DailyChallenge
                question={currentQuestion}
                isSolved={isChallengeSolved}
                onSolveChange={isToday(currentDate) ? setChallengeSolved : () => {}}
                language={language}
                isToday={isToday(currentDate)}
              />
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
                  <AlertDialogDescription>This will reset all progress for {format(currentDate, 'PPP')}. This action cannot be undone.</AlertDialogDescription>
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
