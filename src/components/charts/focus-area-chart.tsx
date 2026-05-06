
'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Subject } from '@/lib/types';
import { ChartTooltip } from './chart-tooltip';

interface FocusAreaChartProps {
  data: any[];
  subjects: Subject[];
  isFullscreen?: boolean;
}

export function FocusAreaChart({ data, subjects, isFullscreen }: FocusAreaChartProps) {
  const activeSubjects = subjects.filter(s => 
    s.id !== 'idle' && s.id !== 'sleep' && data.some(d => d[s.id] > 0)
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart 
        data={data} 
        margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
      >
        <defs>
          {activeSubjects.map(s => (
            <linearGradient key={`area-grad-${s.id}`} id={`area-color-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.6}/>
              <stop offset="95%" stopColor={s.color} stopOpacity={0.1}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis 
          dataKey="label" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip content={<ChartTooltip subjects={subjects} />} />
        <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
        {activeSubjects.map((subject) => (
          <Area
            key={subject.id}
            type="monotone"
            dataKey={subject.id}
            name={subject.name}
            stroke={subject.color}
            fill={`url(#area-color-${subject.id})`}
            stackId="1"
            animationDuration={1500}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
