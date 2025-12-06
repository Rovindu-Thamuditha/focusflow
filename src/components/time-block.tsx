
"use client"

import { cn } from "@/lib/utils";
import * as React from 'react';
import { Book, Zap, Coffee, Bed, Sparkles, BrainCircuit, FlaskConical, Dna, Code, PenTool, Briefcase, Moon, Sun, Timer } from "lucide-react";
import type { Subject, TimeBlockState } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

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
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0 || hours === 0) {
        result += `${minutes}m`;
    }
    return result.trim();
};

export function TimeBlock({ 
    hour, 
    subjectId, 
    duration, 
    subjects, 
    allDayBlocks,
    onClick, 
    onStateChange, 
    isEditable, 
    isFuture, 
    isCurrent, 
    liveTime, 
    activeTimerSubject 
}: TimeBlockProps) {
  const isSleep = subjectId === 'sleep';

  const subject = isSleep 
    ? { id: 'sleep', name: 'Sleep', icon: 'Moon', color: 'hsl(210 8% 25%)' }
    : subjects.find(s => s.id === subjectId) || { id: 'idle', name: 'Idle', icon: 'Sparkles', color: 'hsl(var(--muted))' };
  
  const formattedHour = (hour % 12 === 0 ? 12 : hour % 12) + (hour < 12 || hour === 24 ? ' AM' : ' PM');
  
  const getBrightness = () => {
    if (duration === 0) return 'brightness-50';
    if (duration < 60) return `brightness-${50 + Math.round((duration/60)*50)}`;
    return 'brightness-100';
  }

  const Icon = ICONS[subject.icon] || Sparkles;

  const sleepStyles = "dark:bg-gray-800 dark:text-gray-500 bg-slate-700 text-slate-300";
  const idleStyles = "dark:text-gray-500 text-slate-500";
  const finalIsEditable = isEditable && !isFuture;

  const isBeingTimed = isCurrent && activeTimerSubject;
  
  const glowStyle = isBeingTimed ? {
    '--glow-color-start': `${activeTimerSubject?.color}99`,
    '--glow-color-end': `${activeTimerSubject?.color}ff`,
  } as React.CSSProperties : {};

  const handleBlockClick = () => {
    if (finalIsEditable && !isSleep) {
        onClick();
    }
  }

  const blockButton = (
      <button
        onClick={handleBlockClick}
        className={cn(
            "relative w-full h-full aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-300 ease-in-out transform border",
            finalIsEditable && !isSleep && "hover:scale-105",
            finalIsEditable && !isSleep && "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary",
            isSleep ? sleepStyles : (subject.id === 'idle' ? idleStyles : getBrightness()),
            !finalIsEditable && 'cursor-not-allowed',
            isFuture && 'opacity-50',
            isBeingTimed && 'pulsing-glow',
            'border-border'
        )}
        style={{ 
            backgroundColor: subject.id !== 'idle' ? subject.color : undefined,
            ...glowStyle,
        } as React.CSSProperties}
        aria-label={`Hour ${hour}:00, current state: ${subject.name}. Click to change.`}
        disabled={!finalIsEditable && !isSleep}
        >
        <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
        <span className="text-xs sm:text-sm font-mono mt-1">{formattedHour}</span>
        {duration > 0 && subject.id !== 'idle' && subject.id !== 'sleep' && (
            <div 
                className={cn(
                    "absolute inset-0 rounded-lg pointer-events-none",
                )}
                style={{boxShadow: `0 0 8px ${subject.color}, 0 0 16px ${subject.color}`}}
            />
        )}
        </button>
  );

  return (
    <ContextMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <ContextMenuTrigger asChild>
            {blockButton}
          </ContextMenuTrigger>
        </TooltipTrigger>
        <TooltipContent className="p-2 text-xs">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{color: subject.color}} />
            <div className="flex-grow">
              <p className="font-semibold">{isBeingTimed ? activeTimerSubject?.name : subject.name}</p>
              {!isSleep && <p className="text-muted-foreground">{`Duration: ${duration} minutes`}</p>}
            </div>
            {isBeingTimed && <p className="text-xs text-red-500 font-semibold animate-pulse">Live</p>}
          </div>
        </TooltipContent>
      </Tooltip>
      <ContextMenuContent>
          {finalIsEditable && isSleep && (
                  <ContextMenuItem onClick={() => onStateChange('idle', 0)}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Wake Up</span>
                  </ContextMenuItem>
          )}
          {finalIsEditable && !isSleep && (
              <ContextMenuItem onClick={() => onStateChange('sleep', 0)}>
                  <Bed className="mr-2 h-4 w-4" />
                  <span>Mark as Sleep</span>
              </ContextMenuItem>
          )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

