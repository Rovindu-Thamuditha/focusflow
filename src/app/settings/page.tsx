
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Trash2, PlusCircle, Languages, Sparkles, SlidersHorizontal, Bed, MessageSquarePlus, BrainCircuit, ShieldAlert, Users, Flame, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Subject } from '@/lib/types';
import { ALL_ICONS } from '@/lib/icons';
import { Switch } from '@/components/ui/switch';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { defaultSubjects } from '@/lib/subjects';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { Slider } from '@/components/ui/slider';

const allHours = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [initialSettingsLoaded, setInitialSettingsLoaded] = useState(false);

    // Settings State
    const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
    const [sleepHours, setSleepHours] = useState<number[]>([]);
    const [language, setLanguage] = useState<'english' | 'sinhala'>('english');
    const [enableTimer, setEnableTimer] = useState(true);
    const [enableDailyChallenge, setEnableDailyChallenge] = useState(true);
    const [enableTodoList, setEnableTodoList] = useState(true);
    const [enableAiInsights, setEnableAiInsights] = useState(false);
    const [disableEditRestriction, setDisableEditRestriction] = useState(false);
    const [streakGoal, setStreakGoal] = useState(2);

    // Privacy State
    const [shareTotalFocusTime, setShareTotalFocusTime] = useState(false);
    const [participateInLeaderboards, setParticipateInLeaderboards] = useState(false);

    const userDocRef = useMemoFirebase(() => user && !user.isAnonymous ? doc(firestore!, 'users', user.uid) : null, [firestore, user]);
    const { data: userData } = useDoc(userDocRef);

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.isAnonymous) {
            const settingsStr = localStorage.getItem('gridFocusSettings');
            if (settingsStr) {
                const s = JSON.parse(settingsStr);
                setSubjects(s.subjects || defaultSubjects);
                setSleepHours(s.sleepHours || []);
                setLanguage(s.language || 'english');
                setEnableTimer(s.enableTimer !== false);
                setEnableDailyChallenge(s.enableDailyChallenge !== false);
                setEnableTodoList(s.enableTodoList !== false);
                setEnableAiInsights(s.enableAiInsights === true);
                setDisableEditRestriction(s.disableEditRestriction === true);
                setStreakGoal(s.streakGoal || 2);
            }
            setInitialSettingsLoaded(true);
        } else if (userData) {
            const s = userData.settings || {};
            setSubjects(s.subjects || defaultSubjects);
            setSleepHours(s.sleepHours || []);
            setLanguage(s.language || 'english');
            setEnableTimer(s.enableTimer !== false);
            setEnableDailyChallenge(s.enableDailyChallenge !== false);
            setEnableTodoList(s.enableTodoList !== false);
            setEnableAiInsights(s.enableAiInsights === true);
            setDisableEditRestriction(s.disableEditRestriction === true);
            setStreakGoal(s.streakGoal || 2);
            
            const p = userData.privacy || {};
            setShareTotalFocusTime(p.shareTotalFocusTime || false);
            setParticipateInLeaderboards(p.participateInLeaderboards || false);
            setInitialSettingsLoaded(true);
        }
    }, [user, isUserLoading, router, userData]);

    useDebouncedEffect(() => {
        if (!initialSettingsLoaded) return;
        const settings = {
            subjects, sleepHours, language, enableTimer,
            enableDailyChallenge, enableTodoList, enableAiInsights,
            disableEditRestriction, streakGoal
        };
        
        if (user?.isAnonymous) {
            localStorage.setItem('gridFocusSettings', JSON.stringify(settings));
        } else if (userDocRef) {
            setDoc(userDocRef, { 
                settings, 
                privacy: { shareTotalFocusTime, participateInLeaderboards } 
            }, { merge: true });
        }
    }, [subjects, sleepHours, language, enableTimer, enableDailyChallenge, enableTodoList, enableAiInsights, disableEditRestriction, streakGoal, shareTotalFocusTime, participateInLeaderboards, initialSettingsLoaded], 2000);

    const handleSubjectChange = (id: string, field: keyof Subject, value: string) => {
        setSubjects(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    if (isUserLoading || !initialSettingsLoaded) return <div className="flex items-center justify-center min-h-screen"><GridFocusLoader /></div>;

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader totalFocusedTime={0} showBackButton />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings className="w-6 h-6" />Settings</CardTitle>
                        <CardDescription>Personalize your study environment. Changes save automatically.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="subjects" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="subjects">Subjects</TabsTrigger>
                                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                            </TabsList>

                            <TabsContent value="subjects" className="space-y-4 pt-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Custom Subjects</h3>
                                    <Button size="sm" variant="outline" onClick={() => setSubjects([...subjects, { id: `custom-${Date.now()}`, name: 'New Subject', icon: 'Sparkles', color: '#BE4BFF' }])}>
                                        <PlusCircle className="mr-2 w-4 h-4" /> Add Subject
                                    </Button>
                                </div>
                                <div className="grid gap-2">
                                    {subjects.filter(s => s.id !== 'idle' && s.id !== 'sleep').map((subject) => (
                                        <div key={subject.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card/50">
                                            <Input type="color" value={subject.color} onChange={(e) => handleSubjectChange(subject.id, 'color', e.target.value)} className="w-10 h-10 p-1 rounded cursor-pointer" />
                                            <Input value={subject.name} onChange={(e) => handleSubjectChange(subject.id, 'name', e.target.value)} className="flex-grow bg-transparent" />
                                            <Select onValueChange={(v) => handleSubjectChange(subject.id, 'icon', v)} defaultValue={subject.icon}>
                                                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {ALL_ICONS.map(Icon => <SelectItem key={Icon.displayName} value={Icon.displayName!}><Icon className="w-4 h-4" /></SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button variant="ghost" size="icon" onClick={() => setSubjects(subjects.filter(s => s.id !== subject.id))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="schedule" className="space-y-6 pt-4">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2 mb-2"><Bed className="w-5 h-5 text-primary" />Sleep Hours</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Select the hours you usually sleep. These blocks are fixed by default on the grid.</p>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {allHours.map(hour => (
                                            <div key={hour} className="flex items-center space-x-2 p-2 rounded border bg-card/50">
                                                <Checkbox id={`hour-${hour}`} checked={sleepHours.includes(hour)} onCheckedChange={(c) => setSleepHours(prev => c ? [...prev, hour] : prev.filter(h => h !== hour))} />
                                                <Label htmlFor={`hour-${hour}`} className="text-xs font-mono">{hour}:00</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="preferences" className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl border bg-orange-500/5 border-orange-500/10 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="flex flex-col gap-1">
                                                <span className="font-bold flex items-center gap-2 text-orange-500"><Flame className="w-4 h-4" />Daily Focus Goal</span>
                                                <span className="text-xs text-muted-foreground">The threshold needed to maintain your daily streak.</span>
                                            </Label>
                                            <span className="text-2xl font-black text-orange-500">{streakGoal}h</span>
                                        </div>
                                        <Slider value={[streakGoal]} onValueChange={([v]) => setStreakGoal(v)} max={12} min={1} step={1} className="py-2" />
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Toggles</h4>
                                        {[
                                            { id: 'timer', label: 'Live Focus Timer', val: enableTimer, set: setEnableTimer },
                                            { id: 'challenge', label: 'Daily Challenges', val: enableDailyChallenge, set: setEnableDailyChallenge },
                                            { id: 'todo', label: 'Todo List', val: enableTodoList, set: setEnableTodoList },
                                            { id: 'lock', label: '36h Edit Restriction', val: !disableEditRestriction, set: (v: boolean) => setDisableEditRestriction(!v) }
                                        ].map(f => (
                                            <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                                <Label htmlFor={f.id} className="font-medium">{f.label}</Label>
                                                <Switch id={f.id} checked={f.val} onCheckedChange={f.set} />
                                            </div>
                                        ))}
                                    </div>

                                    {!user?.isAnonymous && (
                                        <div className="space-y-3 pt-2">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Social & Privacy</h4>
                                            <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                                <Label className="flex flex-col gap-0.5">
                                                    <span>Share Profile Data</span>
                                                    <span className="text-[10px] text-muted-foreground">Friends can see your total hours.</span>
                                                </Label>
                                                <Switch checked={shareTotalFocusTime} onCheckedChange={setShareTotalFocusTime} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button variant="outline" className="w-full mt-4" onClick={() => setIsFeedbackOpen(true)}>
                                    <MessageSquarePlus className="mr-2 w-4 h-4" /> Submit App Feedback
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </main>
            <FeedbackDialog isOpen={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
        </div>
    );
}
