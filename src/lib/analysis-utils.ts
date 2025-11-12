
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
