"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle } from 'lucide-react';

type AnalysisCriterion = {
  description: string;
  isPassed: boolean;
  currentValue: string;
};

type AnalysisResult = {
  criteria: AnalysisCriterion[];
  passCount: number;
  requiredCount: number;
};

// Polygon.io 데이터 기반의 간소화된 분석 규칙
const conservativeCriteria = {
  marketCap: 10_000_000_000, // 100억 달러
  sectors: ['Services', 'Finance', 'Utilities'],
  requiredCount: 2,
};

const aggressiveCriteria = {
  marketCap: 1_000_000_000, // 10억 달러
  sectors: ['Technology', 'Manufacturing'],
  requiredCount: 1,
};

export function StockAnalysis({ symbol }: { symbol: string }) {
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
          throw new Error('기업 정보를 가져오는데 실패했습니다.');
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
    const marketCapPassed = stockData.MarketCapitalization > criteria.marketCap;
    if (marketCapPassed) passCount++;
    results.push({
      description: `시가총액 > ${criteria.marketCap.toLocaleString()} 달러`,
      isPassed: marketCapPassed,
      currentValue: `현재 ${stockData.MarketCapitalization?.toLocaleString() || 'N/A'} 달러`,
    });

    // 2. 업종 기준
    const sectorPassed = criteria.sectors.some(sector => stockData.Sector?.includes(sector));
    if (sectorPassed) passCount++;
    results.push({
      description: `업종이 [${criteria.sectors.join(', ')}] 중 하나에 포함`,
      isPassed: sectorPassed,
      currentValue: `현재 ${stockData.Sector || 'N/A'}`,
    });

    setAnalysisResult({
      criteria: results,
      passCount,
      requiredCount: criteria.requiredCount,
    });
  }, [stockData, investorType]);

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
              <span className="text-sm text-muted-foreground">{item.currentValue}</span>
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
