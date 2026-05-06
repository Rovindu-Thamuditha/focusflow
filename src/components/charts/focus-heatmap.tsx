
'use client';

import React from 'react';
import type { Subject } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FocusHeatmapProps {
  data: any[];
  subjects: Subject[];
  isFullscreen?: boolean;
}

export function FocusHeatmap({ data, subjects, isFullscreen }: FocusHeatmapProps) {
  const activeSubjects = subjects.filter(s => 
    s.id !== 'idle' && s.id !== 'sleep' && data.some(d => d[s.id] > 0)
  );

  const formatMins = (mins: number) => {
    if (mins === 0) return 'No focus recorded';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
  };

  const getIntensity = (mins: number) => {
    if (mins === 0) return 0;
    if (mins < 15) return 0.2;
    if (mins < 30) return 0.4;
    if (mins < 45) return 0.6;
    if (mins < 60) return 0.8;
    return 1;
  };

  return (
    <div className="w-full h-full overflow-x-auto overflow-y-hidden py-4 px-2">
      <div className="min-w-max flex flex-col gap-4">
        {/* Days Header */}
        <div className="flex gap-2 ml-32">
          {data.map((day, idx) => (
            <div 
              key={day.date} 
              className={cn(
                "w-10 text-[10px] text-center font-medium transition-opacity",
                !day.hasData && "opacity-30"
              )}
            >
              {day.label}
            </div>
          ))}
        </div>

        {/* Heatmap Rows */}
        <div className="flex flex-col gap-2">
          {activeSubjects.map(subject => (
            <div key={subject.id} className="flex items-center gap-2">
              <div className="w-32 flex items-center gap-2 pr-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }}></span>
                <span className="text-xs font-semibold truncate text-muted-foreground">{subject.name}</span>
              </div>
              
              <div className="flex gap-2">
                <TooltipProvider delayDuration={0}>
                  {data.map(day => {
                    const mins = day[subject.id] || 0;
                    const intensity = getIntensity(mins);
                    
                    return (
                      <Tooltip key={`${day.date}-${subject.id}`}>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              "w-10 h-10 rounded-md border border-white/5 transition-all duration-300 hover:scale-110 hover:z-10 cursor-default",
                              !day.hasData && "opacity-20 grayscale-[0.5]"
                            )}
                            style={{ 
                              backgroundColor: mins > 0 ? subject.color : 'hsl(var(--muted)/0.3)',
                              opacity: mins > 0 ? intensity : undefined,
                              boxShadow: mins > 30 ? `0 0 10px ${subject.color}44` : 'none'
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-card/95 backdrop-blur-sm border-primary/20 shadow-xl p-3">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{format(parseISO(day.date), 'EEEE, MMM dd')}</p>
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }}></div>
                               <p className="font-bold text-sm">{subject.name}</p>
                            </div>
                            <p className="text-lg font-mono font-bold text-primary">{formatMins(mins)}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
