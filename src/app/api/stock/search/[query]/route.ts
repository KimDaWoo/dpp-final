import { NextResponse } from 'next/server';

const YAHOO_AUTOCOMPLETE_URL = 'https://query1.finance.yahoo.com/v6/finance/autocomplete';

export async function GET(_request: Request, { params }: { params: { query: string } }) {
  const awaitedParams = await params;
  const query = awaitedParams.query;

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    // Yahoo Finance의 'autocomplete' 엔드포인트 사용
    const response = await fetch(`${YAHOO_AUTOCOMPLETE_URL}?query=${query}&region=US&lang=en-US`);
    const data = await response.json();

    if (!data.ResultSet?.Result) {
      console.error("Yahoo Finance API Error (Autocomplete):", data);
      return NextResponse.json({ error: 'Failed to fetch search results from Yahoo Finance' }, { status: 500 });
    }

    // 프론트엔드 형식에 맞게 변환 (주식만 필터링)
    const formattedData = data.ResultSet.Result
      .filter((item: any) => item.typeDisp === 'Equity')
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.name,
      }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error(`Error searching for stock "${query}" from Yahoo Finance:`, error);
    return NextResponse.json({ error: 'An error occurred while searching for stocks' }, { status: 500 });
  }
}
