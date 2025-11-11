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

    console.log(`[KIS API Raw Response for ${symbol}]:`, JSON.stringify(kisData, null, 2));

    const currentPrice = parseFloat(kisData.stck_prpr) || 0;
    const listedStockCount = parseInt(kisData.lstn_stcn, 10) || 0;
    const marketCap = currentPrice * listedStockCount;
    const dps = parseFloat(kisData.dps) || 0;

    const mappedData = {
      // --- 기본 정보 ---
      currency: 'KRW',
      Name: csvData?.name || kisData.hts_kor_isnm,
      Exchange: csvData?.exchange,
      Sector: kisData.bstp_kor_isnm,
      MarketCapitalization: marketCap,
      Symbol: symbol,
      CurrentPrice: currentPrice,
      W52High: parseFloat(kisData.w52_hgpr) || 0,
      W52Low: parseFloat(kisData.w52_lwpr) || 0,
      DividendYield: currentPrice > 0 && dps > 0 ? dps / currentPrice : 0,

      // --- 최종 6개 지표 ---
      PER: parseFloat(kisData.per) || 0,
      PBR: parseFloat(kisData.pbr) || 0,
      EPS: parseFloat(kisData.eps) || 0,
      BPS: parseFloat(kisData.bps) || 0,
      FOREIGNER_RATIO: parseFloat(kisData.hts_frgn_ehrt) || 0,
    };
    
    return NextResponse.json(mappedData);

  } catch (error: any) {
    console.error(`[API Error for ${symbol}]`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock details.' }, { status: 500 });
  }
}
