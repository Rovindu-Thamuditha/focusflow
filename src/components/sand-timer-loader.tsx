
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function SandTimerLoader() {
  return (
    <div className="sand-timer">
      <div className="sand-timer__top">
        <div className="sand-timer__sand"></div>
      </div>
      <div className="sand-timer__bottom">
        <div className="sand-timer__sand"></div>
      </div>
    </div>
  );
}
