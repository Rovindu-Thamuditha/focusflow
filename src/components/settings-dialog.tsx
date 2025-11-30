"use client";

import { useState } from 'react';
import { Settings, Bed } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Subject } from '@/lib/types';

interface SettingsDialogProps {
  subjects: Subject[];
  sleepHours: number[];
  onSave: (sleepHours: number[]) => void;
}

const allHours = Array.from({ length: 24 }, (_, i) => i);

export function SettingsDialog({ subjects, sleepHours, onSave }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSleepHours, setLocalSleepHours] = useState<number[]>(sleepHours);

  const handleSave = () => {
    onSave(localSleepHours);
    setIsOpen(false);
  };
  
  const handleCheckboxChange = (hour: number, checked: boolean) => {
    setLocalSleepHours(prev => {
        if(checked) {
            return [...prev, hour];
        } else {
            return prev.filter(h => h !== hour);
        }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your FocusFlow experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <h4 className="font-semibold mb-2">Default Sleep Hours</h4>
            <p className="text-sm text-muted-foreground mb-4">Select the hours you are usually asleep. These blocks will be marked as 'Rest' by default each day.</p>
            <div className="grid grid-cols-6 gap-2">
                {allHours.map(hour => (
                    <div key={hour} className="flex items-center space-x-2">
                         <Checkbox
                            id={`sleep-hour-${hour}`}
                            checked={localSleepHours.includes(hour)}
                            onCheckedChange={(checked) => handleCheckboxChange(hour, !!checked)}
                        />
                        <Label htmlFor={`sleep-hour-${hour}`} className="text-sm font-mono">
                           {String(hour).padStart(2, '0')}:00
                        </Label>
                    </div>
                ))}
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
