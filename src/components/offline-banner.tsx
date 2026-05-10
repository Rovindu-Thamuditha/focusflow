'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-yellow-500/90 backdrop-blur-md text-black py-1.5 px-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider shadow-lg">
        <WifiOff className="w-3 h-3" />
        Offline mode — changes will sync automatically
      </div>
    </div>
  );
}
