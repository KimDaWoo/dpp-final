import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// Cache the result to avoid fetching from the API on every request.
// In a real-world scenario, you'd use a more robust caching strategy (e.g., Redis, Vercel Data Cache).
let cachedStockList: { symbol: string; name: string }[] = [];
let lastFetchTime: number = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export async function GET() {
  const now = Date.now();
  if (cachedStockList.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
    return NextResponse.json(cachedStockList);
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const url = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch stock list from Alpha Vantage');
    }
    const csvText = await response.text();

    // Parse CSV text to JSON
    const parsed = Papa.parse(csvText, { header: true });
    const stockList = parsed.data
      .map((row: any) => ({
        symbol: row.symbol,
        name: row.name,
      }))
      .filter((stock: any) => stock.symbol && stock.name); // Filter out empty rows

    cachedStockList = stockList;
    lastFetchTime = now;

    return NextResponse.json(stockList);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process stock list' }, { status: 500 });
  }
}
