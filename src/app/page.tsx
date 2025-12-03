
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
import { useUser, useAuth, useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, getDocs, collection, query, where, writeBatch, arrayUnion, updateDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, ToyBrick } from 'lucide-react';
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
import { CurrentTime } from '@/components/current-time';
import { TodoList } from '@/components/todo-list';
import { FloatingTimer } from '@/components/floating-timer';
import { WhatsNewDialog } from '@/components/whats-new-dialog';
import { StrangerThingsLightning } from '@/components/stranger-things-lightning';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';

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
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { theme } = useTheme();
  const { toast, dismiss } = useToast();
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [liveTime, setLiveTime] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>(createInitialState([], new Date()));
  const [solvedChallenges, setSolvedChallenges] = useState<boolean[]>(Array(dailyQuestions.length).fill(false));
  const [isClient, setIsClient] = useState(false);
  const [sleepHours, setSleepHours] = useState<number[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [language, setLanguage] = useState<'english' | 'sinhala'>('english');
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [userName, setUserName] = useState('');
  const [seenWhatsNewVersions, setSeenWhatsNewVersions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  // Feature toggles
  const [enableTimer, setEnableTimer] = useState(true);
  const [enableDailyChallenge, setEnableDailyChallenge] = useState(true);
  const [enableTodoList, setEnableTodoList] = useState(true);
  const [enableLightning, setEnableLightning] = useState(true);

  // Timer State
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [timerSubject, setTimerSubject] = useState<string>(defaultSubjects[0]?.id || 'math');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  
  // Set initial flipped state when theme changes
  useEffect(() => {
    if (theme === 'stranger-things') {
      setIsFlipped(true);
    } else {
      setIsFlipped(false);
    }
  }, [theme]);

  // Effect to show the hint toast
  useEffect(() => {
    let toastId: string | undefined;

    if (theme === 'stranger-things' && isFlipped) {
      const { id } = toast({
        variant: 'destructive',
        duration: Infinity, // Keep it visible
        title: (
          <div className="flex items-center gap-2">
            <Icons.logo className="h-6 w-6" />
            <span className="text-lg font-bold">A voice echoes...</span>
          </div>
        ),
        description: (
          <p className="text-base italic">
            "Click what is most familiar to escape this place..."
          </p>
        ),
      });
      toastId = id;
    }

    return () => {
      if (toastId) {
        dismiss(toastId);
      }
    };
  }, [theme, isFlipped, toast, dismiss]);

  useEffect(() => {
    setIsClient(true);
    if (!isUserLoading && !user) {
        if (auth) {
            signInAnonymously(auth).catch(error => {
                console.error("Anonymous sign-in failed:", error);
            });
        }
    }
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000); // Update every second
    return () => clearInterval(timer);
  }, [user, isUserLoading, auth]);

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
  
      // Load challenge state
      if (isToday(dateToLoad)) {
        const userDoc = await getDoc(userDocRef!);
        if (userDoc.exists()) {
           const todayString = format(new Date(), 'yyyy-MM-dd');
           const dailyData = userDoc.data().daily?.[todayString];
           setSolvedChallenges(dailyData?.solvedChallenges || Array(dailyQuestions.length).fill(false));
           setQuestionIndex(dailyData?.questionIndex || 0);
        } else {
           setSolvedChallenges(Array(dailyQuestions.length).fill(false));
           setQuestionIndex(0);
        }
      } else {
        // For past or future days, we can decide what to show.
        // For simplicity, let's reset or load historical state if we were to implement that.
        setSolvedChallenges(Array(dailyQuestions.length).fill(false));
        setQuestionIndex(0);
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
            const settings = data.settings || {};
            setSleepHours(settings.sleepHours || []);
            setSubjects(settings.subjects || defaultSubjects);
            setLanguage(settings.language || 'english');
            setEnableTimer(settings.enableTimer !== false);
            setEnableDailyChallenge(settings.enableDailyChallenge !== false);
            setEnableTodoList(settings.enableTodoList !== false);
            setEnableLightning(settings.enableLightning !== false);
            setSeenWhatsNewVersions(data.seenWhatsNewVersions || []);
          } else {
             setUserName(user.displayName || (user.isAnonymous ? '' : 'User'));
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
        
        const todayString = format(new Date(), 'yyyy-MM-dd');
        const settingsData:any = {
            username: userName,
            settings: { 
              sleepHours, 
              subjects, 
              language,
              enableTimer,
              enableDailyChallenge,
              enableTodoList,
              enableLightning,
            },
        };
        if(isToday(currentDate)){
            settingsData.daily = {
                [todayString]: {
                    solvedChallenges: solvedChallenges,
                    questionIndex: questionIndex,
                }
            }
        }

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

  }, [timeBlocks, solvedChallenges, questionIndex, sleepHours, subjects, language, userName, currentDate, user, userDocRef, firestore, isClient, userDataLoaded, enableTimer, enableDailyChallenge, enableTodoList, enableLightning]);
  
  // Timer effect
  useEffect(() => {
    if (timerIsRunning) {
        const currentHour = new Date().getHours();
        
        // Update the subject of the current hour block as soon as the timer starts
        setTimeBlocks(currentBlocks =>
            currentBlocks.map(block =>
                block.hour === currentHour ? { ...block, subject: timerSubject } : block
            )
        );

        const interval = setInterval(() => {
            setElapsedSeconds(prev => {
                const newElapsed = prev + 1;
                // Update duration every minute
                if (newElapsed > 0 && newElapsed % 60 === 0) {
                    const minutesToAdd = 1;
                    setTimeBlocks(currentBlocks =>
                        currentBlocks.map(block => {
                            if (block.hour === currentHour) {
                                const newDuration = Math.min(block.duration + minutesToAdd, 60);
                                return { ...block, duration: newDuration };
                            }
                            return block;
                        })
                    );
                }
                return newElapsed;
            });
        }, 1000);
        setTimerIntervalId(interval);
        return () => clearInterval(interval);
    } else if (timerIntervalId) {
        clearInterval(timerIntervalId);
        setTimerIntervalId(null);
    }
  }, [timerIsRunning, timerSubject]);

  const handleBlockUpdate = (hour: number, subject: string, duration: number) => {
    setTimeBlocks(currentBlocks =>
      currentBlocks.map(block =>
        block.hour === hour ? { ...block, subject, duration, date: format(currentDate, 'yyyy-MM-dd') } : block
      )
    );
  };

  const handleGridReset = (newSleepHours: number[]) => {
    setTimeBlocks(currentBlocks => {
        const newGrid = createInitialState(newSleepHours, currentDate);
        
        return newGrid.map(newBlock => {
            if (newBlock.subject === 'sleep') {
                return newBlock; 
            }
            // Find the corresponding old block to preserve its data if it's not idle/sleep
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

  const handleSolveChange = (solved: boolean) => {
    const newSolvedChallenges = [...solvedChallenges];
    newSolvedChallenges[questionIndex] = solved;
    setSolvedChallenges(newSolvedChallenges);
  };
  
  const handleSettingsSave = (newSettings: any) => {
    const oldSleepHours = [...sleepHours]; // Create a copy for comparison
    
    setSubjects(newSettings.subjects);
    setSleepHours(newSettings.sleepHours);
    setLanguage(newSettings.language);
    setEnableTimer(newSettings.enableTimer);
    setEnableDailyChallenge(newSettings.enableDailyChallenge);
    setEnableTodoList(newSettings.enableTodoList);
    setEnableLightning(newSettings.enableLightning);

    // Only reset grid if sleep hours actually changed
    if (JSON.stringify(oldSleepHours.sort()) !== JSON.stringify([...newSettings.sleepHours].sort())) {
      handleGridReset(newSettings.sleepHours);
    }
  };

  const markWhatsNewAsSeen = async (version: string) => {
    if (!userDocRef) return;
    try {
        await updateDoc(userDocRef, {
            seenWhatsNewVersions: arrayUnion(version)
        });
        setSeenWhatsNewVersions(prev => [...prev, version]);
    } catch (e) {
        console.error("Error marking What's New as seen:", e);
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
    // Use the stored questionIndex for today, otherwise start from 0 for past days
    const qIndex = isToday(currentDate) ? questionIndex : 0;
    return dailyQuestions[(dayIndex + qIndex) % dailyQuestions.length];
  }, [isClient, currentDate, questionIndex]);

  const handleFlipClick = () => {
    if (isFlipped) {
      setIsAnimating(true);
      // The animation is 1 second long. After it finishes, update the state.
      setTimeout(() => {
        setIsFlipped(false);
        setIsAnimating(false);
      }, 1000);
    } else {
      setIsFlipped(true);
    }
  };


  if (isUserLoading || !isClient || !user || !userDataLoaded) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <GridFocusLoader />
          <p className="mt-4 text-lg">Loading GridFocus...</p>
        </div>
    );
  }

  const activeTimerSubject = timerIsRunning ? subjects.find(s => s.id === timerSubject) : null;


  return (
    <div className={cn("flex flex-col min-h-screen", 
        theme === 'stranger-things' && isFlipped && "is-flipped",
        theme === 'stranger-things' && isAnimating && "is-flipping"
    )}>
      <MainHeader 
        totalFocusedTime={totalFocusedTime}
        onFlipClick={handleFlipClick}
        isAnimating={isAnimating}
        settingsContent={
          <SettingsDialog
            subjects={subjects}
            sleepHours={sleepHours}
            language={language}
            enableTimer={enableTimer}
            enableDailyChallenge={enableDailyChallenge}
            enableTodoList={enableTodoList}
            enableLightning={enableLightning}
            onSave={handleSettingsSave}
          />
        }
      >
         <CurrentTime time={liveTime} />
      </MainHeader>
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              {userName && <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back, {userName}!</h2>}
              {user.isAnonymous && <p className="text-sm text-amber-500">Your data is temporary. Sign up to save your progress.</p>}
              <div className="flex items-center gap-2 mt-2 bg-secondary p-1 rounded-lg">
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
                activeTimerSubject={activeTimerSubject}
              />
            </CardContent>
          </Card>
          <div className="space-y-6">
             {enableDailyChallenge && (
                <DailyChallenge
                    question={dailyQuestions[questionIndex]}
                    isSolved={solvedChallenges[questionIndex]}
                    onSolveChange={handleSolveChange}
                    language={language}
                    isToday={isToday(currentDate)}
                    questionIndex={questionIndex}
                    setQuestionIndex={setQuestionIndex}
                    totalQuestions={dailyQuestions.length}
                />
             )}
             {enableTodoList && <TodoList />}
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

      {enableTimer && (
        <FloatingTimer
            subjects={subjects}
            isRunning={timerIsRunning}
            setIsRunning={setTimerIsRunning}
            subject={timerSubject}
            setSubject={setTimerSubject}
            elapsedSeconds={elapsedSeconds}
            setElapsedSeconds={setElapsedSeconds}
        />
      )}
      
      <WhatsNewDialog 
        seenVersions={seenWhatsNewVersions}
        onMarkAsSeen={markWhatsNewAsSeen}
      />

      {isClient && theme === 'stranger-things' && enableLightning && <StrangerThingsLightning isFlipped={isFlipped} />}

      <footer className="text-center py-4 text-muted-foreground text-sm">
        <p>Made with ♥ for focused minds by <a href="https://github.com/Rovindu-Thamuditha/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Tipiz</a></p>
      </footer>
    </div>
  );
}

    