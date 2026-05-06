
'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StreakCounterProps {
  count: number;
  goalHours: number;
  className?: string;
}

export function StreakCounter({ count, goalHours, className }: StreakCounterProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500",
            count > 0 
              ? "bg-orange-500/10 border border-orange-500/20 text-orange-500 glow-orange" 
              : "bg-muted text-muted-foreground grayscale",
            className
          )}>
            <div className="relative">
              <Flame className={cn(
                "w-5 h-5",
                count > 0 && "animate-pulse"
              )} fill={count > 0 ? "currentColor" : "none"} />
              {count > 0 && (
                <div className="absolute inset-0 blur-sm bg-orange-500/50 animate-pulse rounded-full" />
              )}
            </div>
            <span className="font-bold text-sm tracking-tighter">{count} DAY STREAK</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium text-xs">
            {count > 0 
              ? `You've focused for ${goalHours}+ hours for ${count} days in a row!` 
              : `Focus for ${goalHours} hours today to start a streak!`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
