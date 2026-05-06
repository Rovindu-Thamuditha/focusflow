
'use client';

import type { Subject } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  subjects: Subject[];
  showTotalOnlyInHeader?: boolean;
}

export function ChartTooltip({ active, payload, label, subjects, showTotalOnlyInHeader = true }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = parseISO(data.date);
    const totalMinutes = data.total;

    const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      if (h === 0 && m === 0) return '0m';
      return `${h > 0 ? `${h}h ` : ''}${m}m`;
    };

    return (
      <div className="bg-card/95 backdrop-blur-sm border border-primary/20 shadow-2xl rounded-lg p-4 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-3 border-b border-primary/10 pb-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                {format(date, 'EEEE')}
            </p>
            <p className="text-lg font-bold text-foreground">
                {format(date, 'MMM dd, yyyy')}
            </p>
        </div>
        
        <div className="space-y-2">
          {subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep').map(subject => {
            const val = data[subject.id] || 0;
            return (
              <div key={subject.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }}></div>
                  <span className="text-xs font-medium text-muted-foreground truncate max-w-[100px]">{subject.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-foreground">{formatTime(val)}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-2 border-t border-primary/10 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-primary">Total Focus</span>
            <span className="text-sm font-mono font-black text-primary">{formatTime(totalMinutes)}</span>
        </div>
      </div>
    );
  }
  return null;
}
