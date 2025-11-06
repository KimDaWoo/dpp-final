"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { Badge } from '@/components/ui/badge';

type AnalysisCriterion = {
  description: string;
  isPassed: boolean;
  currentValue: string;
  type: 'money' | 'text'; // 기준 타입을 추가
};

type AnalysisResult = {
  criteria: AnalysisCriterion[];
  passCount: number;
  requiredCount: number;
};

const conservativeCriteria = {
  marketCap: 10_000_000_000, // 100억 달러 이상
  per: 20, // PER 20 이하
  dividendYield: 0.02, // 배당수익률 2% 이상
  beta: 1.0, // 베타 1.0 미만 (시장보다 낮은 변동성)
  debtToEquityRatio: 0.5, // 부채비율 50% 미만
  requiredCount: 3,
};

const aggressiveCriteria = {
  marketCap: 1_000_000_000, // 10억 달러 이상
  per: 40, // PER 40 이하 (성장주는 다소 높을 수 있음)
  revenueGrowth: 0.1, // 연간 매출 성장률 10% 이상
  beta: 1.2, // 베타 1.2 이상 (시장보다 높은 변동성)
  requiredCount: 2,
};

export function StockAnalysis({ symbol }: { symbol: string }) {
  const { currency, formatCurrency } = useCurrency();
  const [stockData, setStockData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [investorType, setInvestorType] = useState<'conservative' | 'aggressive' | null>(null);

  useEffect(() => {
    const type = localStorage.getItem('investmentType') as 'conservative' | 'aggressive' | null;
    setInvestorType(type);

    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/stock/${symbol}`);
        if (!response.ok) {
          const errorData = await response.json();
          // API 응답에서 받은 구체적인 에러 메시지를 사용
          throw new Error(errorData.error || '기업 정보를 가져오는데 실패했습니다.');
        }
        const data = await response.json();
        setStockData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockData();
  }, [symbol]);

  useEffect(() => {
    if (!stockData || !investorType) return;

    const criteria = investorType === 'conservative' ? conservativeCriteria : aggressiveCriteria;
    const results: AnalysisCriterion[] = [];
    let passCount = 0;

    // 1. 시가총액 기준
    const marketCap = parseInt(stockData.MarketCapitalization, 10);
    const marketCapPassed = marketCap > criteria.marketCap;
    if (marketCapPassed) passCount++;
    results.push({
      description: `시가총액 > ${formatCurrency(criteria.marketCap)}`,
      isPassed: marketCapPassed,
      currentValue: `현재 ${formatCurrency(marketCap)}`,
      type: 'money',
    });

    // 2. PER 기준
    const per = parseFloat(stockData.PERatio) || 0;
    const perPassed = per > 0 && per < criteria.per;
    if (perPassed) passCount++;
    results.push({
      description: `PER < ${criteria.per}`,
      isPassed: perPassed,
      currentValue: `현재 ${per.toFixed(2)}`,
      type: 'text',
    });

    // 3. 베타 기준
    const beta = parseFloat(stockData.Beta) || 0;
    let betaPassed;
    if (investorType === 'conservative') {
      betaPassed = beta > 0 && beta < criteria.beta;
      if (betaPassed) passCount++;
      results.push({
        description: `베타 < ${criteria.beta} (시장보다 낮은 변동성)`,
        isPassed: betaPassed,
        currentValue: `현재 ${beta.toFixed(2)}`,
        type: 'text',
      });
    } else {
      betaPassed = beta > criteria.beta;
      if (betaPassed) passCount++;
      results.push({
        description: `베타 > ${criteria.beta} (시장보다 높은 변동성)`,
        isPassed: betaPassed,
        currentValue: `현재 ${beta.toFixed(2)}`,
        type: 'text',
      });
    }

    // 4. 보수적 투자자 추가 기준
    if (investorType === 'conservative') {
      // 4-1. 배당수익률
      const dividendYield = parseFloat(stockData.DividendYield) || 0;
      const dividendYieldPassed = dividendYield > criteria.dividendYield;
      if (dividendYieldPassed) passCount++;
      results.push({
        description: `배당수익률 > ${(criteria.dividendYield * 100).toFixed(0)}%`,
        isPassed: dividendYieldPassed,
        currentValue: `현재 ${(dividendYield * 100).toFixed(2)}%`,
        type: 'text',
      });

      // 4-2. 부채비율
      const debtToEquityRatio = parseFloat(stockData.DebtToEquityRatio) || 0;
      const debtToEquityPassed = debtToEquityRatio > 0 && debtToEquityRatio < criteria.debtToEquityRatio;
      if (debtToEquityPassed) passCount++;
      results.push({
        description: `부채비율 < ${(criteria.debtToEquityRatio * 100).toFixed(0)}% (재무 안정성)`,
        isPassed: debtToEquityPassed,
        currentValue: `현재 ${(debtToEquityRatio * 100).toFixed(2)}%`,
        type: 'text',
      });
    }

    // 5. 공격적 투자자 추가 기준
    if (investorType === 'aggressive') {
      // 5-1. 매출 성장률
      const revenueGrowth = parseFloat(stockData.QuarterlyRevenueGrowthYOY) || 0;
      const revenueGrowthPassed = revenueGrowth > aggressiveCriteria.revenueGrowth;
      if (revenueGrowthPassed) passCount++;
      results.push({
        description: `연간 매출 성장률 > ${(aggressiveCriteria.revenueGrowth * 100).toFixed(0)}%`,
        isPassed: revenueGrowthPassed,
        currentValue: `현재 ${(revenueGrowth * 100).toFixed(2)}%`,
        type: 'text',
      });
    }

    setAnalysisResult({
      criteria: results,
      passCount,
      requiredCount: criteria.requiredCount,
    });
  }, [stockData, investorType, formatCurrency]);

  if (isLoading || !investorType) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="space-y-4">
       <p className="text-lg text-center">
        나의 투자 성향 <span className="font-bold text-primary">({investorType === 'aggressive' ? '공격적' : '보수적'})</span> 기준 분석
      </p>

      {analysisResult && (
        <div className="space-y-3 pt-4">
          {analysisResult.criteria.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {item.isPassed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                <span className="font-medium">{item.description}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* item.type이 'money'일 때만 환율 태그를 표시 */}
                {item.type === 'money' && <Badge variant="secondary">{currency}</Badge>}
                <span className="text-sm text-muted-foreground">{item.currentValue}</span>
              </div>
            </div>
          ))}
          
          <div className="text-center pt-4">
            <p className="font-bold text-lg">
              분석 결과: {analysisResult.passCount} / {analysisResult.criteria.length} 항목 만족
            </p>
            <p className="text-muted-foreground">
              (필요 항목: {analysisResult.requiredCount}개 이상)
            </p>
          </div>

          <Button 
            className="w-full"
            disabled={analysisResult.passCount < analysisResult.requiredCount}
            onClick={() => window.open("https://www.google.com/finance", "_blank")}
          >
            거래하러 가기
          </Button>
        </div>
      )}
    </div>
  );
}
