
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AnalyzedTrade } from "@/lib/analysis-utils";
import { useInvestmentPersonality } from "@/contexts/investment-personality-context";
import { useCurrency } from "@/contexts/currency-context";
import { Skeleton } from "@/components/ui/skeleton";

interface Fundamentals {
  per: number;
  pbr: number;
  eps: number;
}

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: AnalyzedTrade | null;
  fundamentals: Fundamentals | null;
  isLoading?: boolean;
}

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

// 지표 비교 및 분석 코멘트 생성 로직
const generateAnalysis = (trade: AnalyzedTrade, fundamentals: Fundamentals, preferences: { per: number; pbr: number; eps: number; }) => {
  const analysisResults = [
    { name: "PER", value: fundamentals.per, preference: preferences.per, condition: (v: number, p: number) => v < p },
    { name: "PBR", value: fundamentals.pbr, preference: preferences.pbr, condition: (v: number, p: number) => v < p },
    { name: "EPS", value: fundamentals.eps, preference: preferences.eps, condition: (v: number, p: number) => v > p },
  ];

  const satisfiedIndicators = analysisResults.filter(r => r.value > 0 && r.preference > 0 && r.condition(r.value, r.preference));
  const unsatisfiedIndicators = analysisResults.filter(r => r.value > 0 && r.preference > 0 && !r.condition(r.value, r.preference));

  const isProfit = trade.realizedProfitLoss > 0;
  let summary = `이 거래는 ${isProfit ? "수익" : "손실"}을 기록했습니다. `;
  if (satisfiedIndicators.length + unsatisfiedIndicators.length > 0) {
    summary += `설정한 선호 지표 ${satisfiedIndicators.length + unsatisfiedIndicators.length}개 중 ${satisfiedIndicators.length}개를 만족했습니다.`;
  }

  const positivePoints = satisfiedIndicators.map(i => `특히 ${i.name}은(는) ${i.value.toFixed(2)}로, 선호 기준(${i.name} ${i.condition(1, 2) ? '<' : '>'} ${i.preference})을 충족하여 긍정적이었습니다.`);
  const negativePoints = unsatisfiedIndicators.map(i => `반면, ${i.name}은(는) ${i.value.toFixed(2)}로, 선호 기준(${i.name} ${i.condition(1, 2) ? '<' : '>'} ${i.preference})을 벗어났습니다.`);

  return { analysisResults, summary, positivePoints, negativePoints };
};


export function TradeDetailModal({ isOpen, onClose, trade, fundamentals, isLoading = false }: TradeDetailModalProps) {
  const { getPreferenceValues } = useInvestmentPersonality();
  const { currency, exchangeRate } = useCurrency();

  if (!isOpen || !trade) return null;

  const preferences = getPreferenceValues();
  const analysis = !isLoading && fundamentals && preferences
    ? generateAnalysis(trade, fundamentals, preferences)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{trade.name} ({trade.symbol}) 상세 분석</DialogTitle>
          <DialogDescription>
            {trade.buyDate} ~ {trade.sellDate} ({trade.holdingPeriod}일 보유)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* 기본 거래 정보 */}
          <div className="flex justify-around text-center">
            <div>
              <p className="text-sm text-muted-foreground">실현 손익</p>
              <p className={`text-lg font-bold ${trade.realizedProfitLoss >= 0 ? "text-red-600" : "text-blue-600"}`}>
                {formatCurrency(trade.realizedProfitLoss, currency, exchangeRate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">수익률</p>
              <p className={`text-lg font-bold ${trade.returnRate >= 0 ? "text-red-600" : "text-blue-600"}`}>
                {trade.returnRate.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* 선호 지표 비교 분석 */}
          <div>
            <h3 className="text-lg font-semibold mb-2">선호 지표 비교</h3>
            {isLoading ? (
              <div className="rounded-md border p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : fundamentals ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>지표</TableHead>
                      <TableHead className="text-center">매수 당시 값 (현재)</TableHead>
                      <TableHead className="text-center">나의 선호 기준</TableHead>
                      <TableHead className="text-center">충족 여부</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis?.analysisResults.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.value > 0 ? item.value.toFixed(2) : "N/A"}</TableCell>
                        <TableCell className="text-center">{item.preference > 0 ? `${item.condition(1, 2) ? '<' : '>'} ${item.preference}` : "설정 안함"}</TableCell>
                        <TableCell className="text-center">
                          {item.value > 0 && item.preference > 0 ? (
                            item.condition(item.value, item.preference) ? (
                              <Badge variant="default" className="bg-green-500">충족</Badge>
                            ) : (
                              <Badge variant="destructive">미달</Badge>
                            )
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-sm p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold">종목의 재무 지표를 불러올 수 없습니다.</p>
              </div>
            )}
          </div>

          {/* 자동 생성 분석 코멘트 */}
          <div>
            <h3 className="text-lg font-semibold mb-2">분석 요약</h3>
            {isLoading ? (
              <div className="text-sm p-4 bg-muted/50 rounded-lg space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : analysis ? (
              <div className="text-sm p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-semibold">{analysis.summary}</p>
                {analysis.positivePoints.length > 0 && (
                  <ul className="list-disc pl-5 text-green-700">
                    {analysis.positivePoints.map((point, i) => <li key={i}>{point}</li>)}
                  </ul>
                )}
                {analysis.negativePoints.length > 0 && (
                  <ul className="list-disc pl-5 text-red-700">
                    {analysis.negativePoints.map((point, i) => <li key={i}>{point}</li>)}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
