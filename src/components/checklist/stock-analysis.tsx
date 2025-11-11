import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { useIndicatorPreferences, IndicatorKey } from '@/contexts/indicator-preference-context';
import { useInvestmentPersonality } from '@/contexts/investment-personality-context';

type CriterionStatus = 'passed' | 'failed' | 'unavailable';

type AnalysisCriterion = {
  key: IndicatorKey;
  description: string;
  status: CriterionStatus;
  currentValue: string;
};

export type AnalysisResult = {
  isPass: boolean;
  passedCount: number;
  totalCount: number;
};

interface StockAnalysisProps {
  symbol: string | null;
  onAnalysisComplete: (result: AnalysisResult | null) => void;
}

const isNumber = (num: any): num is number => typeof num === 'number' && isFinite(num);

const StatusIcon = ({ status }: { status: CriterionStatus }) => {
  if (status === 'passed') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (status === 'failed') return <XCircle className="h-5 w-5 text-red-500" />;
  return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
};

export function StockAnalysis({ symbol, onAnalysisComplete }: StockAnalysisProps) {
  const { preferences, isLoading: isLoadingPreferences } = useIndicatorPreferences();
  const { personality } = useInvestmentPersonality();
  const [stockData, setStockData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisCriteria, setAnalysisCriteria] = useState<AnalysisCriterion[]>([]);

  useEffect(() => {
    const fetchStockData = async () => {
      if (!symbol) {
        setIsLoadingData(false);
        setStockData(null);
        return;
      }
      setIsLoadingData(true);
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
        setIsLoadingData(false);
      }
    };
    fetchStockData();
  }, [symbol]);

  useEffect(() => {
    if (!stockData || !preferences) {
      onAnalysisComplete(null);
      return;
    }

    const criteria: AnalysisCriterion[] = [];
    
    preferences.forEach(key => {
      let criterion: Omit<AnalysisCriterion, 'key'> | null = null;

      switch (key) {
        case 'PER':
          criterion = isNumber(stockData.PER)
            ? { description: 'PER > 0', status: stockData.PER > 0 ? 'passed' : 'failed', currentValue: stockData.PER.toFixed(2) }
            : { description: 'PER', status: 'unavailable', currentValue: 'N/A' };
          break;
        case 'PBR':
          criterion = isNumber(stockData.PBR) && stockData.PBR > 0
            ? { description: 'PBR < 2', status: stockData.PBR < 2 ? 'passed' : 'failed', currentValue: stockData.PBR.toFixed(2) }
            : { description: 'PBR', status: 'unavailable', currentValue: 'N/A' };
          break;
        case 'EPS':
          criterion = isNumber(stockData.EPS)
            ? { description: 'EPS > 0 (흑자)', status: stockData.EPS > 0 ? 'passed' : 'failed', currentValue: stockData.EPS.toLocaleString() }
            : { description: 'EPS', status: 'unavailable', currentValue: 'N/A' };
          break;
        case 'W52_HIGH_RATIO':
          if (isNumber(stockData.CurrentPrice) && isNumber(stockData.W52High) && stockData.W52High > 0) {
            const ratio = stockData.CurrentPrice / stockData.W52High;
            criterion = { description: '52주 최고가 대비 < 90%', status: ratio < 0.9 ? 'passed' : 'failed', currentValue: `${(ratio * 100).toFixed(0)}%` };
          } else {
            criterion = { description: '52주 최고가 대비', status: 'unavailable', currentValue: 'N/A' };
          }
          break;
        case 'BPS':
          criterion = isNumber(stockData.BPS) && stockData.BPS > 0
            ? { description: 'BPS > 0', status: 'passed', currentValue: stockData.BPS.toLocaleString() }
            : { description: 'BPS', status: 'unavailable', currentValue: 'N/A' };
          break;
        case 'FOREIGNER_RATIO':
          criterion = isNumber(stockData.FOREIGNER_RATIO)
            ? { description: '외국인 소진율', status: 'passed', currentValue: `${stockData.FOREIGNER_RATIO.toFixed(2)}%` }
            : { description: '외국인 소진율', status: 'unavailable', currentValue: 'N/A' };
          break;
      }
      if (criterion) {
        criteria.push({ key, ...criterion });
      }
    });

    setAnalysisCriteria(criteria);

    if (criteria.length > 0) {
      const passedCount = criteria.filter(c => c.status === 'passed').length;
      const totalCount = criteria.length;
      const satisfactionRate = totalCount > 0 ? passedCount / totalCount : 0;

      let isPass = false;
      switch (personality) {
        case 'aggressive':
          isPass = satisfactionRate >= 0.5;
          break;
        case 'moderate':
          isPass = satisfactionRate >= 0.7;
          break;
        case 'conservative':
          isPass = satisfactionRate >= 0.9;
          break;
        default:
          isPass = satisfactionRate >= 0.7;
      }
      onAnalysisComplete({ isPass, passedCount, totalCount });
    } else {
      onAnalysisComplete(null);
    }
  }, [stockData, preferences, personality, onAnalysisComplete]);

  const isLoading = isLoadingData || isLoadingPreferences;

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
  
  if (!preferences || preferences.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-muted-foreground">표시할 선호 지표가 없습니다.</p>
        <p className="text-xs text-muted-foreground mt-1">마이페이지 설정에서 선호 지표를 추가해보세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-3 pt-2">
        {analysisCriteria.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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