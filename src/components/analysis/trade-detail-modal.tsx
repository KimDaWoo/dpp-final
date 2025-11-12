"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AnalyzedTrade, classifyIndicators, IndicatorClassification } from "@/lib/analysis-utils";
import { useCurrency } from "@/contexts/currency-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface HistoricalData {
  stck_clpr: number; // 종가
  acml_vol: number;  // 거래량
  eps: number;
  bps: number;
}

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: AnalyzedTrade | null;
  buyDateData: HistoricalData | null;
  sellDateData: HistoricalData | null;
  isLoading?: boolean;
}

// --- Helper Functions ---
const formatCurrency = (amount: number, currency: "KRW" | "USD", exchangeRate?: number | null) => {
  const value = currency === "USD" && exchangeRate ? amount / exchangeRate : amount;
  const options: Intl.NumberFormatOptions = { style: "currency", currency, minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 };
  return new Intl.NumberFormat(currency === "KRW" ? "ko-KR" : "en-US", options).format(value);
};

const calculateIndicator = (price: number, value: number) => (value > 0 ? price / value : 0);

// --- Analysis Summary Generation ---
const generateAnalysisSummary = (trade: AnalyzedTrade, buyData: HistoricalData, sellData: HistoricalData | null) => {
  const isProfit = trade.realizedProfitLoss > 0;
  const summary = `이 거래는 ${isProfit ? "수익" : "손실"}을 기록했습니다.`;
  const comments: string[] = [];

  if (sellData) { // 일반 거래 분석
    const buyPBR = calculateIndicator(buyData.stck_clpr, buyData.bps);
    const sellPBR = calculateIndicator(sellData.stck_clpr, sellData.bps);
    const pbrChange = sellPBR - buyPBR;
    const volChange = buyData.acml_vol > 0 ? ((sellData.acml_vol - buyData.acml_vol) / buyData.acml_vol) * 100 : 0;

    if (pbrChange > 0.1) {
      comments.push(`PBR이 ${buyPBR.toFixed(2)} → ${sellPBR.toFixed(2)}로 상승하며, 시장의 가치 평가가 긍정적으로 변했습니다.`);
    } else if (pbrChange < -0.1) {
      comments.push(`PBR이 ${buyPBR.toFixed(2)} → ${sellPBR.toFixed(2)}로 하락하며, 시장의 가치 평가가 부정적으로 변했습니다.`);
    }

    if (volChange > 100) {
      comments.push(`거래량이 ${Math.round(volChange)}% 급증하며, 시장의 관심이 크게 증가했습니다.`);
    } else if (volChange < -50) {
      comments.push(`거래량이 ${Math.round(volChange)}% 급감하며, 시장의 관심이 크게 줄었습니다.`);
    }
    
    if (comments.length === 0) {
      comments.push("보유 기간 동안 주요 지표의 유의미한 변화는 관찰되지 않았습니다.");
    }
  } else { // 단타 거래 분석
    const classifications = classifyIndicators({
      per: calculateIndicator(buyData.stck_clpr, buyData.eps),
      pbr: calculateIndicator(buyData.stck_clpr, buyData.bps),
      eps: buyData.eps,
    });
    
    const pbrValueStandard = classifications.find(c => c.indicator === "PBR" && c.category === "가치주");
    if (pbrValueStandard) {
      comments.push(`매수 당시 PBR은 ${pbrValueStandard.value.toFixed(2)}로, '가치주' 기준(${pbrValueStandard.criteria})에 ${pbrValueStandard.classification}했습니다.`);
    }

    const perValueStandard = classifications.find(c => c.indicator === "PER" && c.category === "가치주");
    if (perValueStandard) {
      comments.push(`매수 당시 PER은 ${perValueStandard.value.toFixed(2)}로, '가치주' 기준(${perValueStandard.criteria})에 ${perValueStandard.classification}했습니다.`);
    }

    if (comments.length === 0) {
      comments.push("매수 당시 주요 지표가 '가치주' 기준에 부합하지 않았습니다.");
    }
  }

  return { summary, comments };
};

// --- Sub-components ---
const IndicatorEvaluationTable = ({ title, date, data }: { title: string, date: string, data: HistoricalData }) => {
  const calculatedPER = calculateIndicator(data.stck_clpr, data.eps);
  const calculatedPBR = calculateIndicator(data.stck_clpr, data.bps);

  const classifications = classifyIndicators({ per: calculatedPER, pbr: calculatedPBR, eps: data.eps });

  const renderRow = (indicator: "PER" | "PBR" | "EPS") => {
    const value = indicator === "PER" ? calculatedPER : indicator === "PBR" ? calculatedPBR : data.eps;
    const valueDisplay = value > 0 ? value.toFixed(2) : "N/A";
    const valueClass = classifications.find(c => c.indicator === indicator && c.category === "가치주");
    const growthClass = classifications.find(c => c.indicator === indicator && c.category === "성장주");

    return (
      <TableRow key={indicator}>
        <TableCell className="font-medium">{indicator}</TableCell>
        <TableCell className="text-center">{valueDisplay}</TableCell>
        <TableCell className="text-center"><Badge variant={valueClass?.classification === "부합" ? "default" : "outline"} className={valueClass?.classification === "부합" ? "bg-green-500 text-white" : ""}>{valueClass?.criteria}</Badge></TableCell>
        <TableCell className="text-center"><Badge variant={growthClass?.classification === "부합" ? "default" : "outline"} className={growthClass?.classification === "부합" ? "bg-blue-500 text-white" : ""}>{growthClass?.criteria}</Badge></TableCell>
      </TableRow>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>지표</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">지표 값<TooltipProvider><Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>{date} 기준 데이터로 계산되었습니다.</p></TooltipContent></Tooltip></TooltipProvider></div>
              </TableHead>
              <TableHead className="text-center">가치주 기준</TableHead>
              <TableHead className="text-center">성장주 기준</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderRow("PER")}{renderRow("PBR")}{renderRow("EPS")}</TableBody>
        </Table>
      </div>
    </div>
  );
};

// --- Main Component ---
export function TradeDetailModal({ isOpen, onClose, trade, buyDateData, sellDateData, isLoading = false }: TradeDetailModalProps) {
  const { currency, exchangeRate } = useCurrency();

  if (!isOpen || !trade) return null;

  const isDayTrading = trade.buyDate === trade.sellDate;
  const analysisSummary = !isLoading && buyDateData ? generateAnalysisSummary(trade, buyDateData, sellDateData) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{trade.name} ({trade.symbol}) 상세 분석</DialogTitle>
          <DialogDescription>{trade.buyDate} ~ {trade.sellDate} ({trade.holdingPeriod}일 보유)</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="flex justify-around text-center">
            <div><p className="text-sm text-muted-foreground">실현 손익</p><p className={`text-lg font-bold ${trade.realizedProfitLoss >= 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(trade.realizedProfitLoss, currency, exchangeRate)}</p></div>
            <div><p className="text-sm text-muted-foreground">수익률</p><p className={`text-lg font-bold ${trade.returnRate >= 0 ? "text-red-600" : "text-blue-600"}`}>{trade.returnRate.toFixed(2)}%</p></div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div><h3 className="text-lg font-semibold mb-2"><Skeleton className="h-6 w-40" /></h3><div className="rounded-md border p-4 space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div></div>
              {!isDayTrading && <div><h3 className="text-lg font-semibold mb-2"><Skeleton className="h-6 w-40" /></h3><div className="rounded-md border p-4 space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div></div>}
            </div>
          ) : (
            <div className="space-y-6">
              {buyDateData ? <IndicatorEvaluationTable title={isDayTrading ? "매수/매도 당시 지표 평가" : "매수 당시 지표 평가"} date={trade.buyDate} data={buyDateData} /> : <div className="text-sm p-4 bg-muted/50 rounded-lg"><p className="font-semibold">매수 당시의 재무 지표를 불러올 수 없습니다.</p></div>}
              {!isDayTrading && (sellDateData ? <IndicatorEvaluationTable title="매도 당시 지표 평가" date={trade.sellDate} data={sellDateData} /> : <div className="text-sm p-4 bg-muted/50 rounded-lg"><p className="font-semibold">매도 당시의 재무 지표를 불러올 수 없습니다.</p></div>)}
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">분석 요약</h3>
            {isLoading ? (
              <div className="text-sm p-4 bg-muted/50 rounded-lg space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /></div>
            ) : analysisSummary ? (
              <div className="text-sm p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-semibold">{analysisSummary.summary}</p>
                {analysisSummary.comments && analysisSummary.comments.length > 0 && (<ul className="list-disc pl-5 text-gray-600 space-y-1">{analysisSummary.comments.map((comment, i) => <li key={i}>{comment}</li>)}</ul>)}
              </div>
            ) : null}
          </div>
          
          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>※ 위 참고 기준은 일반적인 투자 이론에 근거한 예시이며, 산업 특성이나 시장 상황에 따라 달라질 수 있습니다. 절대적인 투자 판단의 근거가 될 수 없으며, 투자 결정에 대한 책임은 본인에게 있습니다.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}