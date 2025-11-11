import { NextResponse } from 'next/server';
import { getInterestRates } from '@/lib/kis-api';

export async function GET() {
  try {
    const data = await getInterestRates();
    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch interest rates.' }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Error /api/interest-rate]', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}
