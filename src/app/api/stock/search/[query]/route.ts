import { NextRequest, NextResponse } from 'next/server';
import { loadStocks, StockInfo } from '@/lib/stock-utils';

export async function GET(
  request: NextRequest,
  context: any
) {
  const { query: queryParam } = await context.params;

  if (!queryParam) {
    return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get('exchange');
    
    const query = decodeURIComponent(queryParam).toLowerCase();
    
    const allStocks = await loadStocks();

    // 1. Filter by exchange if specified
    let stocksToSearch: StockInfo[];
    if (exchange && exchange !== '전체') {
      stocksToSearch = allStocks.filter(stock => stock.exchange === exchange);
    } else {
      stocksToSearch = allStocks;
    }

    // 2. Filter by search query
    const filteredStocks = stocksToSearch
      .filter(stock => 
        stock && stock.symbol && stock.name && 
        (stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query))
      )
      .slice(0, 20);

    return NextResponse.json(filteredStocks);
  } catch (error: any) {
    console.error('Error in stock search API:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data.' }, { status: 500 });
  }
}