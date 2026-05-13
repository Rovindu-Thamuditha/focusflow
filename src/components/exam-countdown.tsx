
'use client';

import { useState, useEffect } from 'react';
import { Timer, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Hardcoded target date for G.C.E. A/L Exam (Sri Lanka)
// Usually starts late November. Adjusting to a target for 2025.
const TARGET_DATE = new Date('2025-11-24T08:30:00');

export function ExamCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user temporarily hid it this session
    const hidden = sessionStorage.getItem('hideExamCountdown');
    if (hidden) setIsVisible(false);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = TARGET_DATE.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setIsVisible(false);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTempHide = () => {
    setIsVisible(false);
    sessionStorage.setItem('hideExamCountdown', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed bottom-20 left-4 z-40 transition-all duration-500 ease-in-out sm:bottom-4",
      isMinimized ? "-translate-x-[calc(100%-2rem)]" : "translate-x-0"
    )}>
      <Card className="relative p-3 border-2 border-primary/20 bg-background/95 backdrop-blur-md shadow-2xl overflow-hidden group">
        {/* Ticking background effect */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center">
            <Timer className={cn(
              "w-5 h-5 text-primary mb-1",
              timeLeft.days < 30 ? "animate-pulse text-red-500" : "animate-spin-[duration:10s]"
            )} />
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">A/L 2025</span>
          </div>

          {!isMinimized && (
            <div className="flex gap-3 items-baseline">
              <TimeUnit value={timeLeft.days} label="Days" />
              <TimeUnit value={timeLeft.hours} label="Hrs" />
              <TimeUnit value={timeLeft.minutes} label="Min" />
              <TimeUnit value={timeLeft.seconds} label="Sec" urgent={timeLeft.days < 7} />
            </div>
          )}

          <div className="flex flex-col gap-1 ml-2">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-primary/10"
                onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </Button>
            {!isMinimized && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleTempHide}
                    title="Hide for this session"
                >
                    <X className="w-3 h-3" />
                </Button>
            )}
          </div>
        </div>

        {/* Warning bar for last month */}
        {timeLeft.days < 30 && !isMinimized && (
          <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 animate-pulse" 
              style={{ width: `${(timeLeft.days / 30) * 100}%` }} 
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function TimeUnit({ value, label, urgent }: { value: number, label: string, urgent?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={cn(
        "text-xl font-black font-mono tracking-tighter leading-none",
        urgent ? "text-red-500" : "text-foreground"
      )}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[7px] uppercase font-bold text-muted-foreground">{label}</span>
    </div>
  );
}
