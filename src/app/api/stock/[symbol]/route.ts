import { NextResponse } from 'next/server';

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const BASE_URL = 'https://api.polygon.io';

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  const awaitedParams = await params;
  const symbol = awaitedParams.symbol;

  if (!POLYGON_API_KEY) {
    return NextResponse.json({ error: 'Polygon API key is not configured' }, { status: 500 });
  }

  try {
    // 안정적인 Polygon.io의 'Ticker Details' 엔드포인트를 사용합니다.
    const response = await fetch(`${BASE_URL}/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results) {
      return NextResponse.json({ error: 'Invalid symbol or no data found from Polygon' }, { status: 404 });
    }

    const details = data.results;

    // Polygon.io가 제공하는 데이터만으로 최종 데이터 구성
    const formattedData = {
      Symbol: details.ticker,
      Name: details.name,
      Description: details.description,
      Sector: details.sic_description,
      Industry: null, // Polygon 무료 플랜에서는 제공하지 않음
      MarketCapitalization: details.market_cap,
      PERatio: null,
      EPS: null,
      '52WeekHigh': null,
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error(`Error fetching stock details for ${symbol} from Polygon:`, error);
    return NextResponse.json({ error: 'An error occurred while fetching stock details' }, { status: 500 });
  }
}
