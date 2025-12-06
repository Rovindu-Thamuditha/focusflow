'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GridFocusLoader } from '@/components/grid-focus-loader';
import { StudyInsights } from '@/components/study-insights';
import { analyzeStudyData, type StudyAnalysisOutput } from '@/ai/flows/analyze-study-data-flow';
import type { TimeBlockState } from '@/lib/types';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface StudyInsightCache {
    id: string;
    userId: string;
    generatedAt: any;
    analysis: StudyAnalysisOutput;
}

export default function InsightsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [insights, setInsights] = useState<StudyAnalysisOutput | null>(null);

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Reference to today's cached insight document
    const insightDocRef = useMemoFirebase(() => {
        if (!user || user.isAnonymous || !firestore) return null;
        return doc(firestore, 'users', user.uid, 'insights', todayStr);
    }, [user, firestore, todayStr]);

    useEffect(() => {
        if (isUserLoading) return;
        if (!user || user.isAnonymous) {
            router.push('/login');
            return;
        }

        const getInsights = async () => {
            if (!user || !insightDocRef) return;
            
            setIsLoading(true);
            try {
                // 1. Check for a cached insight from today
                const cachedDoc = await getDoc(insightDocRef);

                if (cachedDoc.exists()) {
                    // Use the cached version
                    setInsights(cachedDoc.data().analysis);
                } else {
                    // No cache found, generate a new one
                    toast({ title: "Generating your analysis...", description: "This may take a moment. Please wait." });
                    const newAnalysis = await analyzeStudyData({ userId: user.uid });
                    
                    // Cache the new analysis in Firestore
                    await setDoc(insightDocRef, {
                        id: todayStr,
                        userId: user.uid,
                        generatedAt: serverTimestamp(),
                        analysis: newAnalysis
                    });
                    
                    setInsights(newAnalysis);
                }
            } catch (error) {
                console.error("Error getting study insights:", error);
                toast({
                    variant: "destructive",
                    title: "Analysis Failed",
                    description: "Could not generate your study insights. Please try again later.",
                });
            } finally {
                setIsLoading(false);
            }
        };

        getInsights();
    }, [user, isUserLoading, router, insightDocRef, todayStr, toast]);

    if (isUserLoading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <GridFocusLoader />
                <p className="mt-4 text-lg text-primary">Analyzing Your Focus Patterns...</p>
            </div>
        );
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
