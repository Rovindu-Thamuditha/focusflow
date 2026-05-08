'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { StudyInsights } from '@/components/study-insights';
import { analyzeStudyData, type StudyAnalysisOutput, type StudyAnalysisInput } from '@/ai/flows/analyze-study-data-flow';
import type { DailySummary, Subject } from '@/lib/types';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { defaultSubjects } from '@/lib/subjects';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff, BrainCircuit } from 'lucide-react';

export default function InsightsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const isOnline = useOnlineStatus();

    const [isLoading, setIsLoading] = useState(true);
    const [insights, setInsights] = useState<StudyAnalysisOutput | null>(null);

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const insightDocRef = useMemoFirebase(() => {
        if (!user || user.isAnonymous || !firestore) return null;
        return doc(firestore, 'users', user.uid, 'insights', todayStr);
    }, [user, firestore, todayStr]);

    const summariesQuery = useMemoFirebase(() => {
        if (!user || user.isAnonymous || !firestore) return null;
        const startDate = subDays(new Date(), 30);
        return query(
            collection(firestore, 'users', user.uid, 'daily_summaries'),
            where('date', '>=', format(startDate, 'yyyy-MM-dd')),
            orderBy('date', 'desc'),
            limit(30)
        );
    }, [user, firestore]);
    const { data: dailySummaries, isLoading: summariesLoading } = useCollection<DailySummary>(summariesQuery, { realtime: false });

    useEffect(() => {
        if (isUserLoading) return;
        if (!user || user.isAnonymous) {
            router.push('/login');
            return;
        }
        
        if (summariesLoading) return;

        const getInsights = async () => {
            if (!user || !insightDocRef || !firestore) {
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                const cachedDoc = await getDoc(insightDocRef);

                if (cachedDoc.exists()) {
                    setInsights(cachedDoc.data().analysis);
                    setIsLoading(false);
                } else if (!isOnline) {
                    setIsLoading(false);
                } else {
                    toast({ title: "Generating your analysis...", description: "This may take a moment. Please wait." });
                    
                    const userDocRef = doc(firestore, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    const userSubjects = userDoc.exists() ? (userDoc.data().subjects || defaultSubjects) : defaultSubjects;

                    const analysisInput: StudyAnalysisInput = {
                        subjects: JSON.stringify(userSubjects.filter((s: Subject) => s.id !== 'idle' && s.id !== 'sleep')),
                        summaries: JSON.stringify(dailySummaries || []),
                        currentDate: format(new Date(), 'yyyy-MM-dd')
                    };

                    // Call the flow directly instead of fetching from an API route (which is unavailable in static export)
                    const newAnalysis = await analyzeStudyData(analysisInput);
                    
                    if (Object.keys(newAnalysis).length > 0) {
                        await setDoc(insightDocRef, {
                            id: todayStr,
                            userId: user.uid,
                            generatedAt: serverTimestamp(),
                            analysis: newAnalysis
                        });
                    }
                    
                    setInsights(newAnalysis);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error getting study insights:", error);
                setIsLoading(false);
            }
        };

        getInsights();
    }, [user, isUserLoading, router, insightDocRef, todayStr, toast, dailySummaries, summariesLoading, firestore, isOnline]);

    if (isUserLoading || (isLoading && isOnline) || summariesLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <GridFocusLoader />
                <p className="mt-4 text-lg text-primary">Analyzing Your Focus Patterns...</p>
            </div>
        );
    }
    
    if (!isOnline && !insights) {
        return (
            <div className="flex flex-col min-h-screen">
                <MainHeader totalFocusedTime={0} />
                <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
                    <Card className="w-full max-w-lg text-center p-8 border-dashed border-primary/20">
                        <WifiOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <CardTitle className="text-xl font-bold">Offline Mode</CardTitle>
                        <CardDescription className="mt-2">
                            AI Study Analysis requires an internet connection. Previously generated insights will be available here when you are back online.
                        </CardDescription>
                    </Card>
                </main>
            </div>
        )
    }

    if (!insights) {
        return (
            <div className="flex flex-col min-h-screen">
                <MainHeader totalFocusedTime={0} />
                <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
                    <Card className="w-full max-w-lg text-center">
                        <CardHeader>
                            <CardTitle>Could Not Load Insights</CardTitle>
                            <CardDescription>
                                There was an error generating your study analysis. Please try refreshing the page.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader totalFocusedTime={0} />
            <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
                <StudyInsights analysis={insights} />
            </main>
        </div>
    );
}
