"use client"

import { cn } from "@/lib/utils";
import * as React from 'react';
import { Book, Zap, Coffee, Bed, Sparkles, BrainCircuit, FlaskConical, Dna, Code, PenTool, Briefcase, Moon, Sun, Timer } from "lucide-react";
import type { Subject, TimeBlockState } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { TooltipProvider } from '@/components/ui/tooltip'

export default function Page() {
  return (
    <TooltipProvider>
      <AccountabilityGrid
        blocks={blocks}
        subjects={subjects}
        onBlockUpdate={handleBlockUpdate}
        viewingDate={viewingDate}
        liveTime={liveTime}
      />
    </TooltipProvider>
  )
}


interface TimeBlockProps {
  hour: number;
  subjectId: string;
  duration: number;
  subjects: Subject[];
  allDayBlocks: TimeBlockState[];
  onClick: () => void;
  onStateChange: (subjectId: string, duration: number) => void;
  isEditable: boolean;
  isFuture: boolean;
  isCurrent: boolean;
  liveTime: Date;
  activeTimerSubject: Subject | null;
}

const ICONS: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  BrainCircuit,
  FlaskConical,
  Dna,
  Code,
  PenTool,
  Book,
  Briefcase,
  Sparkles,
  Moon,
};

const formatHoursAndMinutes = (totalMinutes: number): string => {
  if (totalMinutes === 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours === 0) result += `${minutes}m`;
  return result.trim();
};

export const TimeBlock = React.memo(function TimeBlock({
  hour, subjectId, duration, subjects, allDayBlocks, onClick, onStateChange,
  isEditable, isFuture, isCurrent, liveTime, activeTimerSubject
}: TimeBlockProps) {
  const isSleep = subjectId === 'sleep';

  const subject = React.useMemo(() => (
    isSleep
      ? { id: 'sleep', name: 'Sleep', icon: 'Moon', color: 'hsl(210 8% 25%)' }
      : subjects.find(s => s.id === subjectId) || { id: 'idle', name: 'Idle', icon: 'Sparkles', color: 'hsl(var(--muted))' }
  ), [subjectId, subjects, isSleep]);

  const formattedHour = (hour % 12 === 0 ? 12 : hour % 12) + (hour < 12 || hour === 24 ? ' AM' : ' PM');

  const getBrightness = () => {
    if (duration === 0) return 'brightness-50';
    if (duration < 60) return `brightness-${50 + Math.round((duration/60)*50)}`;
    return 'brightness-100';
  }

  const Icon = ICONS[subject.icon] || Sparkles;

  const finalIsEditable = isEditable && !isFuture;
  const isBeingTimed = isCurrent && activeTimerSubject;

  const glowStyle = isBeingTimed ? {
    '--glow-color-start': `${activeTimerSubject?.color}99`,
    '--glow-color-end': `${activeTimerSubject?.color}ff`,
  } as React.CSSProperties : {};

  const dailySummary = React.useMemo(() => {
    const summary = { totalMinutes: 0, subjectMinutes: {} as Record<string, number> };
    allDayBlocks.forEach(block => {
      if (block.subject !== 'idle' && block.subject !== 'sleep' && block.duration > 0) {
        summary.totalMinutes += block.duration;
        summary.subjectMinutes[block.subject] = (summary.subjectMinutes[block.subject] || 0) + block.duration;
      }
    });
    return summary;
  }, [allDayBlocks]);

  const blockButton = (
    <button
      onClick={() => { if(finalIsEditable && !isSleep) onClick(); }}
      className={cn(
        "relative w-full h-full aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-300 ease-in-out transform border",
        finalIsEditable && !isSleep && "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary",
        isSleep ? "dark:bg-gray-800 dark:text-gray-500 bg-slate-700 text-slate-300" :
        (subject.id === 'idle' ? "dark:text-gray-500 text-slate-500" : getBrightness()),
        !finalIsEditable && 'cursor-not-allowed',
        isBeingTimed && 'pulsing-glow',
        'border-border'
      )}
      style={{ backgroundColor: subject.id !== 'idle' ? subject.color : undefined, ...glowStyle }}
      aria-label={`Hour ${hour}:00, current state: ${subject.name}. Click to change.`}
      disabled={!finalIsEditable && !isSleep}
    >
      <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
      <span className="text-xs sm:text-sm font-mono mt-1">{formattedHour}</span>
      {duration > 0 && subject.id !== 'idle' && subject.id !== 'sleep' && (
        <div className="absolute inset-0 rounded-lg pointer-events-none"
             style={{ boxShadow: `0 0 8px ${subject.color}, 0 0 16px ${subject.color}` }} />
      )}
    </button>
  );

  return (
    <>
      {/* Tooltip wraps the button directly */}
      <Tooltip>
        <TooltipTrigger asChild>{blockButton}</TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b">
            <Icon className="w-4 h-4" style={{color: subject.color}} />
            <div className="flex-grow">
              <p className="font-semibold">{isBeingTimed ? activeTimerSubject?.name : subject.name}</p>
              <p className="text-muted-foreground">{`Duration: ${duration} minutes`}</p>
            </div>
            {isBeingTimed && <p className="text-xs text-red-500 font-semibold animate-pulse">Live</p>}
          </div>
          <div className="font-semibold mb-1 text-foreground">Daily Summary</div>
          <div className="space-y-1">
            {Object.entries(dailySummary.subjectMinutes).map(([sid, minutes]) => {
              const subj = subjects.find(s => s.id === sid);
              if (!subj) return null;
              return (
                <div key={sid} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subj.color }}></span>
                    <span>{subj.name}:</span>
                  </div>
                  <span className="font-medium ml-2">{formatHoursAndMinutes(minutes)}</span>
                </div>
              )
            })}
          </div>
          <div className="border-t my-2"></div>
          <div className="flex items-center justify-between font-bold text-foreground">
            <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />Total Focus:</span>
            <span>{formatHoursAndMinutes(dailySummary.totalMinutes)}</span>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* ContextMenu is separate and wraps the same button */}
      <ContextMenu>
        <ContextMenuTrigger asChild>{blockButton}</ContextMenuTrigger>
        <ContextMenuContent>
          {finalIsEditable && isSleep && (
            <ContextMenuItem onClick={() => onStateChange('idle', 0)}>
              <Sun className="mr-2 h-4 w-4" />Wake Up
            </ContextMenuItem>
          )}
          {finalIsEditable && !isSleep && (
            <ContextMenuItem onClick={() => onStateChange('sleep', 0)}>
              <Bed className="mr-2 h-4 w-4" />Mark as Sleep
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </>
  )
});
