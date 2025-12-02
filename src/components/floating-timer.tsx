
"use client";

import { useState } from 'react';
import { Play, Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Subject } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FloatingTimerProps {
  subjects: Subject[];
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  subject: string;
  setSubject: (subjectId: string) => void;
  elapsedSeconds: number;
  setElapsedSeconds: (seconds: number) => void;
}

export function FloatingTimer({
  subjects,
  isRunning,
  setIsRunning,
  subject,
  setSubject,
  elapsedSeconds,
  setElapsedSeconds,
}: FloatingTimerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrimaryAction = () => {
    if (isRunning) {
        setIsRunning(false);
        setIsOpen(false);
    } else {
        setElapsedSeconds(0); // Reset on new start
        setIsRunning(true);
        setIsOpen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const filteredSubjects = subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep');
  const activeSubject = subjects.find(s => s.id === subject);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isRunning && setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button
            variant="default"
            className={cn(
                "fixed bottom-4 right-20 h-14 w-14 rounded-full shadow-lg z-50 text-white",
                isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
            )}
            title={isRunning ? 'Stop Focus Timer' : 'Start Focus Timer'}
            onClick={() => {
                if(isRunning) {
                    setIsRunning(false);
                } else {
                    setIsOpen(true);
                }
            }}
        >
          {isRunning ? <Square className="h-6 w-6" /> : <Timer className="h-6 w-6" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isRunning ? 'Focus Session In Progress' : 'Start New Focus Session'}</DialogTitle>
          <DialogDescription>
            {isRunning 
                ? `Tracking time for: ${activeSubject?.name || '...'}`
                : 'Select a subject to begin tracking your focus time.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Select onValueChange={setSubject} defaultValue={subject} disabled={isRunning}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubjects.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="text-center font-mono text-4xl font-bold p-4 bg-secondary rounded-lg">
            {formatTime(elapsedSeconds)}
          </div>
        </div>
        
        <DialogFooter>
            <Button onClick={handlePrimaryAction} className={cn(isRunning ? "w-full" : "w-full bg-green-500 hover:bg-green-600")}>
                {isRunning ? <><Square className="mr-2" /> Stop Session</> : <><Play className="mr-2"/> Start Session</>}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
