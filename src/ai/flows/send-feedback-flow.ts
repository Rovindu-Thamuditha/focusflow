'use server';
/**
 * @fileOverview A flow for sending feedback emails.
 *
 * - sendFeedback - A function that handles sending the feedback.
 * - FeedbackInput - The input type for the sendFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FeedbackInputSchema = z.object({
  feedback: z.string().min(10).describe('The user feedback content.'),
  userEmail: z.string().optional().describe('The email of the user sending feedback.'),
});
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

const TO_EMAIL = 'rovinduthamuditha0@gmail.com';

const sendFeedbackFlow = ai.defineFlow(
  {
    name: 'sendFeedbackFlow',
    inputSchema: FeedbackInputSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    // In a real application, you would use a service like SendGrid, Resend, or Nodemailer
    // to send the email. For this example, we'll simulate the email sending process
    // and log the content to the console as if it were sent.

    const subject = `New GridFocus Feedback`;
    const from = input.userEmail || 'anonymous';
    const body = `
      A user has submitted feedback for GridFocus.
      
      From: ${from}
      
      Message:
      ${input.feedback}
    `;

    console.log('--- SIMULATING EMAIL SEND ---');
    console.log(`To: ${TO_EMAIL}`);
    console.log(`From: noreply@gridfocus.app (via ${from})`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('-----------------------------');

    // Here you would add your actual email sending logic, for example:
    //
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'GridFocus Feedback <noreply@yourdomain.com>',
    //   to: TO_EMAIL,
    //   subject: subject,
    //   text: body,
    // });
    
    // For the purpose of this prototype, we'll always return success.
    return { success: true };
  }
);


export async function sendFeedback(input: FeedbackInput): Promise<{ success: boolean }> {
    return await sendFeedbackFlow(input);
}
