"use client";

import { useState, useEffect } from "react";
import { ChevronsUpDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stock = {
  symbol: string;
  name: string;
};

export function StockSearch() {
  const [stockList, setStockList] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [stockData, setStockData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchStockList = async () => {
      try {
        const response = await fetch("/api/stock/list");
        const data = await response.json();
        setStockList(data);
      } catch (error) {
        setError("Failed to load stock list.");
      } finally {
        setIsListLoading(false);
      }
    };
    fetchStockList();
  }, []);

  useEffect(() => {
    const fetchStockDetails = async () => {
      if (!selectedStock) return;

      setIsLoading(true);
      setError(null);
      setStockData(null);

      try {
        const response = await fetch(`/api/stock/${selectedStock.symbol}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch data');
        }
        const data = await response.json();
        if (data.Symbol) {
          setStockData(data);
        } else {
          setError("Invalid symbol or no data found.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockDetails();
  }, [selectedStock]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isListLoading}
            >
              {isListLoading
                ? "Loading stocks..."
                : selectedStock
                ? `${selectedStock.name} (${selectedStock.symbol})`
                : "Select a stock..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search stock..." />
              <CommandList>
                <CommandEmpty>No stock found.</CommandEmpty>
                <CommandGroup>
                  {stockList.map((stock) => (
                    <CommandItem
                      key={stock.symbol}
                      value={`${stock.symbol} - ${stock.name}`}
                      onSelect={() => {
                        setSelectedStock(stock);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedStock?.symbol === stock.symbol ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {stock.name} ({stock.symbol})
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {isLoading && <p className="mt-4 text-center">Loading analysis...</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}

        {stockData && !isLoading && (
          <div className="mt-6 space-y-4">
            <h2 className="text-2xl font-bold">{stockData.Name} ({stockData.Symbol})</h2>
            <p className="text-muted-foreground">{stockData.Description}</p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <p><strong>Sector:</strong> {stockData.Sector}</p>
                <p><strong>Industry:</strong> {stockData.Industry}</p>
                <p><strong>Market Cap:</strong> {parseInt(stockData.MarketCapitalization).toLocaleString()}</p>
                <p><strong>P/E Ratio:</strong> {stockData.PERatio}</p>
                <p><strong>EPS:</strong> {stockData.EPS}</p>
                <p><strong>52 Week High:</strong> ${stockData['52WeekHigh']}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
