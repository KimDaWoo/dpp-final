import { NextRequest, NextResponse } from 'next/server';
import { getStockPriceHistory } from '@/lib/kis-api';

export async function GET(
  _request: NextRequest,
  context: any
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = rawSymbol?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Stock symbol is required.' }, { status: 400 });
  }

  try {
    const priceHistory = await getStockPriceHistory(symbol, 365);

    const formattedData = Array.isArray(priceHistory) 
      ? priceHistory
          .map(item => {
            const price = parseFloat(item.stck_clpr);
            const dateStr = item.stck_bsop_date;
            
            if (!dateStr || dateStr.length !== 8) return null;

            const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;

            if (typeof price === 'number' && isFinite(price)) {
              return { date: formattedDate, price: price };
            }
            return null;
          })
          .filter(Boolean)
          .reverse()
      : [];

    const responsePayload = {
      currency: 'KRW',
      prices: formattedData,
    };

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error(`[API Error for Chart ${symbol}]`, error);
    // 오류 발생 시 클라이언트와의 계약을 지키기 위해 빈 배열을 포함한 구조를 반환
    return NextResponse.json({ currency: 'KRW', prices: [] });
  }
}


