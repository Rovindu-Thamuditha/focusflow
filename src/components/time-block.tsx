"use client"

import { cn } from "@/lib/utils";
import { Zap, Coffee, Bed } from "lucide-react";
import * as React from 'react';

export type TimeBlockStatus = 'rest' | 'partial' | 'focus';

export interface TimeBlockState {
  hour: number;
  status: TimeBlockStatus;
}

interface TimeBlockProps extends TimeBlockState {
  onStatusChange: (hour: number, newStatus: TimeBlockStatus) => void;
}

const statusConfig: Record<TimeBlockStatus, { icon: React.ElementType, label: string, colorClasses: string }> = {
  rest: { icon: Bed, label: 'Rest', colorClasses: 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20' },
  partial: { icon: Coffee, label: 'Partial Focus', colorClasses: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 ring-cyan-500' },
  focus: { icon: Zap, label: 'Full Focus', colorClasses: 'bg-primary/20 text-primary hover:bg-primary/30 ring-primary' },
};

const statusCycle: Record<TimeBlockStatus, TimeBlockStatus> = {
  rest: 'partial',
  partial: 'focus',
  focus: 'rest',
};

export function TimeBlock({ hour, status, onStatusChange }: TimeBlockProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleClick = () => {
    const nextStatus = statusCycle[status];
    onStatusChange(hour, nextStatus);
    setIsAnimating(true);
  };
  
  const { icon: Icon, label, colorClasses } = statusConfig[status];
  const formattedHour = hour.toString().padStart(2, '0');

  const handleAnimationEnd = () => {
    setIsAnimating(false);
  };

  return (
    <button
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
      className={cn(
        "relative aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
        colorClasses,
        status !== 'rest' && 'ring-1',
        isAnimating && 'animate-pulse'
      )}
      aria-label={`Hour ${hour}:00, current state: ${label}. Click to change.`}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      <span className="text-[10px] sm:text-xs font-mono mt-1">{formattedHour}:00</span>
      {status === 'focus' && (
        <div className="absolute inset-0 rounded-lg glow-primary opacity-50 pointer-events-none"></div>
      )}
      {status === 'partial' && (
        <div className="absolute inset-0 rounded-lg glow-accent opacity-40 pointer-events-none"></div>
      )}
    </button>
  );
}
