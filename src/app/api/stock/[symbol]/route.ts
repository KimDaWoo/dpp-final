// src/app/api/stock/[symbol]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { symbol: string } }
) {
  const awaitedParams = await params;
  const symbol = awaitedParams.symbol;
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  // Check if the API key is available
  if (!apiKey) {
    console.error("ALPHA_VANTAGE_API_KEY is not set in .env.local");
    return NextResponse.json(
      { error: 'Server configuration error: API key not found. Please contact the administrator.' },
      { status: 500 }
    );
  }

  if (!symbol) {
    return NextResponse.json(
      { error: 'Stock symbol is required' },
      { status: 400 }
    );
  }

  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Log the actual response from the third-party API for debugging
      const errorBody = await response.text();
      console.error(`Alpha Vantage API error: ${response.status} ${errorBody}`);
      throw new Error('Failed to fetch data from Alpha Vantage');
    }
    const data = await response.json();

    // Alpha Vantage API may return a "Note" for high frequency calls
    if (data.Note) {
        return NextResponse.json({ error: 'API call limit reached. Please try again later.' }, { status: 429 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'An error occurred while fetching stock data.' },
      { status: 500 }
    );
  }
}
