
'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Subject } from '@/lib/types';
import { ChartTooltip } from './chart-tooltip';
import React from 'react';

interface FocusAreaChartProps {
  data: any[];
  subjects: Subject[];
  isFullscreen?: boolean;
}

export const FocusAreaChart = React.memo(({ data, subjects, isFullscreen }: FocusAreaChartProps) => {
  const activeSubjects = subjects.filter(s => 
    s.id !== 'idle' && s.id !== 'sleep' && data.some(d => d[s.id] > 0)
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart 
        data={data} 
        margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
      >
        <defs>
          {activeSubjects.map(s => (
            <linearGradient key={`area-grad-${s.id}`} id={`area-color-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.12}/>
              <stop offset="95%" stopColor={s.color} stopOpacity={0}/>
            </linearGradient>
          ))}
        </defs>
        
        <CartesianGrid 
          vertical={false} 
          stroke="hsl(var(--muted-foreground))" 
          strokeDasharray="0" 
          strokeOpacity={0.06} 
        />
        
        <XAxis 
          dataKey="label" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
          interval={data.length > 10 ? Math.floor(data.length / 7) : 0}
          dy={10}
        />
        
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
          dx={-10}
        />
        
        <Tooltip 
          content={<ChartTooltip subjects={subjects} />} 
          cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
          animationDuration={200}
        />
        
        <Legend 
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ 
            paddingTop: 30, 
            fontSize: 10, 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            opacity: 0.6
          }} 
        />

        {activeSubjects.map((subject) => (
          <Area
            key={subject.id}
            type="monotone"
            dataKey={subject.id}
            name={subject.name}
            stroke={subject.color}
            strokeWidth={1.5}
            fill={`url(#area-color-${subject.id})`}
            // Removing stackId for a more modern unstacked "Linear" style overlap
            // This provides better visibility of individual subject trends
            activeDot={{ 
              r: 4, 
              strokeWidth: 4, 
              stroke: `${subject.color}33`, 
              fill: subject.color,
            }}
            dot={false}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
});

FocusAreaChart.displayName = 'FocusAreaChart';
