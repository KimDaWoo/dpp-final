"use client";

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

type CriterionStatus = 'passed' | 'failed' | 'unavailable';

type AnalysisCriterion = {
  description: string;
  status: CriterionStatus;
  currentValue: string;
};

const isPositiveNumber = (num: any): num is number => typeof num === 'number' && isFinite(num) && num > 0;

const StatusIcon = ({ status }: { status: CriterionStatus }) => {
  if (status === 'passed') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (status === 'failed') return <XCircle className="h-5 w-5 text-red-500" />;
  return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
};

export function StockAnalysis({ symbol }: { symbol: string | null }) {
  const [stockData, setStockData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisCriteria, setAnalysisCriteria] = useState<AnalysisCriterion[]>([]);

  useEffect(() => {
    const fetchStockData = async () => {
      if (!symbol) {
        setIsLoading(false);
        setStockData(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/stock/${symbol}`);
        if (!response.ok) {
          throw new Error('종목 정보를 가져오는데 실패했습니다.');
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
    if (!stockData) return;

    const criteria: AnalysisCriterion[] = [];
    const { PERatio, PBRatio, EPS, CurrentPrice, W52High } = stockData;

    // 1. PER
    if (isPositiveNumber(PERatio)) {
      criteria.push({
        description: 'PER < 25',
        status: PERatio < 25 ? 'passed' : 'failed',
        currentValue: PERatio.toFixed(2),
      });
    } else {
      criteria.push({ description: 'PER', status: 'unavailable', currentValue: '제공되지 않음' });
    }

    // 2. PBR
    if (isPositiveNumber(PBRatio)) {
      criteria.push({
        description: 'PBR < 2',
        status: PBRatio < 2 ? 'passed' : 'failed',
        currentValue: PBRatio.toFixed(2),
      });
    } else {
      criteria.push({ description: 'PBR', status: 'unavailable', currentValue: '제공되지 않음' });
    }

    // 3. EPS
    if (isPositiveNumber(EPS)) {
      criteria.push({
        description: 'EPS > 0 (흑자 기업)',
        status: 'passed',
        currentValue: EPS.toFixed(2),
      });
    } else {
      criteria.push({ description: 'EPS', status: 'unavailable', currentValue: '제공되지 않음' });
    }

    // 4. 52주 최고가 대비
    if (isPositiveNumber(CurrentPrice) && isPositiveNumber(W52High)) {
      const ratio = CurrentPrice / W52High;
      criteria.push({
        description: '52주 최고가 대비 < 90%',
        status: ratio < 0.9 ? 'passed' : 'failed',
        currentValue: `${(ratio * 100).toFixed(0)}%`,
      });
    } else {
      criteria.push({ description: '52주 최고가 대비', status: 'unavailable', currentValue: '계산 불가' });
    }

    setAnalysisCriteria(criteria);
  }, [stockData]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-3 pt-2">
        {analysisCriteria.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIcon status={item.status} />
              <span className="font-medium text-sm">{item.description}</span>
            </div>
            <span className="text-sm font-mono text-muted-foreground">{item.currentValue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

