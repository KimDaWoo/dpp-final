
import { getStockPriceHistory } from "@/lib/kis-api";
import { NextResponse } from "next/server";
import { format } from 'date-fns';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string, date: string }> }
) {
  const { symbol, date } = await params;

  if (!symbol || !date) {
    return NextResponse.json(
      { error: "Symbol and date parameters are required" },
      { status: 400 }
    );
  }

  try {
    const formattedDate = format(new Date(date), 'yyyyMMdd');

    // getStockPriceHistory는 이제 output1과 output2를 모두 포함한 객체를 반환
    const data = await getStockPriceHistory(symbol, formattedDate, formattedDate);

    console.log("--- KIS API Raw Response ---", JSON.stringify(data, null, 2));

    const dailyData = data.output2 || [];
    const targetDateStr = format(new Date(date), 'yyyyMMdd');

    const targetDayInfo = dailyData.find((d: any) => d.stck_bsop_date === targetDateStr);

    if (!targetDayInfo) {
      console.log(`No data found for target date: ${targetDateStr}`);
      return NextResponse.json(
        { error: `No data found for symbol ${symbol} on date ${date}` },
        { status: 404 }
      );
    }

    // BPS 계산 로직 추가
    const output1 = data.output1;
    let bps = parseFloat(output1?.bps) || 0;
    if (bps === 0 && output1?.stck_prpr && output1?.pbr) {
      const price = parseFloat(output1.stck_prpr);
      const pbr = parseFloat(output1.pbr);
      if (pbr > 0) {
        bps = price / pbr;
      }
    }

    // 필요한 데이터를 조합하여 최종 응답 객체 생성
    const responseData = {
      // --- Daily Data from output2 ---
      stck_clpr: parseFloat(targetDayInfo.stck_clpr) || 0, // 종가
      acml_vol: parseFloat(targetDayInfo.acml_vol) || 0, // 거래량
      
      // --- Financial Metrics for calculation from output1 ---
      eps: parseFloat(output1?.eps) || 0,
      bps: bps, // BPS 추가
      
      // --- Additional Indicators (Current Value) ---
      hts_avls: parseFloat(output1?.hts_avls) || 0, // HTS 시가총액
      frgn_hldn_qty: parseFloat(output1?.frgn_hldn_qty) || 0, // 외국인 보유 수량
      whol_loan_rmnd_rate: parseFloat(output1?.['itewhol_loan_rmnd_ratem name'] || output1?.whol_loan_rmnd_rate) || 0, // 전체 융자 잔고 비율
      
      // --- Contextual Data from output1 ---
      stck_shrn_iscd: output1?.stck_shrn_iscd, // 단축 종목 코드
      stck_issg_shr_cnt: parseFloat(output1?.lstn_stcn) || 0, // 상장 주식 수
    };

    // 외국인 소진율 계산
    const foreigner_ratio = responseData.stck_issg_shr_cnt > 0
      ? (responseData.frgn_hldn_qty / responseData.stck_issg_shr_cnt) * 100
      : 0;

    const finalResponse = { ...responseData, foreigner_ratio };
    console.log("--- Final API Response to Client ---", JSON.stringify(finalResponse, null, 2));

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error(`[API/historical] Error fetching data for ${symbol} on ${date}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: `Failed to fetch historical stock data`, details: errorMessage },
      { status: 500 }
    );
  }
}
