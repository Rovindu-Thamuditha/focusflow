'use client';

import { useEffect, useState, useMemo } from 'react';
import { MainHeader } from '@/components/main-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDoc, doc, orderBy } from 'firebase/firestore';
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns';
import type { Subject, DailySummary } from '@/lib/types';
import { defaultSubjects } from '@/lib/subjects';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Maximize2, Minimize2, BarChart3, LineChart, AreaChart, LayoutGrid, Layers } from 'lucide-react';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FocusBarChart } from '@/components/charts/focus-bar-chart';
import { FocusLineChart } from '@/components/charts/focus-line-chart';
import { FocusAreaChart } from '@/components/charts/focus-area-chart';
import { FocusTotalChart } from '@/components/charts/focus-total-chart';
import { FocusHeatmap } from '@/components/charts/focus-heatmap';
import { StatsSummary } from '@/components/charts/stats-summary';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export default function StatsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [timeRange, setTimeRange] = useState('7');
  const [chartType, setChartType] = useState('bars');
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const isAnonymousUser = user?.isAnonymous;

  useEffect(() => {
    setIsMounted(true);
    const savedType = localStorage.getItem('focusChartPreference');
    if (savedType) setChartType(savedType);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('focusChartPreference', chartType);
    }
  }, [chartType, isMounted]);

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
        }
    }
    fetchUserSettings();
  }, [user, firestore, isAnonymousUser]);
  
  const processedData = useMemo(() => {
    if (!isMounted) return [];
    const range = parseInt(timeRange);
    const now = new Date();
    const startDate = startOfDay(subDays(now, range - 1));
    const allDates = eachDayOfInterval({ start: startDate, end: now });

    return allDates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = format(date, 'MMM dd');
      const summary = dailySummaries?.find(s => s.date === dateStr);
      
      const entry: any = { 
        date: dateStr, 
        label, 
        total: summary?.totalMinutes || 0,
        hasData: !!summary && summary.totalMinutes > 0
      };

      subjects.forEach(s => {
        if (s.id !== 'idle' && s.id !== 'sleep' && s.id !== 'class') {
          entry[s.id] = summary?.subjectMinutes?.[s.id] || 0;
        }
      });

      return entry;
    });
  }, [dailySummaries, subjects, timeRange, isMounted]);

  const stats = useMemo(() => {
    const totalMinutes = dailySummaries?.reduce((acc, s) => acc + s.totalMinutes, 0) || 0;
    const activeDays = dailySummaries?.filter(s => s.totalMinutes > 0).length || 0;
    
    const subjectTotals: Record<string, number> = {};
    dailySummaries?.forEach(s => {
      // Safely handle missing subjectMinutes data in older records
      if (s.subjectMinutes) {
        Object.entries(s.subjectMinutes).forEach(([id, mins]) => {
          subjectTotals[id] = (subjectTotals[id] || 0) + mins;
        });
      }
    });

    const topSubjectId = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topSubject = subjects.find(s => s.id === topSubjectId)?.name || 'N/A';

    return { totalMinutes, activeDays, topSubject };
  }, [dailySummaries, subjects]);

  if (isUserLoading || (summariesLoading && !dailySummaries) || !isMounted) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <GridFocusLoader />
          <p className="mt-4 text-lg">Loading Statistics...</p>
        </div>
    );
  }
  
  if (!user) {
      router.push('/login');
      return null;
  }

  const renderChart = (isFullscreenMode = false) => {
    const commonProps = { data: processedData, subjects, isFullscreen: isFullscreenMode };
    switch (chartType) {
      case 'bars': return <FocusBarChart {...commonProps} />;
      case 'lines': return <FocusLineChart {...commonProps} />;
      case 'area': return <FocusAreaChart {...commonProps} />;
      case 'total': return <FocusTotalChart {...commonProps} />;
      case 'heatmap': return <FocusHeatmap {...commonProps} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 sm:pb-0">
      <MainHeader totalFocusedTime={stats.totalMinutes / 60} showBackButton />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        
        <StatsSummary 
          totalMinutes={stats.totalMinutes} 
          topSubject={stats.topSubject} 
          activeDays={stats.activeDays} 
          isAnonymous={!!isAnonymousUser}
        />

        <div className="relative">
          <Card className={cn("border-primary/10 overflow-hidden transition-all duration-500", isAnonymousUser && "blur-md pointer-events-none")}>
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b bg-muted/30 py-4 px-6">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        {chartType === 'bars' && <BarChart3 className="w-5 h-5 text-primary" />}
                        {chartType === 'lines' && <LineChart className="w-5 h-5 text-primary" />}
                        {chartType === 'area' && <AreaChart className="w-5 h-5 text-primary" />}
                        {chartType === 'total' && <Layers className="w-5 h-5 text-primary" />}
                        {chartType === 'heatmap' && <LayoutGrid className="w-5 h-5 text-primary" />}
                        Focus Analysis
                    </CardTitle>
                    <CardDescription>Visualizing your daily effort</CardDescription>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-full sm:w-[140px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                        </SelectContent>
                      </Select>

                      <Tabs value={chartType} onValueChange={setChartType} className="w-full sm:w-auto">
                        <TabsList className="grid grid-cols-5 h-9">
                          <TabsTrigger value="bars" title="Bars"><BarChart3 className="w-4 h-4" /></TabsTrigger>
                          <TabsTrigger value="lines" title="Lines"><LineChart className="w-4 h-4" /></TabsTrigger>
                          <TabsTrigger value="area" title="Area"><AreaChart className="w-4 h-4" /></TabsTrigger>
                          <TabsTrigger value="total" title="Total"><Layers className="w-4 h-4" /></TabsTrigger>
                          <TabsTrigger value="heatmap" title="Heatmap"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
                        </TabsList>
                      </Tabs>

                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="hidden sm:flex h-9 w-9" 
                        onClick={() => setIsFullscreen(true)}
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                  </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 bg-card">
                  <div className="h-[400px] w-full py-6 relative">
                    {processedData.some(d => d.hasData) ? (
                      renderChart()
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                           <LayoutGrid className="w-12 h-12 text-muted-foreground opacity-20" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-muted-foreground">No data for this period</p>
                          <p className="text-sm text-muted-foreground">Start logging focus time to see your progress.</p>
                        </div>
                      </div>
                    )}
                  </div>
              </CardContent>
          </Card>

          {isAnonymousUser && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
                <Card className="max-w-md w-full p-8 text-center shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <BrainCircuit className="w-12 h-12 text-primary" />
                      </div>
                    </div>
                    <CardHeader className="p-0">
                        <CardTitle className="text-2xl font-bold">See Your Progress</CardTitle>
                        <CardDescription className="mt-2">Create an account to track your focus over time, view detailed statistics, and keep your data forever.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 px-0">
                        <Button onClick={() => router.push('/login')} size="lg" className="w-full font-bold">
                            Join GridFocus Now
                        </Button>
                    </CardContent>
                </Card>
            </div>
          )}
        </div>

        <div className="sm:hidden text-center px-4 py-8 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
           <Maximize2 className="w-5 h-5 mx-auto mb-2 opacity-50" />
           <p className="text-xs text-muted-foreground">Rotate your device or tap expand for a better chart view.</p>
           <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)} className="mt-2 text-primary">
              Expand View
           </Button>
        </div>
      </main>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[100vw] w-screen h-screen m-0 p-0 border-none bg-background rounded-none z-[100]">
          <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <DialogTitle className="text-lg font-bold">Fullscreen Focus Data</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}>
                <Minimize2 className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex-grow p-4 overflow-hidden flex items-center justify-center">
              <div className="w-full h-full max-h-[85vh]">
                {renderChart(true)}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}