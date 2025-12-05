
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { subDays, startOfDay, format, parseISO, endOfDay, eachDayOfInterval } from 'date-fns';
import type { TimeBlockState, Subject } from '@/lib/types';
import { defaultSubjects } from '@/lib/subjects';
import { cn } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label, subjects }: any) => {
  if (active && payload && payload.length) {
    const totalHours = payload.reduce((acc: number, entry: any) => acc + entry.value, 0);

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
                  <span>{subject.name}:</span>
                </div>
                <span className="font-semibold ml-2">{(entry.value).toFixed(2)} hrs</span>
              </div>
            );
          })}
        </div>
        {totalHours > 0 && (
          <>
            <div className="border-t my-1"></div>
            <div className="flex items-center justify-between font-bold">
                <span>Total:</span>
                <span>{totalHours.toFixed(2)} hrs</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

interface UserStatsProps {
    userId: string;
}

export function UserStats({ userId }: UserStatsProps) {
  const firestore = useFirestore();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>([]);
  const [timeRange, setTimeRange] = useState('7');
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchTimeBlocks = useCallback(async () => {
      if (!userId || !firestore) return;
      
      setDataLoaded(false);
      const now = new Date();
      const range = parseInt(timeRange);
      const startDate = startOfDay(subDays(now, range - 1));
      const endDate = endOfDay(now);

      const q = query(
        collection(firestore, 'users', userId, 'time_blocks'),
        where('date', '>=', format(startDate, 'yyyy-MM-dd')),
        where('date', '<=', format(endDate, 'yyyy-MM-dd')),
        orderBy('date', 'asc')
      );

      try {
        const querySnapshot = await getDocs(q);
        const blocks = querySnapshot.docs.map(doc => doc.data() as TimeBlockState);
        setTimeBlocks(blocks);

        const userDocRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            setSubjects(userDoc.data().settings?.subjects || defaultSubjects);
        }
      } catch (error) {
        console.error("Error fetching time blocks for stats: ", error);
        setTimeBlocks([]);
      } finally {
        setDataLoaded(true);
      }
  }, [userId, firestore, timeRange]);

  useEffect(() => {
    fetchTimeBlocks();
  }, [fetchTimeBlocks]);
  
  const chartData = useMemo(() => {
    const dataByDate: { [key: string]: any } = {};
    const now = new Date();
    const range = parseInt(timeRange);
    const startDate = startOfDay(subDays(now, range - 1));
    const allDates = eachDayOfInterval({ start: startDate, end: now });

    allDates.forEach(date => {
      const dateLabel = format(date, 'MMM dd');
      dataByDate[dateLabel] = { date: dateLabel };
      subjects.forEach(s => {
        if (s.id !== 'idle' && s.id !== 'sleep') {
          dataByDate[dateLabel][s.id] = 0;
        }
      });
    });

    timeBlocks.forEach(block => {
        if (block.subject === 'idle' || block.subject === 'sleep') return;
        
        const dateKey = block.date.split('T')[0];
        const dateLabel = format(parseISO(dateKey), 'MMM dd');

        if (dataByDate[dateLabel]) {
            if (!dataByDate[dateLabel][block.subject]) {
                dataByDate[dateLabel][block.subject] = 0;
            }
            dataByDate[dateLabel][block.subject] += block.duration / 60;
        }
    });

    return Object.values(dataByDate);
  }, [timeBlocks, subjects, timeRange]);

  if (!dataLoaded) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Focus Statistics</CardTitle>
                <CardDescription>Loading focus data...</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </CardContent>
        </Card>
    );
  }

  const subjectsToRender = subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep');

  return (
    <Card className="border-primary/20">
        <CardHeader>
            <CardTitle className="flex justify-between items-center text-2xl font-bold">
                <span>Focus Statistics</span>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                    </SelectContent>
                </Select>
            </CardTitle>
            <CardDescription>User's daily focused time breakdown by subject.</CardDescription>
        </CardHeader>
        <CardContent>
            {chartData.length > 0 && timeBlocks.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      {subjectsToRender.map((subject) => (
                        <linearGradient key={subject.id} id={`color${subject.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={subject.color} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={subject.color} stopOpacity={0.1}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                      label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 0, style: { fill: 'hsl(var(--muted-foreground))' } }} 
                    />
                    <Tooltip content={<CustomTooltip subjects={subjects} />} />
                    <Legend iconType="circle" />
                    {subjectsToRender.map((subject) => (
                      <Area
                        key={subject.id}
                        type="monotone"
                        dataKey={subject.id}
                        stackId="1"
                        stroke={subject.color}
                        strokeWidth={2}
                        fill={`url(#color${subject.id})`}
                        fillOpacity={1}
                        animationDuration={1000}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    No focus data available for this user in the selected period.
                </div>
            )}
        </CardContent>
    </Card>
  );
}
