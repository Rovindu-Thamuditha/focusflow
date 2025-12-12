
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MainHeader } from '@/components/main-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDoc, doc, orderBy } from 'firebase/firestore';
import { subDays, startOfDay, format, parseISO, eachDayOfInterval } from 'date-fns';
import type { Subject, DailySummary } from '@/lib/types';
import { defaultSubjects } from '@/lib/subjects';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus, BrainCircuit, ArrowLeft } from 'lucide-react';
import { GridFocusLoader } from '@/components/grid-focus-loader';

const formatHoursAndMinutes = (totalMinutes: number): string => {
    if (totalMinutes === 0) return '0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    let result = '';
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0 || hours === 0) {
        result += `${minutes}m`;
    }
    return result.trim();
};

const CustomTooltip = ({ active, payload, label, subjects }: any) => {
  if (active && payload && payload.length) {
    const totalMinutes = payload.reduce((acc: number, entry: any) => acc + entry.value, 0);

    return (
      <div className="p-2 bg-card border rounded-md shadow-lg text-card-foreground text-xs">
        <p className="font-bold mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any) => {
            const subject = subjects.find((s: Subject) => s.id === entry.dataKey);
            if (!subject || entry.value === 0) return null;
            return (
              <div key={subject.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: subject.color }}></span>
                  <span>{subject.name.charAt(0).toUpperCase() + subject.name.slice(1)}:</span>
                </div>
                <span className="font-semibold ml-2">{formatHoursAndMinutes(entry.value)}</span>
              </div>
            );
          })}
        </div>
        {totalMinutes > 0 && (
          <>
            <div className="border-t my-1"></div>
            <div className="flex items-center justify-between font-bold">
                <span>Total:</span>
                <span>{formatHoursAndMinutes(totalMinutes)}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

export default function StatsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('7');
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [enableAiInsights, setEnableAiInsights] = useState(false);
  const isAnonymousUser = user?.isAnonymous;
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
      setIsOnline(window.navigator.onLine);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const summariesQuery = useMemoFirebase(() => {
      if (!user || !firestore || isAnonymousUser) return null;
      const range = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), range - 1));
      return query(
          collection(firestore, 'users', user.uid, 'daily_summaries'),
          where('date', '>=', format(startDate, 'yyyy-MM-dd')),
          orderBy('date', 'asc')
      );
  }, [user, firestore, isAnonymousUser, timeRange]);

  const { data: dailySummaries, isLoading: summariesLoading } = useCollection<DailySummary>(summariesQuery, { realtime: false });

  useEffect(() => {
    const fetchUserSettings = async () => {
        if (!user || !firestore || isAnonymousUser) return;
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            const userSettings = data.settings || {};
            setSubjects(userSettings.subjects || defaultSubjects);
            setEnableAiInsights(userSettings.enableAiInsights === true);
        }
    }
    fetchUserSettings();
  }, [user, firestore, isAnonymousUser]);
  
  const chartData = useMemo(() => {
    if (!dailySummaries) return [];
    
    const dataByDate: { [key: string]: any } = {};
    const now = new Date();
    const range = parseInt(timeRange);
    const startDate = startOfDay(subDays(now, range - 1));
    const allDates = eachDayOfInterval({ start: startDate, end: now });

    // Initialize all dates in the range
    allDates.forEach(date => {
      const dateLabel = format(date, 'MMM dd');
      dataByDate[dateLabel] = { date: dateLabel };
      subjects.forEach(s => {
        if (s.id !== 'idle' && s.id !== 'sleep') {
          dataByDate[dateLabel][s.id] = 0;
        }
      });
    });

    // Populate with summary data
    dailySummaries.forEach(summary => {
        const dateLabel = format(parseISO(summary.date), 'MMM dd');
        if (dataByDate[dateLabel]) {
            Object.keys(summary.subjectMinutes).forEach(subjectId => {
                dataByDate[dateLabel][subjectId] = (summary.subjectMinutes[subjectId] || 0); // Keep in minutes
            });
        }
    });

    return Object.values(dataByDate);
  }, [dailySummaries, subjects, timeRange]);

  const totalFocusTimeInRange = useMemo(() => {
    if(!dailySummaries) return 0;
    return dailySummaries.reduce((total, summary) => total + summary.totalMinutes, 0) / 60; // convert to hours for header
  }, [dailySummaries]);

  if (isUserLoading || summariesLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <GridFocusLoader />
          <p className="mt-4 text-lg">Loading Statistics...</p>
        </div>
    );
  }
  
  if (!user) { // Should not happen if isUserLoading is false, but as a safeguard
      router.push('/login');
      return null;
  }

  const subjectsToRender = subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader totalFocusedTime={totalFocusTimeInRange} showBackButton />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <div className="relative">
          <Card className={cn("border-primary/20 transition-all", isAnonymousUser && "blur-sm pointer-events-none")}>
              <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-2xl font-bold">
                    <div className="flex-grow">Focus Statistics</div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        {enableAiInsights && (
                            <Link href="/insights" passHref className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full" disabled={!isOnline}>
                                    <BrainCircuit className="mr-2 h-4 w-4" />
                                    {isOnline ? 'AI Insights' : 'AI Offline'}
                                </Button>
                            </Link>
                        )}
                        <Select value={timeRange} onValueChange={setTimeRange}>
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select time range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                  </CardTitle>
                  <CardDescription>Your daily focused time breakdown by subject.</CardDescription>
              </CardHeader>
              <CardContent>
                  {chartData.length > 0 && dailySummaries && dailySummaries.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                              <XAxis 
                                  type="number"
                                  axisLine={false} 
                                  tickLine={false}
                                  tickFormatter={(value) => formatHoursAndMinutes(value)}
                                  tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                                  />
                              <YAxis 
                                  dataKey="date" 
                                  type="category"
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                                  />
                              <Tooltip content={<CustomTooltip subjects={subjects} />} cursor={{fill: 'hsl(var(--secondary))'}} />
                              <Legend iconType="circle" />
                              {subjectsToRender.map((subject) => (
                                <Bar
                                  key={subject.id}
                                  dataKey={subject.id}
                                  name={subject.name.charAt(0).toUpperCase() + subject.name.slice(1)}
                                  stackId="a"
                                  fill={subject.color}
                                  animationDuration={1000}
                                />
                              ))}
                          </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                          No focus data available for the selected period. Start logging your time!
                      </div>
                  )}
              </CardContent>
          </Card>
          {isAnonymousUser && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-lg">
                <Card className="p-8 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">See Your Progress</CardTitle>
                        <CardDescription>Create a free account to view your long-term statistics and save your data permanently.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/login" passHref>
                            <Button size="lg">
                                <UserPlus className="mr-2" />
                                Sign Up to View Stats
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
