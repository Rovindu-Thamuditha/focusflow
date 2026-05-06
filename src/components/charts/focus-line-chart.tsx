
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area } from 'recharts';
import type { Subject } from '@/lib/types';
import { ChartTooltip } from './chart-tooltip';

interface FocusLineChartProps {
  data: any[];
  subjects: Subject[];
  isFullscreen?: boolean;
}

export function FocusLineChart({ data, subjects, isFullscreen }: FocusLineChartProps) {
  const activeSubjects = subjects.filter(s => 
    s.id !== 'idle' && s.id !== 'sleep' && data.some(d => d[s.id] > 0)
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={data} 
        margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
      >
        <defs>
          {activeSubjects.map(s => (
            <linearGradient key={`grad-${s.id}`} id={`color-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={s.color} stopOpacity={0}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis 
          dataKey="label" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          interval={data.length > 10 ? 2 : 0}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip 
          content={<ChartTooltip subjects={subjects} />}
          cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }}
        />
        <Legend 
          iconType="circle" 
          wrapperStyle={{ paddingTop: 20, fontSize: 12 }} 
        />
        {activeSubjects.map((subject) => (
          <Line
            key={subject.id}
            type="monotone"
            dataKey={subject.id}
            name={subject.name}
            stroke={subject.color}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
