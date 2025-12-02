
"use client"

import { cn } from "@/lib/utils";
import * as React from 'react';
import { Book, Zap, Coffee, Bed, Sparkles, BrainCircuit, FlaskConical, Dna, Code, PenTool, Briefcase, Moon } from "lucide-react";
import type { Subject } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimeBlockProps {
  hour: number;
  subjectId: string;
  duration: number;
  subjects: Subject[];
  onClick: () => void;
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

export function TimeBlock({ hour, subjectId, duration, subjects, onClick, isEditable, isFuture, isCurrent, liveTime, activeTimerSubject }: TimeBlockProps) {
  const isSleep = subjectId === 'sleep';

  const subject = isSleep 
    ? { id: 'sleep', name: 'Sleep', icon: 'Moon', color: 'hsl(210 8% 25%)' }
    : subjects.find(s => s.id === subjectId) || { id: 'idle', name: 'Idle', icon: 'Sparkles', color: 'hsl(var(--muted))' };
  
  const formattedHour = (hour % 12 === 0 ? 12 : hour % 12) + (hour < 12 || hour === 24 ? ' AM' : ' PM');
  const nextHour = ((hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12) + (hour + 1 < 12 || hour + 1 === 24 ? ' AM' : ' PM');
  const timeSlot = `${formattedHour} - ${nextHour}`;
  
  const getBrightness = () => {
    if (duration === 0) return 'brightness-50';
    if (duration < 60) return `brightness-${50 + Math.round((duration/60)*50)}`;
    return 'brightness-100';
  }

  const Icon = ICONS[subject.icon] || Sparkles;

  const sleepStyles = "dark:bg-gray-800 dark:text-gray-500 bg-slate-700 text-slate-300";
  const idleStyles = "dark:text-gray-500 text-slate-500";
  const finalIsEditable = isEditable && !isFuture && !isCurrent;

  const glowStyle = activeTimerSubject ? {
    '--glow-color-start': `${activeTimerSubject.color}99`,
    '--glow-color-end': `${activeTimerSubject.color}ff`,
  } as React.CSSProperties : {};

  return (
    <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                onClick={onClick}
                className={cn(
                    "relative aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-300 ease-in-out transform border",
                    finalIsEditable && !isSleep && "hover:scale-105",
                    finalIsEditable && !isSleep && "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary",
                    isSleep ? sleepStyles : (subject.id === 'idle' ? idleStyles : getBrightness()),
                    !finalIsEditable && 'cursor-not-allowed',
                    isFuture && 'opacity-50',
                    isCurrent && activeTimerSubject && 'pulsing-glow',
                    isSleep && 'opacity-70',
                    'border-border'
                )}
                style={{ 
                    backgroundColor: subject.id !== 'idle' ? subject.color : undefined,
                    ...glowStyle,
                } as React.CSSProperties}
                aria-label={`Hour ${hour}:00, current state: ${subject.name}. Click to change.`}
                disabled={!finalIsEditable || isSleep}
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
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-semibold">{subject.name}</p>
                <p className="text-sm text-muted-foreground">Duration: {duration} minutes</p>
                <p className="text-xs text-muted-foreground">{timeSlot}</p>
                 {isCurrent && <p className="text-xs text-red-500 font-semibold">In Progress</p>}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
