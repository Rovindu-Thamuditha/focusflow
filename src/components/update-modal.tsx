'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, AlertCircle } from 'lucide-react';
import { checkAppUpdate, type UpdateInfo } from '@/lib/update-check';
import { Browser } from '@capacitor/browser';

/**
 * DATA SAFETY NOTE:
 * When a user clicks 'Update Now' and installs the APK, the Android system
 * recognizes the App ID (app.gridfocus.mobile). It performs an "In-place"
 * update which PRESERVES all internal data:
 * - Firebase Auth Tokens (Users stay logged in)
 * - localStorage / IndexedDB (Offline logs are safe)
 * - Capacitor configuration
 */

export function UpdateModal() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only auto-show modal on native platforms to avoid bothering web users 
    // unless they manually check in settings
    const runCheck = async () => {
      const update = await checkAppUpdate();
      if (update) {
        setUpdateInfo(update);
        setIsOpen(true);
      }
    };
    
    runCheck();
  }, []);

  const handleUpdate = async () => {
    if (updateInfo?.apkUrl) {
      // Open the absolute APK URL in an external browser for download
      await Browser.open({ url: updateInfo.apkUrl });
      setIsOpen(false);
    }
  };

  if (!updateInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-primary/20 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Upgrade Found</span>
          </div>
          <DialogTitle className="text-xl font-bold">New Version {updateInfo.latestVersion}</DialogTitle>
          <DialogDescription className="text-sm">
            A new update is available with fixes and performance improvements.
          </DialogDescription>
        </DialogHeader>
        
        {updateInfo.message && (
          <div className="p-3 bg-muted/50 border rounded-lg text-xs flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="italic text-muted-foreground">{updateInfo.message}</p>
          </div>
        )}

        <div className="text-[10px] text-muted-foreground text-center px-2">
          Your local focus data and account session will be preserved during this update.
        </div>

        <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            className="flex-1 rounded-xl h-11"
          >
            Later
          </Button>
          <Button 
            onClick={handleUpdate} 
            className="flex-1 gap-2 font-bold rounded-xl h-11 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Update Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
