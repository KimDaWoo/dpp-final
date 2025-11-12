import { TradeLog } from "@/contexts/trade-log-context";
import { differenceInDays } from 'date-fns';

// 분석된 개별 거래의 타입 정의
export interface AnalyzedTrade {
  id: string;
  symbol: string;
  name: string;
  buyPrice: number;
  buyQuantity: number;
  buyDate: string;
  sellPrice: number;
  sellQuantity: number;
  sellDate: string;
  investmentPrincipal: number; // 투자 원금
  totalSaleAmount: number; // 총 매도 금액
  realizedProfitLoss: number; // 실현 손익
  returnRate: number; // 수익률 (%)
  holdingPeriod: number; // 보유 기간 (일)
}

// 종합 분석 결과의 타입 정의
export interface TradeAnalysisSummary {
  totalRealizedProfitLoss: number; // 총 실현 손익
  totalInvestmentPrincipal: number; // 총 투자 원금
  overallReturnRate: number; // 전체 수익률 (%)
  winCount: number; // 수익 본 거래 수
  lossCount: number; // 손실 본 거래 수
  winRate: number; // 승률 (%)
  averageHoldingPeriod: number; // 평균 보유 기간
  analyzedTrades: AnalyzedTrade[]; // 분석된 개별 거래 목록
}

/**
 * 단일 거래를 분석하는 함수
 * @param trade - 분석할 매매 기록
 * @returns 분석된 거래 정보 (AnalyzedTrade) 또는 null (미완료 거래)
 */
function analyzeSingleTrade(trade: TradeLog): AnalyzedTrade | null {
  // 매도 정보가 없는 미완료 거래는 분석에서 제외
  if (!trade.sellPrice || !trade.sellQuantity || !trade.sellDate) {
    return null;
  }

  const investmentPrincipal = trade.buyPrice * trade.buyQuantity;
  const totalSaleAmount = trade.sellPrice * trade.sellQuantity;
  const realizedProfitLoss = totalSaleAmount - investmentPrincipal;
  const returnRate = investmentPrincipal !== 0 ? (realizedProfitLoss / investmentPrincipal) * 100 : 0;
  const holdingPeriod = differenceInDays(new Date(trade.sellDate), new Date(trade.buyDate));

  return {
    ...trade,
    sellPrice: trade.sellPrice,
    sellQuantity: trade.sellQuantity,
    sellDate: trade.sellDate,
    investmentPrincipal,
    totalSaleAmount,
    realizedProfitLoss,
    returnRate,
    holdingPeriod,
  };
}

/**
 * 전체 매매 기록을 분석하여 종합 결과를 반환하는 함수
 * @param tradeLogs - 전체 매매 기록 배열
 * @returns 종합 분석 결과 (TradeAnalysisSummary)
 */
export function analyzeTradeLogs(tradeLogs: TradeLog[]): TradeAnalysisSummary {
  const analyzedTrades: AnalyzedTrade[] = tradeLogs
    .map(analyzeSingleTrade)
    .filter((trade): trade is AnalyzedTrade => trade !== null);

  const summary = analyzedTrades.reduce(
    (acc, trade) => {
      acc.totalRealizedProfitLoss += trade.realizedProfitLoss;
      acc.totalInvestmentPrincipal += trade.investmentPrincipal;
      acc.totalHoldingPeriod += trade.holdingPeriod;
      if (trade.realizedProfitLoss > 0) {
        acc.winCount++;
      } else if (trade.realizedProfitLoss < 0) {
        acc.lossCount++;
      }
      return acc;
    },
    {
      totalRealizedProfitLoss: 0,
      totalInvestmentPrincipal: 0,
      winCount: 0,
      lossCount: 0,
      totalHoldingPeriod: 0,
    }
  );

  const totalTrades = analyzedTrades.length;
  const overallReturnRate =
    summary.totalInvestmentPrincipal !== 0
      ? (summary.totalRealizedProfitLoss / summary.totalInvestmentPrincipal) * 100
      : 0;
  const winRate = totalTrades !== 0 ? (summary.winCount / totalTrades) * 100 : 0;
  const averageHoldingPeriod = totalTrades !== 0 ? summary.totalHoldingPeriod / totalTrades : 0;

  return {
    totalRealizedProfitLoss: summary.totalRealizedProfitLoss,
    totalInvestmentPrincipal: summary.totalInvestmentPrincipal,
    overallReturnRate,
    winCount: summary.winCount,
    lossCount: summary.lossCount,
    winRate,
    averageHoldingPeriod,
    analyzedTrades,
  };
}


// --- 신규 추가: 객관적 지표 분류 로직 ---

export type IndicatorCategory = "가치주" | "성장주";

export interface IndicatorClassification {
  indicator: "PER" | "PBR" | "EPS";
  value: number;
  classification: "부합" | "미달";
  category: IndicatorCategory;
  criteria: string;
}

// 일반적인 투자 스타일별 참고 기준 정의
const classificationCriteria = {
  PER: {
    "가치주": (value: number) => value < 10,
    "성장주": (value: number) => value < 30,
    criteria: { "가치주": "< 10", "성장주": "< 30" },
  },
  PBR: {
    "가치주": (value: number) => value < 1,
    "성장주": (value: number) => value < 3,
    criteria: { "가치주": "< 1", "성장주": "< 3" },
  },
  EPS: {
    "가치주": (value: number) => value > 2000,
    "성장주": (value: number) => value > 1000, // 성장주는 EPS 자체보다 성장률이 중요하지만, 최소 기준으로 설정
    criteria: { "가치주": "> 2000", "성장주": "> 1000" },
  },
};

/**
 * 재무 지표를 객관적인 기준에 따라 분류하는 함수
 * @param fundamentals - per, pbr, eps를 포함한 재무 지표 객체
 * @returns 분류된 지표 정보 배열
 */
export function classifyIndicators(fundamentals: { per: number; pbr: number; eps: number; }): IndicatorClassification[] {
  const results: IndicatorClassification[] = [];
  const indicators: ("PER" | "PBR" | "EPS")[] = ["PER", "PBR", "EPS"];

  indicators.forEach(indicator => {
    const value = fundamentals[indicator.toLowerCase() as keyof typeof fundamentals];
    
    // 가치주 기준 분류
    results.push({
      indicator,
      value,
      classification: classificationCriteria[indicator]["가치주"](value) ? "부합" : "미달",
      category: "가치주",
      criteria: `${classificationCriteria[indicator].criteria["가치주"]}`,
    });

    // 성장주 기준 분류
    results.push({
      indicator,
      value,
      classification: classificationCriteria[indicator]["성장주"](value) ? "부합" : "미달",
      category: "성장주",
      criteria: `${classificationCriteria[indicator].criteria["성장주"]}`,
    });
  });

  return results;
}