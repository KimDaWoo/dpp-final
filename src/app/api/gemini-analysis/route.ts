import { NextResponse } from 'next/server';
import { getGeminiAnalysis } from '@/lib/gemini-api';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const analysis = await getGeminiAnalysis(prompt);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error in Gemini analysis API route:', error);
    return NextResponse.json({ error: 'Failed to get analysis' }, { status: 500 });
  }
}
