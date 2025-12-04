
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
import { FloatingTimer } from '@/components/floating-timer';
import { WhatsNewDialog } from '@/components/whats-new-dialog';
import { OnboardingDialog } from '@/components/onboarding-dialog';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [liveTime, setLiveTime] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>([]);
  const [solvedChallenges, setSolvedChallenges] = useState<boolean[]>(Array(dailyQuestions.length).fill(false));
  const [isClient, setIsClient] = useState(false);
  const [sleepHours, setSleepHours] = useState<number[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [language, setLanguage] = useState<'english' | 'sinhala'>('english');
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [userName, setUserName] = useState('');
  const [seenWhatsNewVersions, setSeenWhatsNewVersions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [hasBeenPromptedForFeedback, setHasBeenPromptedForFeedback] = useState(false);

  // Feature toggles
  const [enableTimer, setEnableTimer] = useState(true);
  const [enableDailyChallenge, setEnableDailyChallenge] = useState(true);
  const [enableTodoList, setEnableTodoList] = useState(true);

  // Timer State
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [timerSubject, setTimerSubject] = useState<string>(defaultSubjects[0]?.id || 'math');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  const userDocRef = useMemoFirebase(() => user && !user.isAnonymous ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

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
    if (!user || !userDataLoaded) return;
  
    const dateString = format(dateToLoad, 'yyyy-MM-dd');
    
    // ANONYMOUS USER - LOAD FROM LOCAL STORAGE
    if (user.isAnonymous) {
        const localBlocksStr = localStorage.getItem('gridFocusTimeBlocks');
        const localBlocks = localBlocksStr ? JSON.parse(localBlocksStr) : {};
        const dayBlocks = localBlocks[dateString];

        if (dayBlocks) {
            setTimeBlocks(dayBlocks);
        } else {
            setTimeBlocks(createInitialState(sleepHours, dateToLoad));
        }
        // Load local challenge state if it's today
        if(isToday(dateToLoad)) {
            const localChallengesStr = localStorage.getItem('gridFocusSolvedChallenges');
            const localChallenges = localChallengesStr ? JSON.parse(localChallengesStr) : {};
            setSolvedChallenges(localChallenges.solved || Array(dailyQuestions.length).fill(false));
            setQuestionIndex(localChallenges.qIndex || 0);
        } else {
            setSolvedChallenges(Array(dailyQuestions.length).fill(false));
            setQuestionIndex(0);
        }
        return;
    }

    // LOGGED-IN USER - LOAD FROM FIRESTORE
    if (!firestore) return;
    try {
      const timeBlockQuery = query(
        collection(firestore, 'users', user.uid, 'time_blocks'), 
        where('date', '==', dateString)
      );
      const querySnapshot = await getDocs(timeBlockQuery);
  
      if (!querySnapshot.empty) {
        const blocksFromDb = querySnapshot.docs.map(d => d.data() as TimeBlockState);
        const normalizedBlocks = Array.from({ length: 24 }, (_, i) => {
            const foundBlock = blocksFromDb.find(b => b.hour === i);
            return foundBlock || { hour: i, subject: sleepHours.includes(i) ? 'sleep' : 'idle', duration: 0, date: dateString };
        });
        setTimeBlocks(normalizedBlocks.sort((a, b) => a.hour - b.hour));
      } else {
        setTimeBlocks(createInitialState(sleepHours, dateToLoad));
      }
  
      if (isToday(dateToLoad) && userDocRef) {
        const userDoc = await getDoc(userDocRef);
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
        setSolvedChallenges(Array(dailyQuestions.length).fill(false));
        setQuestionIndex(0);
      }
  
    } catch (e) {
      console.error("Error loading day data: ", e);
    }
  }, [user, firestore, userDocRef, sleepHours, userDataLoaded]);

  useEffect(() => {
    // Initial data load effect
    if (!user || !isClient || userDataLoaded) return;
  
    const loadInitialUserData = async () => {
      // ANONYMOUS USER
      if (user.isAnonymous) {
        const settingsStr = localStorage.getItem('gridFocusSettings');
        if (settingsStr) {
          const settings = JSON.parse(settingsStr);
          setUserName(''); // No name for anonymous users
          setSleepHours(settings.sleepHours || []);
          setSubjects(settings.subjects || defaultSubjects);
          setLanguage(settings.language || 'english');
          setEnableTimer(settings.enableTimer !== false);
          setEnableDailyChallenge(settings.enableDailyChallenge !== false);
          setEnableTodoList(settings.enableTodoList !== false);
        } else {
           // First-time anonymous user
           setUserName('');
           setSleepHours([]);
           setSubjects(defaultSubjects);
           setShowOnboarding(true); // Show onboarding to set preferences locally
        }
        setUserDataLoaded(true);
        return;
      }
  
      // LOGGED-IN USER
      if (userDocRef) {
        try {
          const userDoc = await getDoc(userDocRef);
        
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.username || user.displayName || '');
            const settings = data.settings || {};
            
            if (!data.hasCompletedOnboarding && !user.isAnonymous) {
              setShowOnboarding(true);
            }

            setSleepHours(settings.sleepHours || []);
            setSubjects(settings.subjects || defaultSubjects);
            setLanguage(settings.language || 'english');
            setEnableTimer(settings.enableTimer !== false);
            setEnableDailyChallenge(settings.enableDailyChallenge !== false);
            setEnableTodoList(settings.enableTodoList !== false);
            setSeenWhatsNewVersions(data.seenWhatsNewVersions || []);
            setHasBeenPromptedForFeedback(data.hasBeenPromptedForFeedback || false);
          } else {
             // New logged-in user, but doc doesn't exist yet (might happen on first login)
             setUserName(user.displayName || 'User');
             if (!user.isAnonymous) {
                setShowOnboarding(true);
             }
          }
        } catch (e) {
            console.error("Error loading user data", e);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userDocRef.path, operation: 'get' }));
        } finally {
            setUserDataLoaded(true); 
        }
      }
    };
    loadInitialUserData();
  }, [user, isClient, userDocRef, userDataLoaded]);
  
  useEffect(() => {
    if (userDataLoaded) {
      loadDayData(currentDate);
    }
  }, [currentDate, userDataLoaded, loadDayData]);
  
  // Data persistence effect
  useEffect(() => {
    if (!isClient || !userDataLoaded || showOnboarding) return;

    const handler = setTimeout(() => {
        // ANONYMOUS USER - SAVE TO LOCAL STORAGE
        if (user?.isAnonymous) {
            const settings = { 
                sleepHours, subjects, language, enableTimer, 
                enableDailyChallenge, enableTodoList 
            };
            localStorage.setItem('gridFocusSettings', JSON.stringify(settings));

            if (timeBlocks.length > 0) {
                const dateString = format(currentDate, 'yyyy-MM-dd');
                const localBlocksStr = localStorage.getItem('gridFocusTimeBlocks');
                const localBlocks = localBlocksStr ? JSON.parse(localBlocksStr) : {};
                localBlocks[dateString] = timeBlocks;
                localStorage.setItem('gridFocusTimeBlocks', JSON.stringify(localBlocks));
            }
            if (isToday(currentDate)) {
                localStorage.setItem('gridFocusSolvedChallenges', JSON.stringify({ solved: solvedChallenges, qIndex: questionIndex }));
            }
            return;
        }

        // LOGGED-IN USER - SAVE TO FIRESTORE
        if (user && userDocRef && firestore) {
            const batch = writeBatch(firestore);
            
            const todayString = format(new Date(), 'yyyy-MM-dd');
            const settingsData:any = {
                settings: { 
                  sleepHours, subjects, language,
                  enableTimer, enableDailyChallenge, enableTodoList
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
              // This might be too noisy on every save, but good for debugging
              // errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${user.uid}`, operation: 'write', requestResourceData: { settings: settingsData } }));
            });
        }
    }, 2000);

    return () => clearTimeout(handler);

  }, [timeBlocks, solvedChallenges, questionIndex, sleepHours, subjects, language, userName, currentDate, user, userDocRef, firestore, isClient, userDataLoaded, enableTimer, enableDailyChallenge, enableTodoList, showOnboarding]);
  
  // Timer effect
  useEffect(() => {
    if (timerIsRunning) {
        const currentHour = new Date().getHours();
        
        setTimeBlocks(currentBlocks =>
            currentBlocks.map(block =>
                block.hour === currentHour ? { ...block, subject: timerSubject } : block
            )
        );

        const interval = setInterval(() => {
            setElapsedSeconds(prev => {
                const newElapsed = prev + 1;
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
            if (newBlock.subject === 'sleep') return newBlock; 
            const oldBlock = currentBlocks.find(b => b.hour === newBlock.hour);
            if (oldBlock && oldBlock.subject !== 'idle' && oldBlock.subject !== 'sleep') return oldBlock;
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
    const oldSleepHours = [...sleepHours];
    
    setSubjects(newSettings.subjects);
    setSleepHours(newSettings.sleepHours);
    setLanguage(newSettings.language);
    setEnableTimer(newSettings.enableTimer);
    setEnableDailyChallenge(newSettings.enableDailyChallenge);
    setEnableTodoList(newSettings.enableTodoList);

    if (JSON.stringify(oldSleepHours.sort()) !== JSON.stringify([...newSettings.sleepHours].sort())) {
      handleGridReset(newSettings.sleepHours);
    }
  };

  const handleOnboardingFinish = async (newSettings: any) => {
    handleSettingsSave(newSettings);
    if(userDocRef) {
      try {
        await setDoc(userDocRef, { hasCompletedOnboarding: true }, { merge: true });
      } catch (e) {
        console.error("Error finalizing onboarding:", e);
      }
    }
    // For anonymous users, the settings are already saved locally by handleSettingsSave
    setShowOnboarding(false);
  }

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

  // Periodic feedback prompt effect
  useEffect(() => {
    if (user && !user.isAnonymous && totalFocusedTime > 5 && !hasBeenPromptedForFeedback && userDocRef) {
      const feedbackToast = toast({
        title: "Enjoying GridFocus?",
        description: "Your feedback helps us improve. Would you like to share your thoughts?",
        action: (
          <Button size="sm" onClick={() => setIsFeedbackDialogOpen(true)}>
            Give Feedback
          </Button>
        ),
        duration: 15000,
      });

      updateDoc(userDocRef, { hasBeenPromptedForFeedback: true });
      setHasBeenPromptedForFeedback(true);
    }
  }, [totalFocusedTime, hasBeenPromptedForFeedback, user, userDocRef, toast]);


  const currentQuestion = useMemo(() => {
    if (!isClient) return dailyQuestions[0];
    const dayIndex = getDayOfYear(new Date());
    const qIndex = isToday(currentDate) ? questionIndex : 0;
    return dailyQuestions[(dayIndex + qIndex) % dailyQuestions.length];
  }, [isClient, currentDate, questionIndex]);

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
    <div className="flex flex-col min-h-screen">
      <MainHeader totalFocusedTime={totalFocusedTime}>
         <CurrentTime time={liveTime} />
         <SettingsDialog
            subjects={subjects}
            sleepHours={sleepHours}
            language={language}
            enableTimer={enableTimer}
            enableDailyChallenge={enableDailyChallenge}
            enableTodoList={enableTodoList}
            onSave={handleSettingsSave}
          />
      </MainHeader>
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              {userName && <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back, {userName}!</h2>}
              {user.isAnonymous && <p className="text-sm text-amber-500">Your data is temporary. Sign up to save your progress permanently.</p>}
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
      <FeedbackDialog isOpen={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
      {!user.isAnonymous && <WhatsNewDialog 
        seenVersions={seenWhatsNewVersions}
        onMarkAsSeen={markWhatsNewAsSeen}
      />}
      {showOnboarding && (
        <OnboardingDialog 
          isOpen={showOnboarding}
          onFinish={handleOnboardingFinish}
          initialSettings={{
            subjects,
            sleepHours,
            language,
            enableTimer,
            enableDailyChallenge,
            enableTodoList,
          }}
        />
      )}

      <footer className="text-center py-4 text-muted-foreground text-sm space-x-4">
        <span>Made with ♥ by <a href="https://github.com/Rovindu-Thamuditha/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Tipiz</a></span>
        <span>|</span>
        <button onClick={() => setIsFeedbackDialogOpen(true)} className="text-primary hover:underline">Send Feedback</button>
      </footer>
    </div>
  );
}
