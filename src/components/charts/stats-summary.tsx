
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Timer, Trophy, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsSummaryProps {
  totalMinutes: number;
  topSubject: string;
  activeDays: number;
  isAnonymous: boolean;
}

export function StatsSummary({ totalMinutes, topSubject, activeDays, isAnonymous }: StatsSummaryProps) {
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return { h, m };
  };

  const { h, m } = formatTime(totalMinutes);

  const cards = [
    {
      label: 'Total Focus',
      value: `${h}h ${m}m`,
      icon: Timer,
      color: 'text-primary',
      bg: 'bg-primary/5'
    },
    {
      label: 'Top Subject',
      value: topSubject,
      icon: Trophy,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/5'
    },
    {
      label: 'Active Days',
      value: `${activeDays} days`,
      icon: CalendarCheck,
      color: 'text-accent',
      bg: 'bg-accent/5'
    }
  ];

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4", isAnonymous && "blur-sm pointer-events-none")}>
      {cards.map((card, i) => (
        <Card key={i} className="border-primary/10 overflow-hidden relative group hover:border-primary/30 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl transition-colors group-hover:scale-110 duration-300", card.bg)}>
              <card.icon className={cn("w-6 h-6", card.color)} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
              <p className="text-xl font-black text-foreground">{card.value}</p>
            </div>
            <div className={cn("absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500", card.color)}>
              <card.icon className="w-24 h-24 rotate-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
