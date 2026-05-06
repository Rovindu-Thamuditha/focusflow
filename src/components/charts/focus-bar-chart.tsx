
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Subject } from '@/lib/types';
import { ChartTooltip } from './chart-tooltip';
import React from 'react';

interface FocusBarChartProps {
  data: any[];
  subjects: Subject[];
  isFullscreen?: boolean;
}

export const FocusBarChart = React.memo(({ data, subjects, isFullscreen }: FocusBarChartProps) => {
  const activeSubjects = subjects.filter(s => 
    s.id !== 'idle' && s.id !== 'sleep' && data.some(d => d[s.id] > 0)
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={data} 
        margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
        barGap={4}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis 
          dataKey="label" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: isFullscreen ? 14 : 11, fill: 'hsl(var(--muted-foreground))' }}
          interval={data.length > 10 ? Math.floor(data.length / 7) : 0}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip 
          content={<ChartTooltip subjects={subjects} />} 
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
          animationDuration={200}
        />
        <Legend 
          iconType="circle" 
          wrapperStyle={{ paddingTop: 20, fontSize: isFullscreen ? 14 : 12 }} 
        />
        {activeSubjects.map((subject) => (
          <Bar
            key={subject.id}
            dataKey={subject.id}
            name={subject.name}
            fill={subject.color}
            radius={[4, 4, 0, 0]}
            animationDuration={500}
            isAnimationActive={true}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
});

FocusBarChart.displayName = 'FocusBarChart';
