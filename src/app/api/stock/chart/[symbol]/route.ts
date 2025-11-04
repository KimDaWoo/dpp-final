import { NextResponse } from 'next/server';

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function GET(_request: Request, { params }: { params: { symbol: string } }) {
  const awaitedParams = await params;
  const symbol = awaitedParams.symbol;

  try {
    // Yahoo Finance의 차트 엔드포인트를 사용하여 1년간의 일별 데이터 요청
    const response = await fetch(
      `${YAHOO_CHART_URL}/${symbol}?range=1y&interval=1d`
    );
    const data = await response.json();

    const chartData = data.chart?.result?.[0];
    if (!chartData || !chartData.timestamp) {
      console.error(`Yahoo Finance Chart API Error for ${symbol}:`, data);
      return NextResponse.json({ error: 'Failed to fetch chart data from Yahoo Finance' }, { status: 500 });
    }

    const timestamps = chartData.timestamp;
    const prices = chartData.indicators.quote[0].close;

    // Recharts에서 사용할 수 있는 형식으로 데이터 변환 및 정제
    const formattedData = [];
    for (let i = 0; i < timestamps.length; i++) {
      const price = prices[i];
      // 가격이 유효한 숫자인 경우에만 데이터에 추가
      if (typeof price === 'number' && isFinite(price)) {
        formattedData.push({
          date: new Date(timestamps[i] * 1000).toLocaleDateString(),
          price: price,
        });
      }
    }

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error(`Error fetching chart data for ${symbol} from Yahoo Finance:`, error);
    return NextResponse.json({ error: 'An error occurred while fetching chart data' }, { status: 500 });
  }
}