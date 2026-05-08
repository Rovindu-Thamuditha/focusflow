/**
 * @fileOverview A placeholder flow for sending feedback emails.
 * Temporarily disabled for static export compatibility.
 */

import { z } from 'zod';

const FeedbackInputSchema = z.object({
  feedback: z.string().min(10).describe('The user feedback content.'),
  userEmail: z.string().optional().describe('The email of the user sending feedback.'),
});
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

/**
 * Placeholder function for sending feedback.
 * Returns failure since server-side email sending is not available in a static export.
 */
export async function sendFeedback(input: FeedbackInput): Promise<{ success: boolean, message?: string }> {
    return { 
        success: false, 
        message: "Feedback submission requires an active server connection, which is currently disabled in the APK." 
    };
}
