
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TimeBlockState, Subject, DailySummary } from '@/lib/types';
import { AccountabilityGrid } from '@/components/accountability-grid';
import { DailyChallenge } from '@/components/daily-challenge';
import { MainHeader } from '@/components/main-header';
import { dailyQuestions } from '@/lib/questions';
import { getDayOfYear, format, addDays, subDays, startOfDay, isToday, isFuture, differenceInHours } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { defaultSubjects } from '@/lib/subjects';
import { useUser, useAuth, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, collection, query, where, writeBatch, arrayUnion, orderBy, limit } from 'firebase/firestore';
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
import { TodoList } from '@/components/todo-list';
import { FloatingTimer } from '@/components/floating-timer';
import { WhatsNewDialog } from '@/components/whats-new-dialog';
import { OnboardingDialog } from '@/components/onboarding-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTimer } from '@/context/timer-context';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { StreakCounter } from '@/components/streak-counter';

const createInitialState = (sleepHours: number[], date: Date): TimeBlockState[] => {
  const dateString = format(date, 'yyyy-MM-dd');
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    subject: sleepHours.includes(i) ? 'sleep' : 'idle',
    duration: 0,
    date: dateString,
  }));
};

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { timerSubject, elapsedSeconds, lastStopTime, timerIsRunning } = useTimer();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>([]);
  const [solvedChallenges, setSolvedChallenges] = useState<boolean[]>([]);
  const [sleepHours, setSleepHours] = useState<number[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [language, setLanguage] = useState<'english' | 'sinhala'>('english');
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [userName, setUserName] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [streakGoal, setStreakGoal] = useState(2);

  // Feature toggles
  const [enableTimer, setEnableTimer] = useState(true);
  const [enableDailyChallenge, setEnableDailyChallenge] = useState(true);
  const [enableTodoList, setEnableTodoList] = useState(true);
  const [disableEditRestriction, setDisableEditRestriction] = useState(false);
  
  const userDocRef = useMemoFirebase(() => user && !user.isAnonymous ? doc(firestore!, 'users', user.uid) : null, [firestore, user]);
  const { data: userData } = useDoc(userDocRef);

  const dateString = useMemo(() => currentDate ? format(currentDate, 'yyyy-MM-dd') : null, [currentDate]);
  
  const timeBlockQuery = useMemoFirebase(() => {
    if (!user || user.isAnonymous || !firestore || !dateString) return null;
    return query(collection(firestore, 'users', user.uid, 'time_blocks'), where('date', '==', dateString));
  }, [user, firestore, dateString]);
  const { data: cloudTimeBlocks } = useCollection<TimeBlockState>(timeBlockQuery);

  const summariesQuery = useMemoFirebase(() => {
    if (!user || user.isAnonymous || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'daily_summaries'), orderBy('date', 'desc'), limit(40));
  }, [user, firestore]);
  const { data: summaries } = useCollection<DailySummary>(summariesQuery);

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      signInAnonymously(auth).catch(() => router.push('/login'));
    }
  }, [isUserLoading, user, auth, router]);
  
  useEffect(() => {
    setCurrentDate(startOfDay(new Date()));
  }, []);

  const currentStreak = useMemo(() => {
    if (!summaries || summaries.length === 0) return 0;
    const goalMins = streakGoal * 60;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    const todaySum = summaries.find(s => s.date === todayStr);
    const yesterdaySum = summaries.find(s => s.date === yesterdayStr);

    if ((!todaySum || todaySum.totalMinutes < goalMins) && (!yesterdaySum || yesterdaySum.totalMinutes < goalMins)) return 0;

    let count = 0;
    let checkDate = (todaySum && todaySum.totalMinutes >= goalMins) ? new Date() : subDays(new Date(), 1);
    
    while (true) {
      const dStr = format(checkDate, 'yyyy-MM-dd');
      const s = summaries.find(sum => sum.date === dStr);
      if (s && s.totalMinutes >= goalMins) {
        count++;
        checkDate = subDays(checkDate, 1);
      } else break;
    }
    return count;
  }, [summaries, streakGoal]);

  useEffect(() => {
    if (!user || !currentDate) return;
  
    if (user.isAnonymous) {
      const s = JSON.parse(localStorage.getItem('gridFocusSettings') || '{}');
      setSleepHours(s.sleepHours || []);
      setSubjects(s.subjects || defaultSubjects);
      setLanguage(s.language || 'english');
      setEnableTimer(s.enableTimer !== false);
      setEnableDailyChallenge(s.enableDailyChallenge !== false);
      setEnableTodoList(s.enableTodoList !== false);
      setDisableEditRestriction(s.disableEditRestriction === true);
      setStreakGoal(s.streakGoal || 2);
      if (!s.hasCompletedOnboarding) setShowOnboarding(true);
      
      const localBlocks = JSON.parse(localStorage.getItem('gridTimeBlocks') || '{}')[format(currentDate, 'yyyy-MM-dd')];
      setTimeBlocks(localBlocks || createInitialState(s.sleepHours || [], currentDate));
      setUserDataLoaded(true);
    } else if (userData) {
      setUserName(userData.username || user.displayName || '');
      const s = userData.settings || {};
      if (!userData.hasCompletedOnboarding) setShowOnboarding(true);
      setSleepHours(s.sleepHours || []);
      setSubjects(s.subjects || defaultSubjects);
      setLanguage(s.language || 'english');
      setEnableTimer(s.enableTimer !== false);
      setEnableDailyChallenge(s.enableDailyChallenge !== false);
      setEnableTodoList(s.enableTodoList !== false);
      setDisableEditRestriction(s.disableEditRestriction === true);
      setStreakGoal(s.streakGoal || 2);
      setUserDataLoaded(true);
    }
  }, [user, userData, currentDate]);

  useEffect(() => {
    if (cloudTimeBlocks && cloudTimeBlocks.length > 0) {
      const normalized = Array.from({ length: 24 }, (_, i) => cloudTimeBlocks.find(b => b.hour === i) || { hour: i, subject: sleepHours.includes(i) ? 'sleep' : 'idle', duration: 0, date: dateString! });
      setTimeBlocks(normalized.sort((a, b) => a.hour - b.hour));
    } else if (currentDate && !user?.isAnonymous && userDataLoaded) {
      setTimeBlocks(createInitialState(sleepHours, currentDate));
    }
  }, [cloudTimeBlocks, sleepHours, dateString, currentDate, user, userDataLoaded]);

  useDebouncedEffect(() => {
    if (!userDataLoaded || showOnboarding) return;
    const settings = { sleepHours, subjects, language, enableTimer, enableDailyChallenge, enableTodoList, disableEditRestriction, streakGoal, hasCompletedOnboarding: true };
    if (user?.isAnonymous) localStorage.setItem('gridFocusSettings', JSON.stringify(settings));
    else if (userDocRef) setDoc(userDocRef, { settings }, { merge: true });
  }, [subjects, sleepHours, language, enableTimer, enableDailyChallenge, enableTodoList, disableEditRestriction, streakGoal, userDocRef, userDataLoaded, showOnboarding]);

  useDebouncedEffect(() => {
    if (!userDataLoaded || timeBlocks.length !== 24 || !dateString) return;
    if (user?.isAnonymous) {
      const all = JSON.parse(localStorage.getItem('gridTimeBlocks') || '{}');
      all[dateString] = timeBlocks;
      localStorage.setItem('gridTimeBlocks', JSON.stringify(all));
    } else if (user && firestore) {
      const batch = writeBatch(firestore);
      let total = 0;
      timeBlocks.forEach(b => {
        batch.set(doc(firestore, 'users', user.uid, 'time_blocks', `${dateString}_${b.hour}`), b);
        if (b.subject !== 'idle' && b.subject !== 'sleep') total += b.duration;
      });
      batch.set(doc(firestore, 'users', user.uid, 'daily_summaries', dateString), { id: dateString, date: dateString, totalMinutes: total });
      batch.commit();
    }
  }, [timeBlocks, dateString, user, firestore, userDataLoaded]);

  const totalFocusedTime = useMemo(() => timeBlocks.reduce((t, b) => (b.subject !== 'idle' && b.subject !== 'sleep' && b.subject !== 'class' ? t + (b.duration / 60) : t), 0), [timeBlocks]);

  if (isUserLoading || !user || !userDataLoaded || !currentDate) return <div className="flex items-center justify-center min-h-screen"><GridFocusLoader /></div>;

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader totalFocusedTime={totalFocusedTime} />
      <main className="flex-grow container mx-auto p-4 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">Welcome back, {userName || 'Scholar'}!</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subDays(currentDate, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <h3 className="text-lg font-bold w-48 text-center">{format(currentDate, 'PPP')}</h3>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 1))} disabled={isToday(currentDate)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <StreakCounter count={currentStreak} goalHours={streakGoal} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-2 border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <AccountabilityGrid blocks={timeBlocks} subjects={subjects} onBlockUpdate={(h, s, d) => setTimeBlocks(prev => prev.map(b => b.hour === h ? { ...b, subject: s, duration: d } : b))} viewingDate={currentDate} liveTime={new Date()} disableEditRestriction={disableEditRestriction} />
            </CardContent>
          </Card>
          <div className="space-y-6">
             {enableDailyChallenge && <DailyChallenge question={dailyQuestions[(getDayOfYear(currentDate) + questionIndex) % dailyQuestions.length]} isSolved={false} onSolveChange={() => {}} language={language} isToday={isToday(currentDate)} questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} totalQuestions={dailyQuestions.length} />}
             {enableTodoList && <TodoList />}
          </div>
        </div>
      </main>
      {enableTimer && <FloatingTimer subjects={subjects} />}
      <FeedbackDialog isOpen={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
      <WhatsNewDialog seenVersions={[]} onMarkAsSeen={() => {}} />
      <OnboardingDialog isOpen={showOnboarding} onFinish={(s) => { setDoc(userDocRef!, { hasCompletedOnboarding: true }, { merge: true }); setShowOnboarding(false); }} initialSettings={{ subjects, sleepHours, language, enableTimer, enableDailyChallenge, enableTodoList, enableAiInsights: false, disableEditRestriction }} />
    </div>
  );
}
