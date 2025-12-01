
'use client';

import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface CurrentTimeProps {
  time: Date;
}

export function CurrentTime({ time }: CurrentTimeProps) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-semibold p-2 rounded-lg bg-secondary">
      <Clock className="h-5 w-5 text-accent" />
      <span className="text-lg text-foreground">{format(time, 'HH:mm:ss')}</span>
    </div>
  );
}
