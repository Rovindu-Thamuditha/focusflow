"use client";

import { useState } from 'react';
import { Settings, Trash2, PlusCircle, Palette, Languages } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Subject } from '@/lib/types';
import { ALL_ICONS } from '@/lib/icons';

interface SettingsDialogProps {
  subjects: Subject[];
  sleepHours: number[];
  language: 'english' | 'sinhala';
  onSave: (sleepHours: number[], subjects: Subject[], language: 'english' | 'sinhala') => void;
}

const allHours = Array.from({ length: 24 }, (_, i) => i);

export function SettingsDialog({ subjects, sleepHours, language, onSave }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSleepHours, setLocalSleepHours] = useState<number[]>(sleepHours);
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(subjects);
  const [localLanguage, setLocalLanguage] = useState<'english' | 'sinhala'>(language);

  // Sync state when props change (dialog is reopened)
  useState(() => {
    setLocalSleepHours(sleepHours);
    setLocalSubjects(subjects);
    setLocalLanguage(language);
  });

  const handleSave = () => {
    onSave(localSleepHours, localSubjects.filter(s => s.id !== 'idle' && s.id !== 'sleep'), localLanguage);
    setIsOpen(false);
  };
  
  const handleSleepCheckboxChange = (hour: number, checked: boolean) => {
    setLocalSleepHours(prev => {
        if(checked) {
            return [...prev, hour];
        } else {
            return prev.filter(h => h !== hour);
        }
    })
  }

  const handleSubjectChange = (index: number, field: keyof Subject, value: string) => {
    const newSubjects = [...localSubjects];
    (newSubjects[index] as any)[field] = value;
    setLocalSubjects(newSubjects);
  };

  const addSubject = () => {
    setLocalSubjects([...localSubjects, { id: `custom-${Date.now()}`, name: 'New Subject', icon: 'Sparkles', color: '#888888' }]);
  };

  const removeSubject = (index: number) => {
    setLocalSubjects(localSubjects.filter((_, i) => i !== index));
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your GridFocus experience.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="py-4">
             <div className="space-y-4">
                <h4 className="font-semibold">General Settings</h4>
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        <Label htmlFor="language-select">Challenge Language</Label>
                    </div>
                    <Select onValueChange={(value: 'english' | 'sinhala') => setLocalLanguage(value)} defaultValue={localLanguage}>
                        <SelectTrigger id="language-select" className="w-[180px]">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="sinhala">Sinhala</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             </div>
          </TabsContent>
          <TabsContent value="subjects" className="py-4">
            <h4 className="font-semibold mb-2">Customize Subjects</h4>
            <p className="text-sm text-muted-foreground mb-4">Add, remove, or edit your focus subjects.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {localSubjects.filter(s => s.id !== 'idle' && s.id !== 'sleep').map((subject, index) => (
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
          <TabsContent value="sleep" className="py-4">
            <h4 className="font-semibold mb-2">Default Sleep Hours</h4>
            <p className="text-sm text-muted-foreground mb-4">Select hours you're usually asleep. These blocks will be marked as 'Sleep'.</p>
            <div className="grid grid-cols-4 gap-2">
                {allHours.map(hour => (
                    <div key={hour} className="flex items-center space-x-2">
                         <Checkbox
                            id={`sleep-hour-${hour}`}
                            checked={localSleepHours.includes(hour)}
                            onCheckedChange={(checked) => handleSleepCheckboxChange(hour, !!checked)}
                        />
                        <Label htmlFor={`sleep-hour-${hour}`} className="text-sm font-mono">
                           {String(hour).padStart(2, '0')}:00
                        </Label>
                    </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
