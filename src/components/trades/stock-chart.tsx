"use client";

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/currency-context'; // useCurrency 훅 임포트

interface ChartData {
  date: string;
  price: number;
}

export function StockChart({ symbol }: { symbol: string }) {
  const { currency, exchangeRate, formatCurrency } = useCurrency(); // 1. 통화 정보 연동
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/stock/chart/${symbol}`);
        if (!response.ok) {
          throw new Error('차트 데이터를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setChartData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [symbol]);

  // 2. 데이터 변환: KRW일 경우 환율 적용
  const transformedData = useMemo(() => {
    if (currency === 'KRW' && exchangeRate) {
      return chartData.map(item => ({
        ...item,
        price: item.price * exchangeRate,
      }));
    }
    return chartData;
  }, [chartData, currency, exchangeRate]);

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  if (error) {
    return <p className="text-red-500 text-center h-[250px] flex items-center justify-center">{error}</p>;
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={transformedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          {/* 3. Y축 서식 변경 */}
          <YAxis 
            tick={{ fontSize: 12 }} 
            tickLine={false} 
            axisLine={false} 
            domain={[dataMin => dataMin * 0.9, dataMax => dataMax * 1.1]}
            tickFormatter={(value) => {
              // 축에는 간결한 포맷 적용 (예: 1.5M, 13억)
              return new Intl.NumberFormat(currency === 'KRW' ? 'ko-KR' : 'en-US', { 
                notation: 'compact', 
                compactDisplay: 'short' 
              }).format(value);
            }}
          />
          {/* 3. 툴팁 서식 변경 */}
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              fontSize: '12px',
            }}
            formatter={(value: number) => [formatCurrency(value), '가격']}
          />
          <Line 
            connectNulls={true}
            type="monotone" 
            dataKey="price" 
            stroke="hsl(var(--primary))" 
            strokeWidth={1.5} 
            dot={false} 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}