"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTradeLog } from "@/contexts/trade-log-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { toast } from "sonner";
import { StockInfo } from "@/lib/stock-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, SearchIcon, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Badge } from "../ui/badge";

// Zod 스키마 정의
const TradeLogSchema = z.object({
  symbol: z.string().min(1, "종목을 검색하여 선택해주세요."),
  name: z.string().min(1, "종목을 검색하여 선택해주세요."),
  buyPrice: z.coerce.number().min(0, "매수가는 0 이상이어야 합니다."),
  buyQuantity: z.coerce.number().int().min(1, "매수량은 1 이상이어야 합니다."),
  buyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)."),
  
  // 빈 문자열을 undefined로 전처리하여 optional 필드가 제대로 동작하도록 수정
  sellPrice: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "숫자를 입력해주세요." }).min(0, "매도가는 0 이상이어야 합니다.").optional()
  ),
  sellQuantity: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "숫자를 입력해주세요." }).int().min(1, "매도량은 1 이상이어야 합니다.").optional()
  ),
  sellDate: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다 (YYYY-MM-DD).").optional()
  ),
}).refine(data => {
  const sellFields = [data.sellPrice, data.sellQuantity, data.sellDate];
  // undefined가 아닌 필드의 수를 셉니다.
  const filledSellFields = sellFields.filter(field => field !== undefined).length;
  // 모든 필드가 비어있거나(0개), 모든 필드가 채워져 있어야(3개) 유효합니다.
  return filledSellFields === 0 || filledSellFields === 3;
}, {
  message: "매도 관련 정보(가격, 수량, 날짜)는 모두 입력하거나 모두 비워두어야 합니다.",
  path: ["sellPrice"], 
});

type TradeLogFormValues = z.infer<typeof TradeLogSchema>;

interface AddTradeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStock?: StockInfo;
}

export function AddTradeLogModal({ isOpen, onClose, selectedStock: initialStock }: AddTradeLogModalProps) {
  const { addTradeLog } = useTradeLog();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [isListVisible, setIsListVisible] = useState(false);
  const [isStockSelected, setIsStockSelected] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<TradeLogFormValues>({
    resolver: zodResolver(TradeLogSchema),
    defaultValues: {
      symbol: initialStock?.symbol || '',
      name: initialStock?.name || '',
      buyPrice: initialStock?.price || 0,
      buyQuantity: 1,
      buyDate: new Date().toISOString().split('T')[0],
      sellPrice: undefined,
      sellQuantity: undefined,
      sellDate: undefined,
    },
  });
  const { reset } = form;
  
  useEffect(() => {
    if (initialStock) {
      reset({
        symbol: initialStock.symbol,
        name: initialStock.name,
        buyPrice: initialStock.price,
        buyQuantity: 1,
        buyDate: new Date().toISOString().split('T')[0],
        sellPrice: undefined,
        sellQuantity: undefined,
        sellDate: undefined,
      });
      setIsStockSelected(true);
    } else {
      reset({
        symbol: '', name: '', buyPrice: 0, buyQuantity: 1, 
        buyDate: new Date().toISOString().split('T')[0],
        sellPrice: undefined, sellQuantity: undefined, sellDate: undefined,
      });
      setIsStockSelected(false);
    }
  }, [initialStock, reset, isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const response = await fetch(`/api/stock/search/${searchQuery}`);
          if (response.ok) {
            const data = await response.json();
            setSearchResults(Array.isArray(data) ? data : []);
            setIsListVisible(true);
          } else { setSearchResults([]); }
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        setIsListVisible(false);
      }
    };
    fetchResults();
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsListVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStockSelect = (stock: StockInfo) => {
    form.setValue("name", stock.name, { shouldValidate: true });
    form.setValue("symbol", stock.symbol, { shouldValidate: true });
    form.setValue("buyPrice", stock.price);
    setIsStockSelected(true);
    setSearchQuery("");
    setIsListVisible(false);
  };

  const resetStockSelection = () => {
    form.setValue("name", "", { shouldValidate: true });
    form.setValue("symbol", "", { shouldValidate: true });
    form.setValue("buyPrice", 0);
    setIsStockSelected(false);
  };

  const onSubmit = (data: TradeLogFormValues) => {
    addTradeLog({
      ...data,
      sellPrice: data.sellPrice,
      sellQuantity: data.sellQuantity,
      sellDate: data.sellDate,
    });
    toast.success("매매 기록이 추가되었습니다.");
    onClose();
  };
  
  const renderFormField = (name: keyof TradeLogFormValues, label: string, readOnly: boolean = false, placeholder?: string, type: string = "text") => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field, fieldState: { error } }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input placeholder={placeholder} type={type} {...field} value={field.value ?? ''} readOnly={readOnly} />
                {error && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center"><AlertCircle className="h-5 w-5 text-red-500" /></span>
                      </TooltipTrigger>
                      <TooltipContent><p>{error.message}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    );
  };

  const renderPriceField = (name: "buyPrice" | "sellPrice", label: string) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field, fieldState: { error } }) => {
          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const parsedValue = value.replace(/,/g, '');
            field.onChange(parsedValue === '' ? undefined : parsedValue);
          };

          const displayValue = field.value == null || field.value === '' ? '' : Number(field.value).toLocaleString();

          return (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="0"
                    type="text"
                    {...field}
                    value={displayValue}
                    onChange={handleChange}
                  />
                  {error && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center"><AlertCircle className="h-5 w-5 text-red-500" /></span>
                        </TooltipTrigger>
                        <TooltipContent><p>{error.message}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </FormControl>
            </FormItem>
          );
        }}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>매매 기록 추가</DialogTitle>
          <DialogDescription>종목을 검색하여 선택한 후, 매매 내역을 입력합니다. *는 필수 항목입니다.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {!isStockSelected ? (
              <Command ref={searchContainerRef} className="relative overflow-visible rounded-lg border">
                <div className="flex items-center px-3">
                  <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <CommandPrimitive.Input
                    placeholder="종목명 또는 종목코드를 검색하세요..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    onFocus={() => searchQuery.length > 0 && setIsListVisible(true)}
                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none"
                  />
                </div>
                {isListVisible && (
                  <CommandList className="absolute top-full z-50 mt-1 w-full rounded-b-md border bg-popover text-popover-foreground shadow-md">
                    {searchResults.length > 0 ? (
                      <CommandGroup>
                        {searchResults.map((stock) => (
                          <CommandItem key={`${stock.symbol}-${stock.exchange}`} onSelect={() => handleStockSelect(stock)} value={`${stock.name} ${stock.symbol}`} className="py-2">
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
            ) : (
              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                {renderFormField("name", "종목명 *", true)}
                {renderFormField("symbol", "종목코드 *", true)}
                <Button type="button" variant="outline" onClick={resetStockSelection} disabled={!!initialStock}>
                  <X className="mr-2 h-4 w-4" />
                  종목 변경
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              {renderPriceField("buyPrice", "매수가 *")}
              {renderFormField("buyQuantity", "매수량 *", false, undefined, "number")}
              {renderFormField("buyDate", "매수일 *", false, "YYYY-MM-DD")}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {renderPriceField("sellPrice", "매도가")}
              {renderFormField("sellQuantity", "매도량", false, undefined, "number")}
              {renderFormField("sellDate", "매도일", false, "YYYY-MM-DD")}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>취소</Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
