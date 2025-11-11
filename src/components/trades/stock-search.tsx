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
import { StockAnalysis } from "../checklist/stock-analysis";
import { SearchIcon, Star } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import { StockInfo } from "@/lib/stock-utils";

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

export function StockSearch({ 
  selectedStock, 
  isModalOpen, 
  onModalClose, 
  onSelectStock 
}: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockInfo[]>([]);
  const [selectedStockInfo, setSelectedStockInfo] = useState<StockInfo | null>(null);
  const [isListVisible, setIsListVisible] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeType>('전체');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

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
            } else {
              setResults([]);
            }
          } else {
            setResults([]);
          }
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedStockInfo(null);
    }
  }, [isModalOpen]);
  
  useEffect(() => {
    if (isModalOpen && selectedStock) {
      if (!selectedStockInfo || selectedStockInfo.symbol !== selectedStock.symbol) {
        const findStockInfo = async () => {
          try {
            // Carousel에서 받은 exchange 정보가 있으면 API 호출 시 포함
            const apiUrl = selectedStock.exchange
              ? `/api/stock/search/${selectedStock.symbol}?exchange=${selectedStock.exchange}`
              : `/api/stock/search/${selectedStock.symbol}`;
            
            const response = await fetch(apiUrl);
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data) && data.length > 0) {
                // exchange 정보까지 일치하는 첫 번째 항목을 선택
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
    if (isFavorite(selectedStock.symbol)) {
      removeFavorite(selectedStock.symbol);
    } else {
      addFavorite(selectedStock.symbol);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {exchanges.map(exchange => (
            <Button
              key={exchange}
              variant={selectedExchange === exchange ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedExchange(exchange)}
            >
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
                    <CommandItem
                      key={`${stock.symbol}-${stock.exchange}`}
                      onSelect={() => handleLocalSelect(stock)}
                      value={`${stock.name} ${stock.symbol}`}
                      className="py-2"
                    >
                      <span>{stock.name}</span>
                      <Badge variant="outline" className="ml-2">{stock.exchange}</Badge>
                      <span className="ml-auto text-xs text-muted-foreground">{stock.symbol}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              )}
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
            <div className="h-[400px]">
              <StockChart symbol={selectedStock?.symbol ?? null} />
            </div>
            <div className="h-full">
              <StockAnalysis symbol={selectedStock?.symbol ?? null} />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button className="w-full sm:w-auto" onClick={() => {
              if (!selectedStock?.symbol) return;
              const url = `https://www.tossinvest.com/stocks/A${selectedStock.symbol}`;
              window.open(url, '_blank');
            }}>
              거래하러 가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
