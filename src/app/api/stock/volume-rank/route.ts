import { NextResponse } from 'next/server';
import { getVolumeRank } from '@/lib/kis-api';

export const dynamic = 'force-dynamic';

/**
 * 거래량 순위 데이터를 가져오는 API 라우트
 */
export async function GET() {
  try {
    const volumeRankData = await getVolumeRank();
    return NextResponse.json(volumeRankData);
  } catch (error) {
    console.error('API route /api/stock/volume-rank error:', error);
    return NextResponse.json({ error: 'Failed to fetch volume rank data' }, { status: 500 });
  }
}