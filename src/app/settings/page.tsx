'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Trash2, PlusCircle, Sparkles, Bed, MessageSquarePlus, ShieldAlert, Flame, Database, RefreshCw, AlertTriangle, Info, Clock, Download, Undo2, CheckCircle2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Subject, TimeBlockState } from '@/lib/types';
import { ALL_ICONS } from '@/lib/icons';
import { Switch } from '@/components/ui/switch';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, setDoc, writeBatch, collection, getDocs, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { defaultSubjects } from '@/lib/subjects';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { Slider } from '@/components/ui/slider';
import { checkAppUpdate } from '@/lib/update-check';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import packageJson from '@/../package.json';

const allHours = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [initialSettingsLoaded, setInitialSettingsLoaded] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [isRepairing, setIsRepairing] = useState(false);

    // Update States
    const [isCheckingUpdates, setIsCheckingCheckingUpdates] = useState(false);
    const [installedVersion, setInstalledVersion] = useState(packageJson.version);
    const [latestFoundVersion, setLatestFoundVersion] = useState<string | null>(null);

    // Settings State
    const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);
    const [sleepHours, setSleepHours] = useState<number[]>([]);
    const [language, setLanguage] = useState<'english' | 'sinhala'>('english');
    const [enableTimer, setEnableTimer] = useState(true);
    const [enableDailyChallenge, setEnableDailyChallenge] = useState(true);
    const [enableTodoList, setEnableTodoList] = useState(true);
    const [enableAiInsights, setEnableAiInsights] = useState(false);
    const [enableExamCountdown, setEnableExamCountdown] = useState(true);
    const [disableEditRestriction, setDisableEditRestriction] = useState(false);
    const [streakGoal, setStreakGoal] = useState(2);

    // Privacy State
    const [shareTotalFocusTime, setShareTotalFocusTime] = useState(false);
    const [participateInLeaderboards, setParticipateInLeaderboards] = useState(false);

    const userDocRef = useMemoFirebase(() => user && !user.isAnonymous ? doc(firestore!, 'users', user.uid) : null, [firestore, user]);
    const { data: userData } = useDoc(userDocRef);

    useEffect(() => {
        const getVer = async () => {
            if (Capacitor.isNativePlatform()) {
                const info = await App.getInfo();
                setInstalledVersion(info.version);
            }
        };
        getVer();
    }, []);

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
                setEnableExamCountdown(s.enableExamCountdown !== false);
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
            setEnableExamCountdown(s.enableExamCountdown !== false);
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
            enableExamCountdown, disableEditRestriction, streakGoal
        };
        
        if (user?.isAnonymous) {
            localStorage.setItem('gridFocusSettings', JSON.stringify(settings));
        } else if (userDocRef) {
            setDoc(userDocRef, { 
                settings, 
                privacy: { shareTotalFocusTime, participateInLeaderboards } 
            }, { merge: true });
        }
    }, [subjects, sleepHours, language, enableTimer, enableDailyChallenge, enableTodoList, enableAiInsights, enableExamCountdown, disableEditRestriction, streakGoal, shareTotalFocusTime, participateInLeaderboards, initialSettingsLoaded], 2000);

    const handleUpdateCheck = async () => {
        if (!navigator.onLine) {
            toast({ 
                variant: "destructive", 
                title: "You are offline", 
                description: "Cannot check for updates without an internet connection." 
            });
            return;
        }

        setIsCheckingCheckingUpdates(true);
        try {
            const update = await checkAppUpdate();
            if (update) {
                setLatestFoundVersion(update.latestVersion);
                toast({ 
                    title: "Update Available!", 
                    description: `New version ${update.latestVersion} is ready to download.` 
                });
            } else {
                setLatestFoundVersion(installedVersion);
                toast({ 
                    title: "App Up to Date", 
                    description: `You are running the latest version (${installedVersion}).` 
                });
            }
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Check Failed", description: "Failed to connect to update server." });
        } finally {
            setIsCheckingCheckingUpdates(false);
        }
    };

    const handleForceSync = async () => {
        if (!user || user.isAnonymous || !firestore) return;
        
        setIsMigrating(true);
        try {
            const batch = writeBatch(firestore);
            const oldKey = localStorage.getItem('gridTimeBlocks');
            const newKey = localStorage.getItem('gridFocusTimeBlocks');
            const dataStr = newKey || oldKey;
            
            if (!dataStr) {
                toast({ title: "No local data found" });
                setIsMigrating(false);
                return;
            }

            const localTimeBlocks: { [date: string]: TimeBlockState[] } = JSON.parse(dataStr);
            let count = 0;

            Object.entries(localTimeBlocks).forEach(([date, blocks]) => {
                blocks.forEach(block => {
                    const blockDocRef = doc(firestore, 'users', user.uid, 'time_blocks', `${date}_${block.hour}`);
                    batch.set(blockDocRef, { ...block, updatedAt: Date.now() }, { merge: true });
                    count++;
                });
            });

            if (count > 0) {
                await batch.commit();
                toast({ title: "Local Sync Complete!", description: `Migrated ${count} logs.` });
            }
        } catch (error) {
            console.error("Migration error:", error);
            toast({ variant: "destructive", title: "Sync Failed" });
        } finally {
            setIsMigrating(false);
        }
    };

    const handleSubjectChange = (id: string, field: keyof Subject, value: string) => {
        setSubjects(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    if (isUserLoading || !initialSettingsLoaded) return <div className="flex items-center justify-center min-h-screen"><GridFocusLoader /></div>;

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader totalFocusedTime={0} showBackButton />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
                <Card className="max-w-4xl mx-auto border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Settings className="w-6 h-6 text-primary" />Settings</CardTitle>
                        <CardDescription>Personalize your study environment. Changes save automatically.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="subjects" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/50 p-1 rounded-xl h-auto gap-1">
                                <TabsTrigger value="subjects" className="rounded-lg py-2">Subjects</TabsTrigger>
                                <TabsTrigger value="schedule" className="rounded-lg py-2">Schedule</TabsTrigger>
                                <TabsTrigger value="preferences" className="rounded-lg py-2">Preferences</TabsTrigger>
                                <TabsTrigger value="general" className="rounded-lg py-2">App & Updates</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg flex items-center gap-2"><Info className="w-5 h-5 text-primary" />System Status</h3>
                                    <div className="grid gap-3">
                                        <div className="flex items-center justify-between p-4 rounded-xl border bg-card/50">
                                            <div className='flex flex-col'>
                                                <span className="font-bold text-sm">Installed Version</span>
                                                <span className="text-xs text-muted-foreground">Local Build: v{installedVersion}</span>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={handleUpdateCheck} 
                                                className="gap-2 h-9"
                                                disabled={isCheckingUpdates}
                                            >
                                                {isCheckingUpdates ? (
                                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Checking...</>
                                                ) : latestFoundVersion === installedVersion ? (
                                                    <><CheckCircle2 className="w-4 h-4 text-green-500" /> Up to Date</>
                                                ) : (
                                                    <><RefreshCw className="w-4 h-4" /> Check for Updates</>
                                                )}
                                            </Button>
                                        </div>

                                        {latestFoundVersion && latestFoundVersion !== installedVersion && (
                                            <div className="flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-primary">New Update Available!</span>
                                                    <span className="text-xs text-muted-foreground">Version {latestFoundVersion} is ready.</span>
                                                </div>
                                                <Button size="sm" onClick={() => window.location.reload()}>
                                                    Restart App
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg text-[10px] text-muted-foreground italic">
                                        <Database className="w-3 h-3" />
                                        <span>Updates preserve your local IndexedDB and Firebase sessions using persistent storage matching.</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Region & Language</h3>
                                    <div className="flex items-center justify-between p-4 rounded-xl border bg-card/50">
                                        <Label htmlFor="lang">Challenge Language</Label>
                                        <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                                            <SelectTrigger id="lang" className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="english">English</SelectItem>
                                                <SelectItem value="sinhala">Sinhala</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

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
                                    <p className="text-sm text-muted-foreground mb-4">Select the hours you usually sleep. The grid will auto-populate these for new days.</p>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {allHours.map(hour => (
                                            <div key={hour} className="flex items-center space-x-2 p-2 rounded border bg-card/50">
                                                <Checkbox id={`hour-${hour}`} checked={sleepHours.includes(hour)} onCheckedChange={(c) => setSleepHours(prev => c ? [...prev, hour] : prev.filter(h => h !== hour))} />
                                                <Label htmlFor={`hour-${hour}`} className="text-xs font-mono">{hour}:00</Label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-4 italic">Note: You can temporarily override sleep hours by marking them as Active on the grid. This bypass is valid for the current day only.</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="preferences" className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl border bg-orange-500/5 border-orange-500/10 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="flex flex-col gap-1">
                                                <span className="font-bold flex items-center gap-2 text-orange-500"><Flame className="w-4 h-4" />Daily Focus Goal</span>
                                                <span className="text-xs text-muted-foreground">Threshold for your daily streak.</span>
                                            </Label>
                                            <span className="text-2xl font-black text-orange-500">{streakGoal}h</span>
                                        </div>
                                        <Slider value={[streakGoal]} onValueChange={([v]) => setStreakGoal(v)} max={12} min={1} step={1} className="py-2" />
                                    </div>

                                    {!user?.isAnonymous && (
                                        <div className="p-4 rounded-xl border bg-primary/5 border-primary/10 space-y-4">
                                             <Label className="flex flex-col gap-1">
                                                <span className="font-bold flex items-center gap-2 text-primary"><Database className="w-4 h-4" />Data Integrity & Recovery</span>
                                                <span className="text-xs text-muted-foreground">Tools to manage multi-device sync and local backups.</span>
                                            </Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Button 
                                                    variant="outline" 
                                                    className="bg-background h-auto py-3 px-4 flex-col items-start text-left gap-1" 
                                                    onClick={handleForceSync}
                                                    disabled={isMigrating}
                                                >
                                                    <div className="flex items-center gap-2 font-bold">
                                                        {isMigrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                                        Local Sync
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">Pull data from this device.</span>
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    className="bg-background h-auto py-3 px-4 flex-col items-start text-left gap-1 border-yellow-500/30 hover:border-yellow-500" 
                                                    onClick={() => {
                                                        const backupStr = localStorage.getItem('gridFocusTimeBlocks_backup');
                                                        if (!backupStr) {
                                                            toast({ variant: "destructive", title: "No backup found" });
                                                            return;
                                                        }
                                                        toast({ title: "Local Backup Ready", description: "Contact support for manual recovery instructions." });
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 font-bold text-yellow-500">
                                                        <Undo2 className="w-4 h-4" />
                                                        Undo/Restore
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">Recover from sync conflict.</span>
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                                            Features 
                                            <span className="text-[10px] font-normal lowercase italic">Manage widgets & tools</span>
                                        </h4>
                                        {[
                                            { id: 'timer', label: 'Live Focus Timer', val: enableTimer, set: setEnableTimer },
                                            { id: 'challenge', label: 'Daily Challenges', val: enableDailyChallenge, set: setEnableDailyChallenge },
                                            { id: 'todo', label: 'Todo List', val: enableTodoList, set: setEnableTodoList },
                                            { id: 'countdown', label: 'A/L Exam Countdown', val: enableExamCountdown, set: setEnableExamCountdown },
                                            { id: 'lock', label: '36h Edit Restriction', val: !disableEditRestriction, set: (v: boolean) => setDisableEditRestriction(!v) }
                                        ].map(f => (
                                            <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                                <Label htmlFor={f.id} className="font-medium">{f.label}</Label>
                                                <div className="flex items-center gap-2">
                                                    <Switch id={f.id} checked={f.val} onCheckedChange={f.set} />
                                                </div>
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
