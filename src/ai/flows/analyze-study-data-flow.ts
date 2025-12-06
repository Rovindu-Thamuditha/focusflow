'use server';
/**
 * @fileOverview A flow for analyzing a user's study data to provide insights.
 *
 * - analyzeStudyData - A function that handles the analysis process.
 * - StudyAnalysisInput - The input type for the analysis function.
 * - StudyAnalysisOutput - The return type for the analysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { firestoreAdmin } from '@/firebase/server-init';
import type { DailySummary, Subject } from '@/lib/types';
import { defaultSubjects } from '@/lib/subjects';
import { format } from 'date-fns';

// Define the structured output we expect from the AI model.
const StudyAnalysisOutputSchema = z.object({
    focusStreak: z.number().describe("The user's current streak of consecutive days with focused time (>0 minutes)."),
    keyInsight: z.string().describe("A single, concise, and important insight about the user's study habits. Frame this as the main takeaway."),
    suggestions: z.array(z.string()).describe("A list of 2-3 actionable, short, and encouraging suggestions for improvement based on the data."),
});
export type StudyAnalysisOutput = z.infer<typeof StudyAnalysisOutputSchema>;

// Define the input for the flow.
const StudyAnalysisInputSchema = z.object({
  userId: z.string().describe("The ID of the user to analyze."),
});
export type StudyAnalysisInput = z.infer<typeof StudyAnalysisInputSchema>;


// The main prompt for the AI model.
const analysisPrompt = ai.definePrompt({
  name: 'studyAnalysisPrompt',
  input: {
    schema: z.object({
      summaries: z.string().describe("A JSON string of the user's daily study summaries for the last 30 days."),
      subjects: z.string().describe("A JSON string of the user's custom subject configuration."),
      currentDate: z.string().describe("The current date in YYYY-MM-DD format."),
    }),
  },
  output: { schema: StudyAnalysisOutputSchema },
  prompt: `You are an expert study coach named 'FocusFlow AI'. Your goal is to analyze a student's study data to provide encouraging, actionable insights.

Analyze the following user data:
- Current Date: {{{currentDate}}}
- User's Subjects: {{{subjects}}}
- User's Daily Summaries (last 30 days): {{{summaries}}}

Based on the data, you MUST perform the following tasks and return them in the specified JSON format:

1.  **Calculate 'focusStreak'**: Determine the number of consecutive days, ending on yesterday or today, where the user logged more than 0 total focused minutes. If today has 0 minutes but yesterday had focus, the streak is based on yesterday. If yesterday and today both have 0, the streak is 0.

2.  **Generate 'keyInsight'**: Identify the single most important trend or pattern. This should be a clear, positive, or constructive observation. Examples: "You've consistently focused on Physics, showing great dedication." or "Your focus time is highest on weekends, which is a great strategy for deep learning." or "Lately, your study sessions have become shorter and more spread out."

3.  **Generate 'suggestions'**: Provide 2-3 short, encouraging, and actionable tips. These should be directly related to the data. Examples: "Try dedicating a 30-minute block to Chemistry tomorrow to build momentum." or "You had a great 3-day streak last week. Let's aim for that again!" or "Consider scheduling short breaks after long focus periods to avoid burnout."

Your tone should be supportive and motivational, not critical. Keep all text concise.`,
});


// The main Genkit flow definition.
const analyzeStudyDataFlow = ai.defineFlow(
  {
    name: 'analyzeStudyDataFlow',
    inputSchema: StudyAnalysisInputSchema,
    outputSchema: StudyAnalysisOutputSchema,
  },
  async (input) => {
    // 1. Fetch user's custom subjects
    const userDocRef = firestoreAdmin.doc(`users/${input.userId}`);
    const userDoc = await userDocRef.get();
    const userSubjects: Subject[] = userDoc.exists ? (userDoc.data()?.settings?.subjects || defaultSubjects) : defaultSubjects;

    // 2. Fetch last 30 days of daily summaries
    const summariesRef = firestoreAdmin.collection(`users/${input.userId}/daily_summaries`);
    const q = summariesRef.orderBy('date', 'desc').limit(30);
    const summarySnapshot = await q.get();
    const summaries: DailySummary[] = summarySnapshot.docs.map(d => d.data() as DailySummary);

    if (summaries.length === 0) {
      // Handle case with no data to analyze
      return {
        focusStreak: 0,
        keyInsight: "Welcome! I'm ready to analyze your study habits.",
        suggestions: ["Start by logging your first focus session using the grid or the timer. I'll have your first analysis ready for you tomorrow!"],
      };
    }
    
    // 3. Call the AI model with the prepared data
    const { output } = await analysisPrompt({
        summaries: JSON.stringify(summaries),
        subjects: JSON.stringify(userSubjects.filter(s => s.id !== 'idle' && s.id !== 'sleep')),
        currentDate: format(new Date(), 'yyyy-MM-dd')
    });

    if (!output) {
      throw new Error('The AI model did not return a valid analysis.');
    }
    
    return output;
  }
);


// Exported wrapper function to be called from the client.
export async function analyzeStudyData(input: StudyAnalysisInput): Promise<StudyAnalysisOutput> {
    return await analyzeStudyDataFlow(input);
}