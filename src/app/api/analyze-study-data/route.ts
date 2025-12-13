
import { analyzeStudyData, type StudyAnalysisInput } from '@/ai/flows/analyze-study-data-flow';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json() as StudyAnalysisInput;
    const analysis = await analyzeStudyData(body);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in study analysis API route:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return new NextResponse(
        JSON.stringify({ error: 'Failed to analyze study data', details: errorMessage }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
