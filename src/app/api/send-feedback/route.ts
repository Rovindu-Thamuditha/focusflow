
import { sendFeedback, type FeedbackInput } from '@/ai/flows/send-feedback-flow';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json() as FeedbackInput;
        const result = await sendFeedback(body);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in send-feedback API route:', error);
        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return new NextResponse(
            JSON.stringify({ success: false, error: 'Failed to send feedback', details: errorMessage }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
