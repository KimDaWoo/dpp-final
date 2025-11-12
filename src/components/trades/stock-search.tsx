"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Command as CommandPrimitive } from "cmdk";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StockChart } from "./stock-chart";
import { StockAnalysis, AnalysisResult } from "../checklist/stock-analysis";
import { SearchIcon, Star } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import { StockInfo } from "@/lib/stock-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TradeConfirmationModal } from "./trade-confirmation-modal";
import { AddTradeLogModal } from "./add-trade-log-modal";
import { toast } from "sonner";

interface SelectedStockInfo {
  symbol: string;
  exchange: string | null;
}

interface StockSearchProps {
  selectedStock: SelectedStockInfo | null;
  isModalOpen: boolean;
  onModalClose: () => void;
  onSelectStock: (symbol: string) => void;
}

const exchanges = ['전체', 'KOSPI', 'KOSDAQ', 'KONEX', 'ELW'] as const;
type ExchangeType = typeof exchanges[number];
const DONT_ASK_AGAIN_KEY = 'tradeLogDontAskAgain';

export function StockSearch({ 
  selectedStock, 
  isModalOpen, 
  onModalClose, 
  onSelectStock 
}: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockInfo[]>([]);
  const [selectedStockInfo, setSelectedStockInfo] = useState<StockInfo | null>(null);
  const [stockForLog, setStockForLog] = useState<StockInfo | undefined>(undefined);
  const [isListVisible, setIsListVisible] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeType>('전체');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [isAddLogOpen, setAddLogOpen] = useState(false);

  const openTossPage = () => {
    if (!selectedStock?.symbol) return;
    const url = `https://www.tossinvest.com/stocks/A${selectedStock.symbol}`;
    window.open(url, '_blank');
  };

  const fetchPriceAndOpenAddModal = async () => {
    if (!selectedStock?.symbol) return;
    
    openTossPage(); // 토스 페이지를 먼저 엽니다.

    const loadingToast = toast.loading("현재가를 조회중입니다...");
    try {
      const response = await fetch(`/api/stock/${selectedStock.symbol}`);
      if (response.ok) {
        const details = await response.json();
        const stockWithCurrentPrice: StockInfo = {
          symbol: details.Symbol,
          name: details.Name,
          exchange: (selectedStockInfo?.exchange as StockInfo['exchange']) || 'KOSPI',
          price: details.CurrentPrice,
          sector: selectedStockInfo?.sector || 'N/A', // Add missing sector
          realtimeSymbol: selectedStockInfo?.realtimeSymbol || details.Symbol, // Add missing realtimeSymbol
        };
        setStockForLog(stockWithCurrentPrice);
        toast.success("현재가 조회가 완료되었습니다.", { id: loadingToast });
      } else {
        throw new Error("API fetching failed");
      }
    } catch (error) {
      console.error("Failed to fetch current price:", error);
      toast.error("현재가 조회에 실패했습니다. 기존 정보로 기록합니다.", { id: loadingToast });
      setStockForLog(selectedStockInfo || undefined);
    } finally {
      setAddLogOpen(true);
    }
  };

  const handleTradeButtonClick = () => {
    const preference = localStorage.getItem(DONT_ASK_AGAIN_KEY);
    if (preference === 'always_save') {
      fetchPriceAndOpenAddModal();
    } else if (preference === 'always_skip') {
      openTossPage();
    } else {
      setConfirmationOpen(true);
    }
  };

  const handleConfirmAndSave = (dontAskAgain: boolean) => {
    if (dontAskAgain) {
      localStorage.setItem(DONT_ASK_AGAIN_KEY, 'always_save');
    }
    setConfirmationOpen(false);
    fetchPriceAndOpenAddModal();
  };

  const handleDeclineAndSkip = (dontAskAgain: boolean) => {
    if (dontAskAgain) {
      localStorage.setItem(DONT_ASK_AGAIN_KEY, 'always_skip');
    }
    setConfirmationOpen(false);
    openTossPage();
  };

  useEffect(() => {
    const searchStocks = async () => {
      if (query.trim().length > 0) {
        try {
          const response = await fetch(`/api/stock/search/${query}?exchange=${selectedExchange}`);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              setResults(data);
              setIsListVisible(true);
            } else { setResults([]); }
          } else { setResults([]); }
        } catch (error) {
          console.error("Failed to fetch search results:", error);
          setResults([]);
        }
      } else {
        setResults([]);
        setIsListVisible(false);
      }
    };
    searchStocks();
  }, [query, selectedExchange]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsListVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedStockInfo(null);
      setAnalysisResult(null);
    }
  }, [isModalOpen]);
  
  useEffect(() => {
    if (isModalOpen && selectedStock) {
      if (!selectedStockInfo || selectedStockInfo.symbol !== selectedStock.symbol) {
        const findStockInfo = async () => {
          try {
            const apiUrl = selectedStock.exchange
              ? `/api/stock/search/${selectedStock.symbol}?exchange=${selectedStock.exchange}`
              : `/api/stock/search/${selectedStock.symbol}`;
            const response = await fetch(apiUrl);
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data) && data.length > 0) {
                const matchingStock = data.find(s => s.symbol === selectedStock.symbol && (!selectedStock.exchange || s.exchange === selectedStock.exchange));
                setSelectedStockInfo(matchingStock || data[0]);
              }
            }
          } catch (error) {
            console.error("Failed to fetch stock info for modal title:", error);
            setSelectedStockInfo(null);
          }
        };
        findStockInfo();
      }
    }
  }, [isModalOpen, selectedStock, selectedStockInfo]);

  const handleLocalSelect = (stock: StockInfo) => {
    setSelectedStockInfo(stock);
    onSelectStock(stock.symbol);
    setQuery("");
    setIsListVisible(false);
  };

  const handleFavoriteToggle = () => {
    if (!selectedStock?.symbol) return;
    if (isFavorite(selectedStock.symbol)) removeFavorite(selectedStock.symbol);
    else addFavorite(selectedStock.symbol);
  };

  const TradeButton = () => {
    const isDisabled = !analysisResult?.isPass;
    const button = (
       <Button className="w-full sm:w-auto" onClick={handleTradeButtonClick} disabled={isDisabled}>
          거래하러 가기
        </Button>
    );

    if (isDisabled) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><span>{button}</span></TooltipTrigger>
            <TooltipContent><p>투자 성향 기준을 만족하지 못했습니다.</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return button;
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {exchanges.map(exchange => (
            <Button key={exchange} variant={selectedExchange === exchange ? 'secondary' : 'ghost'} size="sm" onClick={() => setSelectedExchange(exchange)}>
              {exchange}
            </Button>
          ))}
        </div>
        <Command ref={searchContainerRef} className="relative overflow-visible rounded-lg border">
          <div className="flex items-center px-3">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandPrimitive.Input
              placeholder="삼성전자 또는 005930..."
              value={query}
              onValueChange={setQuery}
              onFocus={() => query.length > 0 && setIsListVisible(true)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          {isListVisible && (
            <CommandList className="absolute top-full z-10 mt-1 w-full rounded-b-md border-t bg-popover text-popover-foreground shadow-md">
              {results.length > 0 ? (
                <CommandGroup>
                  {results.map((stock) => (
                    <CommandItem key={`${stock.symbol}-${stock.exchange}`} onSelect={() => handleLocalSelect(stock)} value={`${stock.name} ${stock.symbol}`} className="py-2">
                      <span>{stock.name}</span>
                      <Badge variant="outline" className="ml-2">{stock.exchange}</Badge>
                      <span className="ml-auto text-xs text-muted-foreground">{stock.symbol}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : ( <CommandEmpty>검색 결과가 없습니다.</CommandEmpty> )}
            </CommandList>
          )}
        </Command>
      </div>

      <Dialog open={isModalOpen} onOpenChange={onModalClose}>
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>{selectedStockInfo?.name} ({selectedStockInfo?.symbol})</DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleFavoriteToggle}>
                <Star className={`h-5 w-5 ${selectedStock?.symbol && isFavorite(selectedStock.symbol) ? 'fill-current text-yellow-400' : ''}`} />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedStockInfo?.exchange}</Badge>
              </div>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto pt-2">
            <div className="h-[400px]"><StockChart symbol={selectedStock?.symbol ?? null} /></div>
            <div className="h-full"><StockAnalysis symbol={selectedStock?.symbol ?? null} onAnalysisComplete={setAnalysisResult} /></div>
          </div>
          <DialogFooter className="pt-4 sm:justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {analysisResult && analysisResult.totalCount > 0 && (
                <p>지표 만족률: <span className={`font-bold ${analysisResult.isPass ? 'text-green-500' : 'text-red-500'}`}>{` ${analysisResult.passedCount} / ${analysisResult.totalCount}`}</span>{` (${Math.round((analysisResult.passedCount / analysisResult.totalCount) * 100)}%)`}</p>
              )}
            </div>
            <TradeButton />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TradeConfirmationModal 
        isOpen={isConfirmationOpen}
        onClose={() => handleDeclineAndSkip(false)}
        onConfirm={handleConfirmAndSave}
      />

      {isAddLogOpen && (
        <AddTradeLogModal
          isOpen={isAddLogOpen}
          onClose={() => {
            setAddLogOpen(false);
            // openTossPage(); // 이제 모달이 열릴 때 토스 페이지를 엽니다.
          }}
          selectedStock={stockForLog}
        />
      )}
    </>
  );
}