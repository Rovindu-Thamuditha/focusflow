
"use client";

import { useState, useEffect } from 'react';
import { Settings, Trash2, PlusCircle, Sparkles, SlidersHorizontal, Bed, Palette, Moon, Sun, ListTodo, Timer, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import type { Subject } from '@/lib/types';
import { ALL_ICONS } from '@/lib/icons';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Icons } from './icons';
import { ScrollArea } from './ui/scroll-area';

interface OnboardingDialogProps {
  isOpen: boolean;
  onFinish: (settings: any) => void;
  initialSettings: {
    subjects: Subject[];
    sleepHours: number[];
    language: 'english' | 'sinhala';
    enableTimer: boolean;
    enableDailyChallenge: boolean;
    enableTodoList: boolean;
  };
}

const TOTAL_STEPS = 4;
const allHours = Array.from({ length: 24 }, (_, i) => i);

export function OnboardingDialog({ isOpen, onFinish, initialSettings }: OnboardingDialogProps) {
  const [step, setStep] = useState(1);
  
  const [subjects, setSubjects] = useState(initialSettings.subjects);
  const [sleepHours, setSleepHours] = useState(initialSettings.sleepHours);
  const [enableTimer, setEnableTimer] = useState(initialSettings.enableTimer);
  const [enableDailyChallenge, setEnableDailyChallenge] = useState(initialSettings.enableDailyChallenge);
  const [enableTodoList, setEnableTodoList] = useState(initialSettings.enableTodoList);

  const handleFinish = () => {
    onFinish({ subjects, sleepHours, enableTimer, enableDailyChallenge, enableTodoList, language: initialSettings.language });
  };

  const handleNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));
  
  const handleSleepCheckboxChange = (hour: number, checked: boolean) => {
    setSleepHours(prev => checked ? [...prev, hour] : prev.filter(h => h !== hour));
  };

  const handleSubjectChange = (index: number, field: keyof Subject, value: string) => {
    const newSubjects = [...subjects];
    const subjectToChange = subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep')[index];
    const actualIndex = subjects.findIndex(s => s.id === subjectToChange.id);
    if(actualIndex !== -1) {
        (newSubjects[actualIndex] as any)[field] = value;
        setSubjects(newSubjects);
    }
  };

  const addSubject = () => {
    setSubjects([...subjects, { id: `custom-${Date.now()}`, name: 'New Subject', icon: 'Sparkles', color: '#888888' }]);
  };

  const removeSubject = (indexToRemove: number) => {
    const subjectToRemove = subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep')[indexToRemove];
    if (subjectToRemove) {
      setSubjects(subjects.filter(s => s.id !== subjectToRemove.id));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl" hideCloseButton>
        <DialogHeader>
          <div className="flex justify-center items-center mb-4">
            <Icons.logo className="h-12 w-12 text-primary glow-primary"/>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Welcome to GridFocus!</DialogTitle>
          <DialogDescription className="text-center">
            Let's personalize your setup for the best experience.
          </DialogDescription>
        </DialogHeader>

        <Progress value={(step / TOTAL_STEPS) * 100} className="w-full my-4" />
        <ScrollArea className="h-[40vh] pr-6">
            <div className="min-h-[250px]">
                {step === 1 && (
                    <div className="text-center space-y-4 py-8">
                        <h3 className="text-xl font-semibold">Ready to Focus?</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            GridFocus helps you visualize your day, track your study sessions, and conquer your goals.
                            This quick setup will tailor the app just for you.
                        </p>
                    </div>
                )}
                {step === 2 && (
                    <div>
                        <h4 className="font-semibold mb-2 text-lg flex items-center gap-2"><Palette /> Customize Your Subjects</h4>
                        <p className="text-sm text-muted-foreground mb-4">What will you be focusing on? Add your subjects and pick a color and icon for each.</p>
                        <div className="space-y-2">
                        {subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep').map((subject, index) => (
                            <div key={subject.id} className="flex items-center gap-2 p-2 border rounded-lg">
                            <Input type="color" value={subject.color} onChange={(e) => handleSubjectChange(index, 'color', e.target.value)} className="w-10 h-10 p-1" />
                            <Input value={subject.name} onChange={(e) => handleSubjectChange(index, 'name', e.target.value)} className="flex-grow" />
                            <Select onValueChange={(value) => handleSubjectChange(index, 'icon', value)} defaultValue={subject.icon}>
                                <SelectTrigger className="w-24"><SelectValue placeholder="Icon"/></SelectTrigger>
                                <SelectContent>
                                    {ALL_ICONS.map(Icon => <SelectItem key={Icon.displayName} value={Icon.displayName!}><Icon className="w-4 h-4 inline-block mr-2"/>{Icon.displayName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => removeSubject(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                        ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={addSubject} className="mt-4 w-full"><PlusCircle className="mr-2" /> Add Subject</Button>
                    </div>
                )}
                {step === 3 && (
                    <div>
                        <h4 className="font-semibold mb-2 text-lg flex items-center gap-2"><Moon /> Set Your Sleep Hours</h4>
                        <p className="text-sm text-muted-foreground mb-4">Mark the hours you're typically asleep. This helps set up your daily grid.</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {allHours.map(hour => (
                                <div key={hour} className="flex items-center space-x-2">
                                    <Checkbox id={`onboarding-sleep-${hour}`} checked={sleepHours.includes(hour)} onCheckedChange={(checked) => handleSleepCheckboxChange(hour, !!checked)} />
                                    <Label htmlFor={`onboarding-sleep-${hour}`} className="text-sm font-mono">{String(hour).padStart(2, '0')}:00</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {step === 4 && (
                    <div>
                        <h4 className="font-semibold mb-2 text-lg flex items-center gap-2"><SlidersHorizontal /> Enable Features</h4>
                        <p className="text-sm text-muted-foreground mb-4">Choose the tools you want to use. You can always change these later in Settings.</p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <Label htmlFor="enable-timer-onboarding" className="flex flex-col gap-1">
                                    <span className="font-semibold flex items-center gap-2"><Timer /> Focus Timer</span>
                                    <span className="font-normal text-muted-foreground text-xs">A live timer to track focus sessions.</span>
                                </Label>
                                <Switch id="enable-timer-onboarding" checked={enableTimer} onCheckedChange={setEnableTimer} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <Label htmlFor="enable-daily-challenge-onboarding" className="flex flex-col gap-1">
                                    <span className="font-semibold flex items-center gap-2"><Trophy /> Daily Challenge</span>
                                    <span className="font-normal text-muted-foreground text-xs">A daily academic question to solve.</span>
                                </Label>
                                <Switch id="enable-daily-challenge-onboarding" checked={enableDailyChallenge} onCheckedChange={setEnableDailyChallenge} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label htmlFor="enable-todo-list-onboarding" className="flex flex-col gap-1">
                                    <span className="font-semibold flex items-center gap-2"><ListTodo /> Todo List</span>
                                    <span className="font-normal text-muted-foreground text-xs">A simple task list for your day.</span>
                                </Label>
                                <Switch id="enable-todo-list-onboarding" checked={enableTodoList} onCheckedChange={setEnableTodoList} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>

        <DialogFooter className="pt-6">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>Back</Button>
          )}
          <div className="flex-grow"></div>
          {step < TOTAL_STEPS ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleFinish}>Let's Go!</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
