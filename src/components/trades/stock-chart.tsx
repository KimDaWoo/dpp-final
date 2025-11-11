"use client";

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/contexts/currency-context'; // useCurrency 훅 임포트

interface ChartData {
  date: string;
  price: number;
}

export function StockChart({ symbol }: { symbol: string | null }) {
  const { currency: displayCurrency, exchangeRate } = useCurrency();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setIsLoading(false);
      setChartData([]);
      return;
    }

    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/stock/chart/${symbol}`);
        if (!response.ok) {
          throw new Error('차트 데이터를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        // API는 항상 { currency: 'KRW', prices: [...] } 형식으로 응답
        setChartData(data.prices);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [symbol]);

  const transformedData = useMemo(() => {
    if (!exchangeRate || !chartData) return [];

    // 표시 통화가 USD일 경우에만 KRW 데이터를 변환
    if (displayCurrency === 'USD') {
      return chartData.map(item => ({ ...item, price: item.price / exchangeRate }));
    }
    
    // 표시 통화가 KRW이면 그대로 반환
    return chartData;
  }, [chartData, displayCurrency, exchangeRate]);

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
              return new Intl.NumberFormat(displayCurrency === 'KRW' ? 'ko-KR' : 'en-US', { 
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
            // transformedData에서 이미 통화 변환이 완료되었으므로,
            // 여기서는 현재 통화에 맞게 숫자 형식만 지정해줍니다.
            formatter={(value: number) => {
              const formattedValue = new Intl.NumberFormat(displayCurrency === 'KRW' ? 'ko-KR' : 'en-US', {
                style: 'currency',
                currency: displayCurrency,
                minimumFractionDigits: displayCurrency === 'USD' ? 2 : 0,
                maximumFractionDigits: displayCurrency === 'USD' ? 2 : 0,
              }).format(value);
              return [formattedValue, '가격'];
            }}
          />
          <Line 
            connectNulls={true}
            type="monotone" 
            dataKey="price" 
            stroke="#6c6c6c"  // 명확한 파란색 사용 (tailwind blue-500)
            strokeWidth={2.5}  // 선 두께 증가
            dot={false}        // 점 제거하여 깔끔한 선만 표시
            activeDot={{ r: 4 }} // 호버시에만 점 표시
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}