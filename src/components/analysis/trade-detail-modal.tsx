"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AnalyzedTrade, classifyIndicators } from "@/lib/analysis-utils";
import { useCurrency } from "@/contexts/currency-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { getGeminiAnalysis } from "@/lib/gemini-api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HistoricalData {
  stck_clpr: number;
  acml_vol: number;
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

const formatCurrency = (amount: number, currency: "KRW" | "USD", exchangeRate?: number | null) => {
  const value = currency === "USD" && exchangeRate ? amount / exchangeRate : amount;
  const options: Intl.NumberFormatOptions = { style: "currency", currency, minimumFractionDigits: currency === "USD" ? 2 : 0, maximumFractionDigits: currency === "USD" ? 2 : 0 };
  return new Intl.NumberFormat(currency === "KRW" ? "ko-KR" : "en-US", options).format(value);
};

const calculateIndicator = (price: number, value: number) => (value > 0 ? price / value : 0);

const generateAnalysisSummary = (trade: AnalyzedTrade, buyData: HistoricalData, sellData: HistoricalData | null) => {
  const isProfit = trade.realizedProfitLoss > 0;
  const summary = `이 거래는 ${isProfit ? "수익" : "손실"}을 기록했습니다.`;
  const comments: string[] = [];

  if (sellData) {
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
  } else {
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

export function TradeDetailModal({ isOpen, onClose, trade, buyDateData, sellDateData, isLoading = false }: TradeDetailModalProps) {
  const { currency, exchangeRate } = useCurrency();
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  useEffect(() => {
    if (isOpen && trade && buyDateData && !isLoading) {
      const generatePrompt = () => {
        const buyPER = calculateIndicator(buyDateData.stck_clpr, buyDateData.eps);
        const buyPBR = calculateIndicator(buyDateData.stck_clpr, buyDateData.bps);
        
        let tradeData = `[TRADE DATA]
- Stock: ${trade.name} (${trade.symbol})
- Buy Date: ${trade.buyDate}
- PER at Buy: ${buyPER.toFixed(2)}
- PBR at Buy: ${buyPBR.toFixed(2)}
- Return Rate: ${trade.returnRate.toFixed(2)}%
`;

        if (sellDateData) {
          const sellPER = calculateIndicator(sellDateData.stck_clpr, sellDateData.eps);
          const sellPBR = calculateIndicator(sellDateData.stck_clpr, sellDateData.bps);
          tradeData += `- Sell Date: ${trade.sellDate}\n- PER at Sell: ${sellPER.toFixed(2)}\n- PBR at Sell: ${sellPBR.toFixed(2)}\n`;
        }

        const instructions = `[INSTRUCTIONS]
You are a financial analyst. Your task is to analyze the provided trade data.
Analyze the user's investment decision (buy/sell timing) for this trade based on the indicators. Explain the strengths and weaknesses in detail.
Your analysis must be structured into exactly four sections: '## ✓ 긍정적 평가', '## ✘ 부정적 평가', '## » 결론', and '## ※ 배운 점'. Each section should be separated by a horizontal rule (---).
Write the analysis directly as a continuous report or newspaper article format, without any introductory phrases. The entire response must be in Korean.`;

        return `${tradeData}\n${instructions}`;
      };

      const fetchAnalysis = async () => {
        setIsGeminiLoading(true);
        setGeminiAnalysis(null);
        try {
          const prompt = generatePrompt();
          const response = await fetch('/api/gemini-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
          });

          if (!response.ok) {
            throw new Error('API request failed');
          }

          const data = await response.json();
          setGeminiAnalysis(data.analysis);
        } catch (error) {
          console.error("Failed to get Gemini analysis:", error);
          setGeminiAnalysis("분석을 가져오는 데 실패했습니다.");
        } finally {
          setIsGeminiLoading(false);
        }
      };

      fetchAnalysis();
    }
  }, [isOpen, trade, buyDateData, sellDateData, isLoading]);

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

          <div>
            <h3 className="text-lg font-semibold mb-2">분석 요약</h3>
            {isGeminiLoading ? (
              <div className="text-sm p-4 bg-muted/50 rounded-lg space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
            ) : geminiAnalysis ? (
              <div className="text-sm p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({node, ...props}) => <h2 className="text-base font-semibold mt-3 first:mt-0" {...props} />,
                  }}
                >
                  {geminiAnalysis}
                </ReactMarkdown>
              </div>
            ) : null}
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

          
          {/* <div>
            <h3 className="text-lg font-semibold mb-2">기존 분석 요약</h3>
            {isLoading ? (
              <div className="text-sm p-4 bg-muted/50 rounded-lg space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /></div>
            ) : analysisSummary ? (
              <div className="text-sm p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-semibold">{analysisSummary.summary}</p>
                {analysisSummary.comments && analysisSummary.comments.length > 0 && (<ul className="list-disc pl-5 text-gray-600 space-y-1">{analysisSummary.comments.map((comment, i) => <li key={i}>{comment}</li>)}</ul>)}
              </div>
            ) : null}
          </div> */}
          
          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>※ 위 참고 기준은 일반적인 투자 이론에 근거한 예시이며, 산업 특성이나 시장 상황에 따라 달라질 수 있습니다. 절대적인 투자 판단의 근거가 될 수 없으며, 투자 결정에 대한 책임은 본인에게 있습니다.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}