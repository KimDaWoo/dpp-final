"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/currency-context';
import { Inbox, Star } from 'lucide-react';
import { toast } from 'sonner';

interface StockData {
  Symbol: string;
  Name: string;
  Sector: string;
  MarketCapitalization: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { currency, formatCurrency } = useCurrency();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistData, setWatchlistData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingType, setIsCheckingType] = useState(true);

  useEffect(() => {
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
      setWatchlistData([]);
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

  const removeFromWatchlist = (e: React.MouseEvent, symbolToRemove: string) => {
    e.preventDefault();
    e.stopPropagation();

    const newWatchlist = watchlist.filter(symbol => symbol !== symbolToRemove);
    setWatchlist(newWatchlist);
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    toast.error(`${symbolToRemove}을(를) 관심 종목에서 제거했습니다.`);
  };

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
            <Card key={stock.Symbol} className="hover:bg-muted/50 transition-colors relative">
              <Button variant="ghost" size="icon" onClick={(e) => removeFromWatchlist(e, stock.Symbol)} className="absolute top-2 right-2 z-10">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              </Button>
              <Link href={`/checklist?symbol=${stock.Symbol}`} className="flex flex-col h-full p-6">
                <CardHeader className="p-0">
                  <CardTitle>{stock.Name} ({stock.Symbol})</CardTitle>
                  <CardDescription className="pt-2">
                    <Badge variant="outline">{stock.Sector || 'N/A'}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 mt-auto pt-4">
                  <p className="font-semibold">시가총액</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{currency}</Badge>
                    <span className="text-lg font-bold">{formatCurrency(stock.MarketCapitalization)}</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4" style={{ minHeight: '50vh' }}>
          <div className="flex flex-col items-center gap-2 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight">
              아직 추가된 관심 종목이 없습니다.
            </h3>
            <p className="text-sm text-muted-foreground">
              '종목 분석' 페이지에서 관심 있는 종목을 추가해보세요.
            </p>
            <Link href="/trades">
              <Button className="mt-4">종목 분석하러 가기</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
