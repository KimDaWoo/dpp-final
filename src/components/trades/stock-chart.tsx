"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartData {
  date: string;
  price: number;
}

export function StockChart({ symbol }: { symbol: string }) {
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

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  if (error) {
    return <p className="text-red-500 text-center h-[250px] flex items-center justify-center">{error}</p>;
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis 
            tick={{ fontSize: 12 }} 
            tickLine={false} 
            axisLine={false} 
            domain={[dataMin => Math.floor(dataMin * 0.9), dataMax => Math.ceil(dataMax * 1.1)]}
            tickFormatter={(tick) => Math.round(tick).toString()}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              fontSize: '12px',
            }}
          />
          <Line 
            connectNulls={true}
            type="monotone" 
            dataKey="price" 
            stroke="hsl(var(--primary))" 
            strokeWidth={1.5} 
            dot={{ r: 3 }} 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
