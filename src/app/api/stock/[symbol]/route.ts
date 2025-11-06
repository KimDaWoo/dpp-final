import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const FUNDAMENTALS_PATH = path.resolve(process.cwd(), 'src/lib/data/stock-fundamentals.json');

type FundamentalsCache = {
  [key: string]: any; // Alpha Vantage 응답은 매우 다양하므로 any 타입 사용
}

async function readCache(): Promise<FundamentalsCache> {
  try {
    const fileContent = await fs.readFile(FUNDAMENTALS_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return {};
  }
}

async function writeCache(data: FundamentalsCache): Promise<void> {
  try {
    await fs.writeFile(FUNDAMENTALS_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("캐시 파일 쓰기 실패:", error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const symbol = pathSegments[pathSegments.length - 1].toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Stock symbol is required.' }, { status: 400 });
  }

  try {
    const cache = await readCache();
    if (cache[symbol]) {
      console.log(`캐시 히트: ${symbol}. 로컬 파일에서 데이터를 사용합니다.`);
      return NextResponse.json(cache[symbol]);
    }

    console.log(`캐시 미스: ${symbol}. Alpha Vantage에서 데이터를 가져옵니다.`);
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('Alpha Vantage API 키가 설정되지 않았습니다.');
    }

    const alphaVantageUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(alphaVantageUrl);
    const data = await response.json();

    if (data.Note) {
      return NextResponse.json({ 
        error: 'API 호출 한도(분당 5회)를 초과했습니다.',
        isApiLimitError: true,
      }, { status: 429 });
    }

    if (!data.Symbol) {
      return NextResponse.json({ error: '유효하지 않은 종목입니다.' }, { status: 404 });
    }

    // 캐시 업데이트
    cache[symbol] = data;
    await writeCache(cache);
    console.log(`캐시 저장: ${symbol} 데이터가 파일에 추가되었습니다.`);

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
