
"use client";

import { useState, useEffect } from 'react';
import { Settings, Trash2, PlusCircle, Languages, Sparkles, SlidersHorizontal, Bed, MessageSquarePlus, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Subject } from '@/lib/types';
import { ALL_ICONS } from '@/lib/icons';
import { Switch } from '@/components/ui/switch';
import { FeedbackDialog } from './feedback-dialog';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface PrivacySettings {
    shareTotalFocusTime: boolean;
    participateInLeaderboards: boolean;
    shareSubjectBreakdown: boolean;
}

interface SettingsDialogProps {
  subjects: Subject[];
  sleepHours: number[];
  language: 'english' | 'sinhala';
  enableTimer: boolean;
  enableDailyChallenge: boolean;
  enableTodoList: boolean;
  onSave: (settings: {
    subjects: Subject[];
    sleepHours: number[];
    language: 'english' | 'sinhala';
    enableTimer: boolean;
    enableDailyChallenge: boolean;
    enableTodoList: boolean;
  }) => void;
}

const allHours = Array.from({ length: 24 }, (_, i) => i);

export function SettingsDialog({ 
  subjects: initialSubjects, 
  sleepHours: initialSleepHours, 
  language: initialLanguage,
  enableTimer: initialEnableTimer,
  enableDailyChallenge: initialEnableDailyChallenge,
  enableTodoList: initialEnableTodoList,
  onSave,
}: SettingsDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  // Local state for editing
  const [subjects, setSubjects] = useState(initialSubjects);
  const [sleepHours, setSleepHours] = useState(initialSleepHours);
  const [language, setLanguage] = useState(initialLanguage);
  const [enableTimer, setEnableTimer] = useState(initialEnableTimer);
  const [enableDailyChallenge, setEnableDailyChallenge] = useState(initialEnableDailyChallenge);
  const [enableTodoList, setEnableTodoList] = useState(initialEnableTodoList);

  // Privacy Settings
  const privacySettingsRef = user && !user.isAnonymous ? doc(firestore, 'users', user.uid, 'privacy', 'settings') : null;
  const { data: initialPrivacySettings } = useDoc<PrivacySettings>(privacySettingsRef);
  
  const [shareTotalFocusTime, setShareTotalFocusTime] = useState(false);
  const [participateInLeaderboards, setParticipateInLeaderboards] = useState(false);
  const [shareSubjectBreakdown, setShareSubjectBreakdown] = useState(false);


  // Sync with props when dialog opens or props change
  useEffect(() => {
    if (isOpen) {
        setSubjects(initialSubjects);
        setSleepHours(initialSleepHours);
        setLanguage(initialLanguage);
        setEnableTimer(initialEnableTimer);
        setEnableDailyChallenge(initialEnableDailyChallenge);
        setEnableTodoList(initialEnableTodoList);
    }
  }, [isOpen, initialSubjects, initialSleepHours, initialLanguage, initialEnableTimer, initialEnableDailyChallenge, initialEnableTodoList]);

  useEffect(() => {
    if (initialPrivacySettings) {
        setShareTotalFocusTime(initialPrivacySettings.shareTotalFocusTime);
        setParticipateInLeaderboards(initialPrivacySettings.participateInLeaderboards);
        setShareSubjectBreakdown(initialPrivacySettings.shareSubjectBreakdown);
    }
  }, [initialPrivacySettings]);


  const handleSave = async () => {
    onSave({ subjects, sleepHours, language, enableTimer, enableDailyChallenge, enableTodoList });
    
    // Save privacy settings
    if (privacySettingsRef) {
        try {
            await setDoc(privacySettingsRef, {
                id: 'settings',
                shareTotalFocusTime,
                participateInLeaderboards,
                shareSubjectBreakdown
            }, { merge: true });
            toast({ title: "Settings Saved", description: "Your preferences have been updated." });
        } catch (error) {
            console.error("Error saving privacy settings:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save privacy settings." });
        }
    }
    
    setIsOpen(false);
  };

  const handleSleepCheckboxChange = (hour: number, checked: boolean) => {
    setSleepHours(prev => {
        if(checked) {
            return [...prev, hour];
        } else {
            return prev.filter(h => h !== hour);
        }
    })
  }

  const handleSubjectChange = (index: number, field: keyof Subject, value: string) => {
    const newSubjects = [...subjects];
    const actualIndex = subjects.findIndex(s => s.id === subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep')[index].id);
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
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your GridFocus experience.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" className="max-h-[70vh] overflow-y-auto pr-2">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="privacy" disabled={user?.isAnonymous}>Privacy</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="py-4 px-1">
             <div className="space-y-4">
                <h4 className="font-semibold">General Settings</h4>
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        <Label htmlFor="language-select">Challenge Language</Label>
                    </div>
                    <Select onValueChange={(value: 'english' | 'sinhala') => setLanguage(value)} defaultValue={language}>
                        <SelectTrigger id="language-select" className="w-[180px]">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="sinhala">Sinhala</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="feedback" className="flex items-center gap-2"><MessageSquarePlus className="w-5 h-5" /> Submit Feedback</Label>
                    <Button size="sm" onClick={() => { setIsOpen(false); setIsFeedbackOpen(true); }}>
                        Give Feedback
                    </Button>
                </div>
             </div>
          </TabsContent>
          <TabsContent value="subjects" className="py-4 px-1">
            <h4 className="font-semibold mb-2">Customize Subjects</h4>
            <p className="text-sm text-muted-foreground mb-4">Add, remove, or edit your focus subjects.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep').map((subject, index) => (
                <div key={subject.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  <Input
                    type="color"
                    value={subject.color}
                    onChange={(e) => handleSubjectChange(index, 'color', e.target.value)}
                    className="w-10 h-10 p-1"
                  />
                  <Input
                    value={subject.name}
                    onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                    className="flex-grow"
                  />
                  <Select onValueChange={(value) => handleSubjectChange(index, 'icon', value)} defaultValue={subject.icon}>
                      <SelectTrigger className="w-24">
                          <SelectValue placeholder="Icon"/>
                      </SelectTrigger>
                      <SelectContent>
                          {ALL_ICONS.map(Icon => <SelectItem key={Icon.displayName} value={Icon.displayName!}><Icon className="w-4 h-4 inline-block mr-2"/>{Icon.displayName}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeSubject(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addSubject} className="mt-4 w-full">
              <PlusCircle className="mr-2" /> Add Subject
            </Button>
          </TabsContent>
          <TabsContent value="sleep" className="py-4 px-1">
            <h4 className="font-semibold mb-2">Default Sleep Hours</h4>
            <p className="text-sm text-muted-foreground mb-4">Select hours you're usually asleep. The grid will reset to these sleep hours if you reset a day.</p>
            <div className="grid grid-cols-4 gap-2">
                {allHours.map(hour => (
                    <div key={hour} className="flex items-center space-x-2">
                         <Checkbox
                            id={`sleep-hour-${hour}`}
                            checked={sleepHours.includes(hour)}
                            onCheckedChange={(checked) => handleSleepCheckboxChange(hour, !!checked)}
                        />
                        <Label htmlFor={`sleep-hour-${hour}`} className="text-sm font-mono">
                           {String(hour).padStart(2, '0')}:00
                        </Label>
                    </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="features" className="py-4 px-1">
             <div className="space-y-4">
                <h4 className="font-semibold">Toggle Features</h4>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="enable-timer" className="flex items-center gap-2"><SlidersHorizontal className="w-5 h-5" /> Enable Focus Timer</Label>
                    <Switch
                        id="enable-timer"
                        checked={enableTimer}
                        onCheckedChange={setEnableTimer}
                    />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="enable-daily-challenge" className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Enable Daily Challenge</Label>
                    <Switch
                        id="enable-daily-challenge"
                        checked={enableDailyChallenge}
                        onCheckedChange={setEnableDailyChallenge}
                    />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="enable-todo-list" className="flex items-center gap-2"><Bed className="w-5 h-5" /> Enable Todo List</Label>
                    <Switch
                        id="enable-todo-list"
                        checked={enableTodoList}
                        onCheckedChange={setEnableTodoList}
                    />
                </div>
             </div>
          </TabsContent>
          <TabsContent value="privacy" className="py-4 px-1">
             <div className="space-y-4">
                <h4 className="font-semibold">Friend & Privacy Settings</h4>
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="share-focus-time" className="flex flex-col gap-1">
                        <span className="font-medium flex items-center gap-2">Share Total Focus Time</span>
                        <span className="font-normal text-muted-foreground text-xs">Allow friends to see your total focused hours.</span>
                    </Label>
                    <Switch
                        id="share-focus-time"
                        checked={shareTotalFocusTime}
                        onCheckedChange={setShareTotalFocusTime}
                        disabled={user?.isAnonymous}
                    />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="participate-leaderboards" className="flex flex-col gap-1">
                        <span className="font-medium flex items-center gap-2">Participate in Leaderboards</span>
                        <span className="font-normal text-muted-foreground text-xs">Appear on leaderboards visible to your friends.</span>
                    </Label>
                    <Switch
                        id="participate-leaderboards"
                        checked={participateInLeaderboards}
                        onCheckedChange={setParticipateInLeaderboards}
                        disabled={user?.isAnonymous}
                    />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="share-subject-breakdown" className="flex flex-col gap-1">
                        <span className="font-medium flex items-center gap-2">Share Subject Breakdown</span>
                        <span className="font-normal text-muted-foreground text-xs">Let friends see how your time is divided by subject.</span>
                    </Label>
                    <Switch
                        id="share-subject-breakdown"
                        checked={shareSubjectBreakdown}
                        onCheckedChange={setShareSubjectBreakdown}
                        disabled={user?.isAnonymous}
                    />
                </div>
             </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <FeedbackDialog isOpen={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
}
