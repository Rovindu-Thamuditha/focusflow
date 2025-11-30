
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

const createInitialState = (sleepHours: number[], date: Date): TimeBlockState[] => {
  const dateString = format(date, 'yyyy-MM-dd');
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i; // 0 to 23
    const isSleep = sleepHours.includes(hour);
    return {
      hour: hour,
      subject: isSleep ? 'sleep' : 'idle',
      duration: isSleep ? 60 : 0,
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
    // Set initial state on first load for today
    if (isClient && !timeBlocks.length) {
      setTimeBlocks(createInitialState(sleepHours, currentDate));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  const loadDayData = useCallback(async (dateToLoad: Date) => {
    if (!user || !firestore) return;
  
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
        const userDoc = await getDoc(userDocRef!);
        const userSettings = userDoc.exists() ? userDoc.data().settings : {};
        const currentSleepHours = userSettings?.sleepHours || sleepHours;
        setTimeBlocks(createInitialState(currentSleepHours, dateToLoad));
      }
  
      if (isToday(dateToLoad)) {
        const userDoc = await getDoc(userDocRef!);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setChallengeSolved(data.isChallengeSolved || false);
        }
      } else {
        setChallengeSolved(false);
      }
  
    } catch (e) {
      console.error("Error loading day data: ", e);
    }
  }, [user, firestore, userDocRef, sleepHours]);


  // Load initial user data once
  useEffect(() => {
    if (user && userDocRef && !userDataLoaded) {
      const loadInitialUserData = async () => {
        try {
          const userDoc = await getDoc(userDocRef);
        
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.username || user.displayName || '');
            const userSleepHours = data.settings?.sleepHours || [22, 23, 0, 1, 2, 3, 4, 5, 6, 7];
            setSleepHours(userSleepHours);
            setSubjects(data.settings?.subjects || defaultSubjects);
            setLanguage(data.settings?.language || 'english');
            setTimeBlocks(createInitialState(userSleepHours, currentDate));
          } else {
             setUserName(user.displayName || '');
             setTimeBlocks(createInitialState(sleepHours, currentDate));
          }
          setUserDataLoaded(true); 
        } catch (e) {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
      };
      loadInitialUserData();
    }
  }, [user, userDocRef, userDataLoaded, currentDate, sleepHours]);
  
  // Refetch data only when date changes
  useEffect(() => {
    if (userDataLoaded) {
      loadDayData(currentDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, userDataLoaded]);
  

  useEffect(() => {
    const saveData = () => {
        if (!isClient || !userDataLoaded || !user || !timeBlocks.length || !userDocRef ) return;
        
        const dataToSave = {
            lastVisit: new Date().toDateString(),
            settings: { sleepHours, subjects, language },
            username: userName,
            ...(isToday(currentDate) && {isChallengeSolved})
        };

        setDoc(userDocRef, dataToSave, { merge: true }).catch(error => {
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: userDocRef.path,
              operation: 'update',
              requestResourceData: dataToSave,
            })
          )
        });

        const isEditable = differenceInHours(new Date(), currentDate) <= 36;
        if(!isEditable) return;

        const batch = writeBatch(firestore);
        
        const dateString = format(currentDate, 'yyyy-MM-dd');
        const todayBlocksQuery = query(collection(firestore, 'users', user.uid, 'time_blocks'), where('date', '==', dateString));
            
        getDocs(todayBlocksQuery).then(oldBlocksSnapshot => {
          oldBlocksSnapshot.forEach(doc => {
              batch.delete(doc.ref);
          });

          timeBlocks.forEach(block => {
              const blockWithDateString = { ...block, date: dateString };
              const blockRef = doc(collection(firestore, 'users', user.uid, 'time_blocks'));
              batch.set(blockRef, blockWithDateString);
          });

          batch.commit().catch(error => {
             errorEmitter.emit(
              'permission-error',
              new FirestorePermissionError({
                path: `users/${user.uid}/time_blocks`,
                operation: 'write',
                requestResourceData: timeBlocks
              })
            )
          });
        });
    };

    const debounceSave = setTimeout(saveData, 1500); 
    return () => clearTimeout(debounceSave);

  }, [timeBlocks, isChallengeSolved, sleepHours, subjects, language, user, userDocRef, isClient, userDataLoaded, userName, firestore, currentDate]);

  
  const handleBlockUpdate = (hour: number, subject: string, duration: number) => {
    setTimeBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.hour === hour ? { ...block, subject, duration, date: format(currentDate, 'yyyy-MM-dd') } : block
      ).sort((a, b) => a.hour - b.hour)
    );
  };
  
  const handleMarkAsSleep = (hour: number) => {
    setTimeBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.hour === hour ? { ...block, subject: 'sleep', duration: 60, date: format(currentDate, 'yyyy-MM-dd') } : block
      ).sort((a, b) => a.hour - b.hour)
    );
  };

  const handleSettingsSave = (newSleepHours: number[], newSubjects: Subject[], newLanguage: 'english' | 'sinhala') => {
    setSleepHours(newSleepHours);
    setSubjects(newSubjects);
    setLanguage(newLanguage);
    
    // Update the grid for the current day with new sleep hours
    setTimeBlocks(currentBlocks => {
      return currentBlocks.map(block => {
        const isNewSleep = newSleepHours.includes(block.hour);

        if (isNewSleep) {
          return { ...block, subject: 'sleep', duration: 60 };
        }
        // If it was a sleep block but isn't anymore, reset it to idle.
        if (block.subject === 'sleep' && !isNewSleep) {
           return { ...block, subject: 'idle', duration: 0 };
        }
        // Otherwise, keep the block as is.
        return block;
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading GridFocus...</div>
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
        <div className="flex justify-between items-center mb-6">
            <div>
              {userName && <h2 className="text-3xl font-bold text-foreground">Welcome back, {userName}!</h2>}
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="icon" onClick={() => changeDay(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-xl font-semibold text-center w-64">{format(currentDate, 'PPP')}</h3>
                <Button variant="outline" size="icon" onClick={() => changeDay(1)} disabled={isToday(currentDate)}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <Card className="lg:col-span-2">
            <CardContent className="p-4 sm:p-6">
              <AccountabilityGrid
                blocks={timeBlocks}
                subjects={subjects}
                onBlockUpdate={handleBlockUpdate}
                onMarkAsSleep={handleMarkAsSleep}
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
      </main>
      <footer className="text-center py-4 text-muted-foreground text-sm">
        <p>Made with &hearts; for focused minds.</p>
      </footer>
    </div>
  );
}
