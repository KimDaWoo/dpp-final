
"use client";

import { useTradeLog } from "@/contexts/trade-log-context";
import { analyzeTradeLogs, TradeAnalysisSummary, AnalyzedTrade } from "@/lib/analysis-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrency } from "@/contexts/currency-context";
import { useMemo, useState, useEffect } from "react";
import { TradeDetailModal } from "@/components/analysis/trade-detail-modal";

// 숫자 포맷팅 헬퍼 함수
const formatNumber = (num: number, options: Intl.NumberFormatOptions = {}) => {
  return new Intl.NumberFormat("ko-KR", options).format(num);
};

// 통화 포맷팅 헬퍼 함수
const formatCurrency = (amount: number, currency: "KRW" | "USD", exchangeRate?: number | null) => {
  const value = currency === "USD" && exchangeRate ? amount / exchangeRate : amount;
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  };
  return new Intl.NumberFormat(currency === "KRW" ? "ko-KR" : "en-US", options).format(value);
};

interface Fundamentals {
  symbol: string;
  per: number;
  pbr: number;
  eps: number;
}

export function AnalysisClient() {
  const { tradeLogs } = useTradeLog();
  const { currency, exchangeRate } = useCurrency();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<AnalyzedTrade | null>(null);
  const [fundamentals, setFundamentals] = useState<Record<string, Fundamentals>>({});
  const [isLoadingFundamentals, setIsLoadingFundamentals] = useState(false);

  const analysisSummary: TradeAnalysisSummary = useMemo(() => analyzeTradeLogs(tradeLogs), [tradeLogs]);

  useEffect(() => {
    const fetchFundamentals = async () => {
      setIsLoadingFundamentals(true);
      const uniqueSymbols = [...new Set(analysisSummary.analyzedTrades.map(t => t.symbol))];
      const promises = uniqueSymbols.map(symbol =>
        fetch(`/api/stock/fundamentals/${symbol}`).then(res => res.json())
      );
      
      try {
        const results = await Promise.all(promises);
        const fundamentalsMap = results.reduce((acc, data) => {
          if (data && data.symbol && !data.error) {
            acc[data.symbol] = data;
          }
          return acc;
        }, {} as Record<string, Fundamentals>);
        setFundamentals(fundamentalsMap);
      } catch (error) {
        console.error("Failed to fetch fundamentals:", error);
      } finally {
        setIsLoadingFundamentals(false);
      }
    };

    if (analysisSummary.analyzedTrades.length > 0) {
      fetchFundamentals();
    }
  }, [analysisSummary.analyzedTrades]);

  const handleRowClick = (trade: AnalyzedTrade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  if (tradeLogs.length === 0 || analysisSummary.analyzedTrades.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-muted-foreground">분석할 매매 기록이 없습니다.</p>
        <p className="text-sm text-muted-foreground">매매 복기 탭에서 완료된 거래를 추가해주세요.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* 1. 종합 분석 대시보드 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">종합 분석</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>총 실현 손익</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${analysisSummary.totalRealizedProfitLoss >= 0 ? "text-red-600" : "text-blue-600"}`}>
                  {formatCurrency(analysisSummary.totalRealizedProfitLoss, currency, exchangeRate)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>전체 수익률</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${analysisSummary.overallReturnRate >= 0 ? "text-red-600" : "text-blue-600"}`}>
                  {formatNumber(analysisSummary.overallReturnRate, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>승률</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatNumber(analysisSummary.winRate, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                </p>
                <p className="text-sm text-muted-foreground">
                  ({analysisSummary.winCount}승 {analysisSummary.lossCount}패)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>평균 보유 기간</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatNumber(analysisSummary.averageHoldingPeriod, { maximumFractionDigits: 1 })}일
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 2. 상세 거래 내역 테이블 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">상세 거래 내역</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>종목명</TableHead>
                  <TableHead className="text-right">실현 손익</TableHead>
                  <TableHead className="text-right">수익률</TableHead>
                  <TableHead className="text-right">보유 기간</TableHead>
                  <TableHead className="text-right">매수일</TableHead>
                  <TableHead className="text-right">매도일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisSummary.analyzedTrades.map((trade: AnalyzedTrade) => (
                  <TableRow key={trade.id} onClick={() => handleRowClick(trade)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{trade.name} ({trade.symbol})</TableCell>
                    <TableCell className={`text-right font-semibold ${trade.realizedProfitLoss >= 0 ? "text-red-600" : "text-blue-600"}`}>
                      {formatCurrency(trade.realizedProfitLoss, currency, exchangeRate)}
                    </TableCell>
                    <TableCell className={`text-right ${trade.returnRate >= 0 ? "text-red-600" : "text-blue-600"}`}>
                      {formatNumber(trade.returnRate, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </TableCell>
                    <TableCell className="text-right">{trade.holdingPeriod}일</TableCell>
                    <TableCell className="text-right">{trade.buyDate}</TableCell>
                    <TableCell className="text-right">{trade.sellDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
      <TradeDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trade={selectedTrade}
        fundamentals={selectedTrade ? fundamentals[selectedTrade.symbol] : null}
        isLoading={isLoadingFundamentals && selectedTrade && !fundamentals[selectedTrade.symbol]}
      />
    </>
  );
}
