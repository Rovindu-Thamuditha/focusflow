
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Subject } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTimer } from '@/context/timer-context';

interface FloatingTimerProps {
  subjects: Subject[];
}

export function FloatingTimer({
  subjects,
}: FloatingTimerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const { 
    timerIsRunning, 
    elapsedSeconds, 
    timerSubject, 
    setTimerSubject,
    startTimer,
    stopTimer 
  } = useTimer();

  const handleStart = () => {
    startTimer();
    setIsDialogOpen(false);
  };
  
  const handleStopConfirm = () => {
    stopTimer();
    setIsAlertOpen(false);
    setIsDialogOpen(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const filteredSubjects = subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep');
  const activeSubject = subjects.find(s => s.id === timerSubject);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
            variant="default"
            className={cn(
                "fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 text-white",
                timerIsRunning ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary/90'
            )}
            title={timerIsRunning ? 'View Focus Timer' : 'Start Focus Timer'}
        >
          <Timer className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{timerIsRunning ? 'Focus Session In Progress' : 'Start New Focus Session'}</DialogTitle>
          <DialogDescription>
            {timerIsRunning 
                ? `Tracking time for: ${activeSubject?.name || '...'}`
                : 'Select a subject to begin tracking your focus time.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Select onValueChange={setTimerSubject} defaultValue={timerSubject} disabled={timerIsRunning}>
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
          {timerIsRunning ? (
             <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogTrigger asChild>
                    <Button className="w-full bg-red-500 hover:bg-red-600">
                        <Square className="mr-2" /> Stop Session
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will stop the current focus session. The time will be added to the current hour block.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStopConfirm}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={handleStart} className="w-full bg-green-500 hover:bg-green-600">
                <Play className="mr-2"/> Start Session
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
