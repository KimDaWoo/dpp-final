
import { getStockDetails } from "@/lib/kis-api";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    const data = await getStockDetails(symbol);
    
    // KIS API 응답에서 필요한 재무 지표 추출
    // per: 주가수익비율, pbr: 주가순자산비율, eps: 주당순이익
    const fundamentals = {
      symbol: symbol,
      per: parseFloat(data.per) || 0,
      pbr: parseFloat(data.pbr) || 0,
      eps: parseFloat(data.eps) || 0,
    };

    return NextResponse.json(fundamentals);
  } catch (error) {
    console.error(`[API/fundamentals] Error fetching fundamentals for ${symbol}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: `Failed to fetch stock fundamentals for ${symbol}`, details: errorMessage },
      { status: 500 }
    );
  }
}
