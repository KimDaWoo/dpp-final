"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface StockData {
  Symbol: string;
  Name: string;
  Sector: string;
  MarketCapitalization: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistData, setWatchlistData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingType, setIsCheckingType] = useState(true);

  useEffect(() => {
    // 첫 로그인 확인 로직
    const investmentType = localStorage.getItem('investmentType');
    if (!investmentType) {
      router.push('/quiz');
    } else {
      setIsCheckingType(false);
    }

    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    } else {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isCheckingType || watchlist.length === 0) {
      setIsLoading(false);
      return;
    };

    const fetchWatchlistData = async () => {
      setIsLoading(true);
      const dataPromises = watchlist.map(symbol =>
        fetch(`/api/stock/${symbol}`).then(res => res.json())
      );
      const results = await Promise.all(dataPromises);
      setWatchlistData(results.filter(d => d && !d.error));
      setIsLoading(false);
    };

    fetchWatchlistData();
  }, [watchlist, isCheckingType]);

  if (isCheckingType) {
    return <div className="text-center p-8">사용자 정보를 확인하는 중입니다...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-muted-foreground">나의 관심 종목 현황입니다.</p>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : watchlistData.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {watchlistData.map(stock => (
            <Link href={`/checklist?symbol=${stock.Symbol}`} key={stock.Symbol}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle>{stock.Name} ({stock.Symbol})</CardTitle>
                  <CardDescription>{stock.Sector || 'N/A'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p><strong>시가총액:</strong> {stock.MarketCapitalization ? stock.MarketCapitalization.toLocaleString() : 'N/A'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center p-8">
          <p className="text-muted-foreground">아직 추가된 관심 종목이 없습니다.</p>
          <p className="text-muted-foreground mt-2">
            <Link href="/trades" className="text-primary font-semibold hover:underline">
              종목 분석
            </Link>
            {' '}페이지에서 종목을 추가해보세요.
          </p>
        </Card>
      )}
    </div>
  );
}
