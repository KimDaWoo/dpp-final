import { NextRequest, NextResponse } from 'next/server';
import { getStockDetails } from '@/lib/kis-api';
import { findStockInCsv } from '@/lib/stock-utils';

export async function GET(
  request: NextRequest,
  context: any
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = rawSymbol?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Stock symbol is required.' }, { status: 400 });
  }
  
  const url = new URL(request.url);
  const exchange = url.searchParams.get('exchange');

  try {
    const csvData = await findStockInCsv(symbol, exchange);
    const kisData = await getStockDetails(symbol);

    const currentPrice = parseFloat(kisData.stck_prpr);
    const listedStockCount = parseInt(kisData.lstn_stcn, 10);
    const marketCap = currentPrice * listedStockCount;
    const dps = parseFloat(kisData.dps) || 0;
    
    const mappedData = {
      currency: 'KRW',
      Name: csvData?.name || kisData.hts_kor_isnm,
      Exchange: csvData?.exchange,
      Sector: kisData.bstp_kor_isnm,
      MarketCapitalization: marketCap,
      PERatio: parseFloat(kisData.per),
      PBRatio: parseFloat(kisData.pbr),
      EPS: parseFloat(kisData.eps),
      DividendYield: currentPrice > 0 && dps > 0 ? dps / currentPrice : 0,
      Symbol: symbol,
      CurrentPrice: currentPrice,
      W52High: parseFloat(kisData.w52_hgpr),
      W52Low: parseFloat(kisData.w52_lwpr),
    };
    
    return NextResponse.json(mappedData);

  } catch (error: any) {
    console.error(`[API Error for ${symbol}]`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock details.' }, { status: 500 });
  }
}
