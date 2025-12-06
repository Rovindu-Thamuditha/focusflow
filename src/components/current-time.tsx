
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-semibold p-2 rounded-lg bg-secondary">
      <Clock className="h-5 w-5 text-accent" />
      <span className="text-lg text-foreground">{format(time, 'HH:mm:ss')}</span>
    </div>
  );
}
