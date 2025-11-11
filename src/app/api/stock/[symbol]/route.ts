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

    const parseFloatWithComma = (value: string) => {
      if (typeof value !== 'string') return 0;
      return parseFloat(value.replace(/,/g, '')) || 0;
    };
    
    const parseIntWithComma = (value: string) => {
        if (typeof value !== 'string') return 0;
        return parseInt(value.replace(/,/g, ''), 10) || 0;
    }

    const currentPrice = parseFloatWithComma(kisData.stck_prpr);
    const listedStockCount = parseIntWithComma(kisData.lstn_stcn);
    const marketCap = currentPrice * listedStockCount;
    const dps = parseFloatWithComma(kisData.dps);

    const mappedData = {
      // --- 기본 정보 ---
      currency: 'KRW',
      Name: csvData?.name || kisData.hts_kor_isnm,
      Exchange: csvData?.exchange,
      Sector: kisData.bstp_kor_isnm,
      MarketCapitalization: marketCap,
      Symbol: symbol,
      CurrentPrice: currentPrice,
      W52High: parseFloatWithComma(kisData.w52_hgpr),
      W52Low: parseFloatWithComma(kisData.w52_lwpr),
      DividendYield: currentPrice > 0 && dps > 0 ? dps / currentPrice : 0,

      // --- 최종 6개 지표 ---
      PER: parseFloatWithComma(kisData.per),
      PBR: parseFloatWithComma(kisData.pbr),
      EPS: parseFloatWithComma(kisData.eps),
      BPS: parseFloatWithComma(kisData.bps),
      FOREIGNER_RATIO: parseFloatWithComma(kisData.hts_frgn_ehrt),
    };
    
    return NextResponse.json(mappedData);

  } catch (error: any) {
    console.error(`[API Error for ${symbol}]`, error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock details.' }, { status: 500 });
  }
}
