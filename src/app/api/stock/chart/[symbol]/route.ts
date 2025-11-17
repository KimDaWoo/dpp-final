import { NextRequest, NextResponse } from 'next/server';
import { getStockPriceHistory } from '@/lib/kis-api';


function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

type RouteContext = {
  params: Promise<{ symbol: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = rawSymbol?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Stock symbol is required.' }, { status: 400 });
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 365);

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    console.log(`[Chart API] Fetching data for symbol: ${symbol} from ${formattedStartDate} to ${formattedEndDate}`);

    const historyResponse = await getStockPriceHistory(symbol, formattedStartDate, formattedEndDate);
    console.log('[Chart API] Full response from KIS API:', JSON.stringify(historyResponse, null, 2));

    const priceHistory = historyResponse.output2; // output2가 일자별 가격 배열입니다.
    const latestInfo = historyResponse.output1; // output1은 가장 최신 정보 객체입니다.
    console.log('[Chart API] Latest day summary (output1):', JSON.stringify(latestInfo, null, 2));
    console.log('[Chart API] Extracted price history array (output2):', JSON.stringify(priceHistory, null, 2));

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


