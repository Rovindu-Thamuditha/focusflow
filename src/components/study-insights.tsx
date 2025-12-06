'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Target, TrendingUp, Zap } from 'lucide-react';
import type { StudyAnalysisOutput } from '@/ai/flows/analyze-study-data-flow';

interface StudyInsightsProps {
    analysis: StudyAnalysisOutput;
}

export function StudyInsights({ analysis }: StudyInsightsProps) {

    const { focusStreak, keyInsight, suggestions } = analysis;

    return (
        <Card className="w-full max-w-4xl mx-auto border-primary/30">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2">
                    <Target className="w-8 h-8 text-primary" />
                    <CardTitle className="text-3xl font-bold">Your AI Study Analysis</CardTitle>
                </div>
                <CardDescription>Insights and suggestions based on your recent activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <Card className="p-4 bg-secondary/50">
                        <div className="flex items-center justify-center gap-2">
                             <Zap className="w-6 h-6 text-yellow-400"/>
                             <h3 className="text-lg font-semibold">Focus Streak</h3>
                        </div>
                        <p className="text-4xl font-bold text-primary">{focusStreak}</p>
                        <p className="text-sm text-muted-foreground">consecutive days</p>
                    </Card>
                     <Card className="p-4 bg-secondary/50">
                        <div className="flex items-center justify-center gap-2">
                            <TrendingUp className="w-6 h-6 text-accent"/>
                            <h3 className="text-lg font-semibold">Key Insight</h3>
                        </div>
                        <p className="text-base mt-2 min-h-[40px] flex items-center justify-center">
                           {keyInsight}
                        </p>
                    </Card>
                </div>
                
                {/* Suggestions */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Lightbulb className="text-accent" /> AI Suggestions</h3>
                    <ul className="space-y-3">
                        {suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                                <div className="mt-1 w-4 h-4 text-primary flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                </div>
                                <span className="text-foreground">{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
