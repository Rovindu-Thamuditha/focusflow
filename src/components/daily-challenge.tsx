
"use client"

import { Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Question } from '@/lib/questions';
import { BlockMath } from 'react-katex';

interface DailyChallengeProps {
  question: Question;
  isSolved: boolean;
  onSolveChange: (solved: boolean) => void;
  language: 'english' | 'sinhala';
  isToday: boolean;
}

const subjectColors: Record<string, string> = {
  'Combined Maths': 'text-primary',
  'Physics': 'text-accent',
  'Chemistry': 'text-yellow-400',
  'Biology': 'text-green-400',
};

export function DailyChallenge({ question, isSolved, onSolveChange, language, isToday }: DailyChallengeProps) {
    
  const questionText = language === 'sinhala' && question.question_sinhala ? question.question_sinhala : question.question;

  return (
    <Card className="bg-card/70 border-2 border-primary/20 hover:border-primary/50 transition-colors duration-300">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <Trophy className="w-8 h-8 text-primary" />
        <div>
          <CardTitle className="text-xl font-bold">Daily Challenge</CardTitle>
          <CardDescription>One question to rule the day.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className={`font-semibold ${subjectColors[question.subject] || 'text-foreground'}`}>{question.subject}</h3>
            <p className="text-sm text-muted-foreground">{question.topic}</p>
          </div>
          <div className="p-4 bg-background rounded-lg border text-sm prose prose-invert max-w-none overflow-x-auto">
            <BlockMath math={questionText} />
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary transition-all duration-300" data-solved={isSolved}>
          <Checkbox 
            id="solve-challenge" 
            checked={isSolved}
            onCheckedChange={() => onSolveChange(!isSolved)}
            className="w-6 h-6 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-primary"
            disabled={!isToday}
          />
          <Label htmlFor="solve-challenge" className="text-base font-medium cursor-pointer">
            {isSolved ? "Challenge Conquered!" : "Mark as Solved"}
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
