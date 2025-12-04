
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TimeBlockState, Subject } from '@/lib/types';

interface LogTimeDialogProps {
  block: TimeBlockState;
  subjects: Subject[];
  onSave: (subject: string, duration: number) => void;
  onClose: () => void;
  onClear: () => void;
}

export function LogTimeDialog({ block, subjects, onSave, onClose, onClear }: LogTimeDialogProps) {
  const [subject, setSubject] = useState(block.subject);
  const [duration, setDuration] = useState(block.duration);

  const handleSave = () => {
    onSave(subject, duration > 60 ? 60 : duration < 0 ? 0 : duration);
  };
  
  const hour = (block.hour % 12 === 0 ? 12 : block.hour % 12) + (block.hour < 12 || block.hour === 24 ? ' AM' : ' PM');


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Activity for {hour}</DialogTitle>
          <DialogDescription>
            What did you focus on during this hour?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Select onValueChange={setSubject} defaultValue={subject}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.filter(s => s.id !== 'sleep').map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Duration (mins)
            </Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
              className="col-span-3"
              max={60}
              min={0}
            />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <div className="flex w-full sm:w-auto gap-2">
            <Button variant="destructive" onClick={onClear} className="flex-grow">Clear</Button>
            <Button onClick={handleSave} className="flex-grow">Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
