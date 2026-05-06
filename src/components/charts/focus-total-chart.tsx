
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Subject } from '@/lib/types';
import { ChartTooltip } from './chart-tooltip';
import React from 'react';

interface FocusTotalChartProps {
  data: any[];
  subjects: Subject[];
  isFullscreen?: boolean;
}

export const FocusTotalChart = React.memo(({ data, subjects, isFullscreen }: FocusTotalChartProps) => {
  const filteredSubjects = subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep');

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart 
        data={data} 
        margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
      >
        <defs>
          {data.map((day, dayIdx) => {
            if (day.total === 0) return null;
            
            let currentOffset = 0;
            return (
              <linearGradient 
                key={`day-grad-${dayIdx}`} 
                id={`total-grad-${dayIdx}`} 
                x1="0" y1="1" x2="0" y2="0"
              >
                {filteredSubjects.map((s, sIdx) => {
                  const val = day[s.id] || 0;
                  if (val === 0) return null;
                  
                  const percentage = (val / day.total) * 100;
                  const start = currentOffset;
                  const end = currentOffset + percentage;
                  currentOffset = end;
                  
                  return (
                    <React.Fragment key={`stop-${dayIdx}-${sIdx}`}>
                      <stop offset={`${start}%`} stopColor={s.color} />
                      <stop offset={`${end}%`} stopColor={s.color} />
                    </React.Fragment>
                  );
                })}
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis 
          dataKey="label" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          interval={data.length > 10 ? Math.floor(data.length / 7) : 0}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip content={<ChartTooltip subjects={subjects} showTotalOnlyInHeader={false} />} />
        <Bar 
          dataKey="total" 
          radius={[6, 6, 0, 0]} 
          animationDuration={500}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.total > 0 ? `url(#total-grad-${index})` : 'hsl(var(--muted))'} 
              opacity={entry.total > 0 ? 0.9 : 0.2}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

FocusTotalChart.displayName = 'FocusTotalChart';
