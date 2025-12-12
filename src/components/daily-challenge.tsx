
"use client"

import React from 'react';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Question } from '@/lib/questions';
import { BlockMath } from 'react-katex';
import { Button } from './ui/button';

interface DailyChallengeProps {
  question: Question;
  isSolved: boolean;
  onSolveChange: (solved: boolean) => void;
  language: 'english' | 'sinhala';
  isToday: boolean;
  questionIndex: number;
  setQuestionIndex: (index: number) => void;
  totalQuestions: number;
}

const subjectColors: Record<string, string> = {
  'Combined Maths': 'text-primary',
  'Physics': 'text-accent',
  'Chemistry': 'text-yellow-400',
  'Biology': 'text-green-400',
};

const DailyChallengeMemo = ({ question, isSolved, onSolveChange, language, isToday, questionIndex, setQuestionIndex, totalQuestions }: DailyChallengeProps) => {
    
  const questionText = language === 'sinhala' && question.question_sinhala ? question.question_sinhala : question.question;

  const handleNextQuestion = () => {
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex(questionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    }
  };

  return (
    <Card className="bg-card/70 border-2 border-primary/20 hover:border-primary/50 transition-colors duration-300">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
        <Trophy className="w-6 h-6 text-primary" />
        <div>
          <CardTitle className="text-lg font-bold">Daily Challenge</CardTitle>
          <CardDescription className="text-xs">Question {questionIndex + 1} of {totalQuestions}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className={`font-semibold text-sm ${subjectColors[question.subject] || 'text-foreground'}`}>{question.subject}</h3>
            <p className="text-xs text-muted-foreground">{question.topic}</p>
          </div>
          <div className="p-3 bg-background rounded-lg border text-sm prose dark:prose-invert max-w-none break-words">
            <BlockMath math={questionText} />
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary transition-all duration-300" data-solved={isSolved}>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="solve-challenge" 
              checked={isSolved}
              onCheckedChange={() => onSolveChange(!isSolved)}
              className="w-5 h-5 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-primary"
              disabled={!isToday}
            />
            <Label htmlFor="solve-challenge" className="text-sm font-medium cursor-pointer">
              {isSolved ? "Conquered!" : "Mark as Solved"}
            </Label>
          </div>
           {isToday && (
            <div className="flex gap-1">
                <Button 
                    size="sm"
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={questionIndex === 0}
                    className="h-8"
                >
                    Prev
                </Button>
                <Button 
                    size="sm"
                    onClick={handleNextQuestion}
                    disabled={questionIndex >= totalQuestions - 1}
                    className="h-8"
                >
                    Next
                </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const DailyChallenge = React.memo(DailyChallengeMemo);
