import { NextResponse } from 'next/server';

// 간단한 인메모리 캐시
let cachedRate: number | null = null;
let lastFetchTime: number = 0;

export async function GET() {
  const now = Date.now();
  // 1시간 캐시
  if (cachedRate && now - lastFetchTime < 60 * 60 * 1000) {
    return NextResponse.json({ rate: cachedRate });
  }

  try {
    // 무료 환율 API (Frankfurter) 사용
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=KRW');
    const data = await response.json();

    if (!data.rates?.KRW) {
      throw new Error('Failed to fetch exchange rate');
    }

    const rate = data.rates.KRW;
    cachedRate = rate;
    lastFetchTime = now;

    return NextResponse.json({ rate });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json({ error: 'An error occurred while fetching the exchange rate' }, { status: 500 });
  }
}
