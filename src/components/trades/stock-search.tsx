"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Star } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StockChart } from "./stock-chart";

type Stock = {
  symbol: string;
  name: string;
};

export function StockSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockData, setStockData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  useEffect(() => {
    const searchStocks = async () => {
      if (debouncedSearchTerm) {
        setIsSearching(true);
        setSearchResults([]);
        try {
          const response = await fetch(`/api/stock/search/${debouncedSearchTerm}`);
          const data = await response.json();
          if (response.ok) {
            setSearchResults(data);
          } else {
            setError(data.error || "검색 중 오류가 발생했습니다.");
          }
        } catch (err) {
          setError("검색 결과를 가져오는데 실패했습니다.");
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    };
    searchStocks();
  }, [debouncedSearchTerm]);

  const handleStockSelect = async (stock: Stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
    setIsLoading(true);
    setError(null);
    setStockData(null);

    try {
      const response = await fetch(`/api/stock/${stock.symbol}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '종목 정보를 가져오는데 실패했습니다.');
      }
      const data = await response.json();
      if (data.Symbol) {
        setStockData(data);
      } else {
        setError("유효하지 않은 종목이거나 데이터를 찾을 수 없습니다.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartAnalysis = () => {
    if (selectedStock) {
      router.push(`/checklist?symbol=${selectedStock.symbol}`);
    }
  };

  const toggleWatchlist = (symbol: string) => {
    const newWatchlist = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];
    
    setWatchlist(newWatchlist);
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    toast.success(
      watchlist.includes(symbol)
        ? `${symbol}을(를) 관심 종목에서 제거했습니다.`
        : `${symbol}을(를) 관심 종목에 추가했습니다.`
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>종목 검색</CardTitle>
        <CardDescription>분석하고 싶은 종목의 이름 또는 심볼을 입력하세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="예: Apple 또는 AAPL"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <ScrollArea className="h-[500px] w-full">
            <div className="grid grid-cols-1 gap-2">
              {isSearching && (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isSearching && searchResults.length > 0 && (
                searchResults.map((stock) => (
                  <DialogTrigger asChild key={stock.symbol}>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleStockSelect(stock)}
                    >
                      <span className="font-semibold mr-2">{stock.symbol}</span>
                      <span className="text-muted-foreground">{stock.name}</span>
                    </Button>
                  </DialogTrigger>
                ))
              )}
              {!isSearching && searchResults.length === 0 && debouncedSearchTerm && (
                <p className="text-center text-muted-foreground p-4">검색 결과가 없습니다.</p>
              )}
            </div>
          </ScrollArea>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isLoading && <Skeleton className="h-7 w-48" />}
                {error && '오류 발생'}
                {stockData && !isLoading && `${stockData.Name} (${stockData.Symbol})`}
              </DialogTitle>
              {stockData && !isLoading && (
                <DialogDescription className="pt-2">
                  {stockData.Description}
                </DialogDescription>
              )}
            </DialogHeader>
            
            {isLoading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-[250px] w-full mb-4" />
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ) : error ? (
              <div className="py-4 text-center text-red-500">{error}</div>
            ) : stockData && (
              <>
                <StockChart symbol={stockData.Symbol} />
                <div className="grid grid-cols-2 gap-4 py-4">
                  <p><strong>섹터:</strong> {stockData.Sector || 'N/A'}</p>
                  <p><strong>시가총액:</strong> {stockData.MarketCapitalization ? stockData.MarketCapitalization.toLocaleString() : 'N/A'}</p>
                </div>
                <DialogFooter className="sm:justify-between gap-2">
                  <Button variant="outline" onClick={() => toggleWatchlist(stockData.Symbol)}>
                    <Star className={cn("h-4 w-4 mr-2", watchlist.includes(stockData.Symbol) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                    {watchlist.includes(stockData.Symbol) ? '관심 종목 제거' : '관심 종목 추가'}
                  </Button>
                  <Button onClick={handleStartAnalysis} className="w-full sm:w-auto">
                    사전 분석 시작하기
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}