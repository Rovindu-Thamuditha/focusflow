'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';
import { checkAppUpdate, type UpdateInfo } from '@/lib/update-check';
import { Browser } from '@capacitor/browser';

/**
 * A global update checker component that runs on mount.
 * Displays a non-intrusive modal if a new version is detected.
 */
export function UpdateModal() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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
            <span className="text-[10px] font-black uppercase tracking-widest">Update Available</span>
          </div>
          <DialogTitle className="text-xl font-bold">New Version Ready!</DialogTitle>
          <DialogDescription className="text-sm">
            A newer version of GridFocus ({updateInfo.latestVersion}) is available with the latest features and fixes.
          </DialogDescription>
        </DialogHeader>
        
        {updateInfo.releaseNotes && (
          <div className="p-3 bg-muted/50 border rounded-lg text-xs italic text-muted-foreground">
            &ldquo;{updateInfo.releaseNotes}&rdquo;
          </div>
        )}

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
            className="flex-1 gap-2 font-bold rounded-xl h-11 shadow-lg shadow-primary/20"
          >
            <Download className="w-4 h-4" />
            Update Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
