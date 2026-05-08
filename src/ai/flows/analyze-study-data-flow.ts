/**
 * @fileOverview A placeholder flow for analyzing study data.
 * Temporarily disabled for static export compatibility.
 */

import { z } from 'zod';

// Define the structured output we expect from the AI model.
const StudyAnalysisOutputSchema = z.object({
    focusStreak: z.number().describe("The user's current streak of consecutive days with focused time (>0 minutes)."),
    keyInsight: z.string().describe("A single, concise, and important insight about the user's study habits."),
    suggestions: z.array(z.string()).describe("A list of 2-3 actionable, short, and encouraging suggestions."),
});
export type StudyAnalysisOutput = z.infer<typeof StudyAnalysisOutputSchema>;

// Define the input for the flow.
const StudyAnalysisInputSchema = z.object({
  summaries: z.string().describe("A JSON string of the user's daily study summaries for the last 30 days."),
  subjects: z.string().describe("A JSON string of the user's custom subject configuration."),
  currentDate: z.string().describe("The current date in YYYY-MM-DD format."),
});
export type StudyAnalysisInput = z.infer<typeof StudyAnalysisInputSchema>;

/**
 * Placeholder function for study analysis.
 * Returns a static message instead of calling a server-side AI model.
 */
export async function analyzeStudyData(input: StudyAnalysisInput): Promise<StudyAnalysisOutput> {
    return {
        focusStreak: 0,
        keyInsight: "AI Study Analysis is temporarily unavailable in the offline APK build.",
        suggestions: ["Connect to the web version of GridFocus to use AI-powered insights.", "Your focus logs are still being tracked correctly."]
    };
}
