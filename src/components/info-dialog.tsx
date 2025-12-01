
"use client";

import { useState } from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function InfoDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="How to use">
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How to Use GridFocus</DialogTitle>
          <DialogDescription>
            A quick guide to tracking your focus and getting things done.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
            <div className="space-y-1">
                <h4 className="font-semibold">1. Track Your Day</h4>
                <p className="text-muted-foreground">The 24-hour grid represents your day. Each block is an hour. After an hour passes, you can click on its block to log your activity.</p>
            </div>
             <div className="space-y-1">
                <h4 className="font-semibold">2. Log Your Focus Time</h4>
                <p className="text-muted-foreground">When you click a block, a popup appears. Select the subject you worked on and enter how many minutes you were focused during that hour. Then hit "Save".</p>
            </div>
             <div className="space-y-1">
                <h4 className="font-semibold">3. View Your Stats</h4>
                <p className="text-muted-foreground">Click the <span className="font-bold">Bar Chart</span> icon in the header to see a detailed graph of your focus time over different periods. This helps you understand your habits.</p>
            </div>
             <div className="space-y-1">
                <h4 className="font-semibold">4. Manage Your Tasks</h4>
                <p className="text-muted-foreground">Use the "Today's Tasks" list to add, check off, and delete your to-do items. It's a simple way to keep track of what you need to accomplish.</p>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
