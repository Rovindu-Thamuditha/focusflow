'use client';

import { useEffect, useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MainHeader } from '@/components/main-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { subDays, startOfDay, format, parseISO } from 'date-fns';
import type { TimeBlockState, Subject } from '@/lib/types';
import { defaultSubjects } from '@/lib/subjects';

const { firestore } = initializeFirebase();

const CustomTooltip = ({ active, payload, label, subjects }: any) => {
  if (active && payload && payload.length) {
    const subjectData = payload.reduce((acc: any, entry: any) => {
      const subject = subjects.find((s: Subject) => s.id === entry.dataKey);
      if (subject) {
        acc[subject.name] = { value: entry.value, color: subject.color };
      }
      return acc;
    }, {});

    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg">
        <p className="font-bold">{label}</p>
        {Object.entries(subjectData).map(([name, data]: [string, any]) => (
          <p key={name} style={{ color: data.color }}>
            {name}: {(data.value).toFixed(2)} hours
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export default function StatsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockState[]>([]);
  const [timeRange, setTimeRange] = useState('7');
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchTimeBlocks = async () => {
        setDataLoaded(false);
        const now = new Date();
        const startDate = startOfDay(subDays(now, parseInt(timeRange)));
        
        const q = query(
          collection(firestore, 'users', user.uid, 'time_blocks'),
          where('date', '>=', startDate.toISOString())
        );
        const querySnapshot = await getDocs(q);
        const blocks = querySnapshot.docs.map(doc => doc.data() as TimeBlockState);
        setTimeBlocks(blocks);

        const userDoc = await (await import('firebase/firestore')).doc(firestore, 'users', user.uid).get();
        if (userDoc.exists()) {
            setSubjects(userDoc.data().settings?.subjects || defaultSubjects);
        }

        setDataLoaded(true);
      };
      fetchTimeBlocks();
    }
  }, [user, timeRange]);
  
  const chartData = useMemo(() => {
    const dataByDate: { [key: string]: any } = {};

    timeBlocks.forEach(block => {
        if (block.subject === 'idle' || block.subject === 'sleep') return;
        
        const date = format(parseISO(block.date), 'MMM dd');
        if (!dataByDate[date]) {
            dataByDate[date] = { date };
        }
        if (!dataByDate[date][block.subject]) {
            dataByDate[date][block.subject] = 0;
        }
        dataByDate[date][block.subject] += block.duration / 60; // convert to hours
    });

    return Object.values(dataByDate);
  }, [timeBlocks]);

  if (loading || !dataLoaded) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading Statistics...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader totalFocusedTime={0} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                   <span>Focus Statistics</span>
                   <Select value={timeRange} onValueChange={setTimeRange}>
                     <SelectTrigger className="w-[180px]">
                       <SelectValue placeholder="Select time range" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="7">Last 7 Days</SelectItem>
                       <SelectItem value="30">Last 30 Days</SelectItem>
                       <SelectItem value="90">Last 90 Days</SelectItem>
                       <SelectItem value="365">All Time</SelectItem>
                     </SelectContent>
                   </Select>
                </CardTitle>
                <CardDescription>Your daily focused time breakdown by subject.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                        <Tooltip content={<CustomTooltip subjects={subjects} />} />
                        <Legend />
                        {subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep').map(subject => (
                           <Bar key={subject.id} dataKey={subject.id} stackId="a" fill={subject.color} name={subject.name} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
