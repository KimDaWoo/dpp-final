"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTradeLog, TradeLog } from "@/contexts/trade-log-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { toast } from "sonner";
import { StockInfo } from "@/lib/stock-utils";
import { AlertCircle, SearchIcon, X, CalendarIcon, DollarSign, Info, Pencil, Save } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/currency-context";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";

const RATIONALE_TAGS = [
  "PER", "PBR", "EPS", "W52_HIGH_RATIO", "BPS", "FOREIGNER_RATIO", "그 외"
];

const TradeLogSchema = z.object({
  symbol: z.string().min(1, "종목을 검색하여 선택해주세요."),
  name: z.string().min(1, "종목명을 입력해주세요."),
  buyPrice: z.number().positive("매수가는 0보다 커야 합니다."),
  buyQuantity: z.number().int().min(1, "매수량은 1 이상이어야 합니다."),
  buyDate: z.date(),
  sellPrice: z.number().min(0, "매도가는 0 이상이어야 합니다.").optional(),
  sellQuantity: z.number().int().min(1, "매도량은 1 이상이어야 합니다.").optional(),
  sellDate: z.date().optional(),
  rationaleTags: z.array(z.string()).min(1, "매수 근거 태그를 하나 이상 선택해주세요."),
  rationale: z.string().min(1, "상세 근거를 작성해주세요."),
}).superRefine((data, ctx) => {
  if (data.sellQuantity !== undefined && data.buyQuantity !== undefined && data.sellQuantity > data.buyQuantity) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "매도량은 매수량보다 많을 수 없습니다.", path: ["sellQuantity"] });
  }
  if (data.buyDate && data.sellDate) {
    const buyDate = new Date(data.buyDate);
    const sellDate = new Date(data.sellDate);
    buyDate.setHours(0, 0, 0, 0);
    sellDate.setHours(0, 0, 0, 0);
    if (sellDate.getTime() < buyDate.getTime()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "매도일은 매수일보다 이전일 수 없습니다.", path: ["sellDate"] });
    }
  }
  if (data.sellPrice !== undefined && data.sellQuantity !== undefined && data.sellDate !== undefined) {
    if (data.sellPrice <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "매도가는 0보다 커야 합니다.", path: ["sellPrice"] });
    }
  }
});

type TradeLogFormValues = z.infer<typeof TradeLogSchema>;

interface AddTradeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeLog?: TradeLog;
  selectedStock?: StockInfo;
}

export function AddTradeLogModal({ isOpen, onClose, tradeLog, selectedStock: initialStock }: AddTradeLogModalProps) {
  const { addTradeLog, updateTradeLog } = useTradeLog();
  const { currency, exchangeRate } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [isListVisible, setIsListVisible] = useState(false);
  const [isStockSelected, setIsStockSelected] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isRationaleEditing, setIsRationaleEditing] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const isEditMode = !!tradeLog;

  const form = useForm<TradeLogFormValues>({
    resolver: zodResolver(TradeLogSchema),
    mode: "onChange",
    defaultValues: { 
      symbol: '', name: '', buyPrice: 0, buyQuantity: 1, buyDate: new Date(),
      sellPrice: undefined, sellQuantity: undefined, sellDate: undefined,
      rationaleTags: [], rationale: '',
    },
  });
  
  const { reset, formState: { isValid, errors }, watch, control, setValue } = form;
  
  const watchedBuyDate = watch("buyDate");
  const watchedSellPrice = watch("sellPrice");
  const watchedSellQuantity = watch("sellQuantity");
  const watchedSellDate = watch("sellDate");
  const watchedRationaleTags = watch("rationaleTags");

  useEffect(() => {
    const sellFields = [watchedSellPrice, watchedSellQuantity, watchedSellDate];
    const filledSellFields = sellFields.filter(field => field !== undefined && field !== null && !(typeof field === 'number' && field === 0) && !(field instanceof Date && isNaN(field.getTime()))).length;
    if (filledSellFields > 0 && filledSellFields < 3) {
      setInfoMessage("매도 관련 정보는 모두 입력하거나 모두 비워두어야 합니다.");
    } else {
      setInfoMessage(null);
    }
  }, [watchedSellPrice, watchedSellQuantity, watchedSellDate]);

  useEffect(() => {
    if (debouncedSearchQuery) {
      const fetchSearchResults = async () => {
        try {
          const response = await fetch(`/api/stock/search/${debouncedSearchQuery}`);
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
            setIsListVisible(true);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        }
      };
      fetchSearchResults();
    } else {
      setSearchResults([]);
      setIsListVisible(false);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (isOpen) {
      setIsRationaleEditing(false);
      if (exchangeRate) {
        const stockToEdit = tradeLog || initialStock;
        if (stockToEdit) {
          let initialBuyPrice = 0;
          if ('buyPrice' in stockToEdit && stockToEdit.buyPrice) initialBuyPrice = stockToEdit.buyPrice;
          else if (initialStock && 'price' in initialStock && initialStock.price) initialBuyPrice = initialStock.price;
          
          reset({
            symbol: stockToEdit.symbol, name: stockToEdit.name, buyPrice: initialBuyPrice,
            buyQuantity: 'buyQuantity' in stockToEdit ? stockToEdit.buyQuantity : 1,
            buyDate: 'buyDate' in stockToEdit ? new Date(stockToEdit.buyDate) : new Date(),
            sellPrice: 'sellPrice' in stockToEdit && stockToEdit.sellPrice ? stockToEdit.sellPrice : undefined,
            sellQuantity: 'sellQuantity' in stockToEdit && stockToEdit.sellQuantity ? stockToEdit.sellQuantity : undefined,
            sellDate: 'sellDate' in stockToEdit && stockToEdit.sellDate ? new Date(stockToEdit.sellDate) : undefined,
            rationaleTags: 'rationaleTags' in stockToEdit ? stockToEdit.rationaleTags : [],
            rationale: 'rationale' in stockToEdit ? stockToEdit.rationale : '',
          });
          setIsStockSelected(true);
        } else {
          reset({
            symbol: '', name: '', buyPrice: 0, buyQuantity: 1, buyDate: new Date(),
            sellPrice: undefined, sellQuantity: undefined, sellDate: undefined,
            rationaleTags: [], rationale: '',
          });
          setIsStockSelected(false);
        }
      }
    }
  }, [tradeLog, initialStock, reset, isOpen, exchangeRate]);

  const onSubmit = (data: TradeLogFormValues) => {
    if (!exchangeRate) {
      toast.error("환율 정보가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    const logData = { ...data, buyDate: format(data.buyDate, "yyyy-MM-dd"), sellDate: data.sellDate ? format(data.sellDate, "yyyy-MM-dd") : undefined };
    if (isEditMode) {
      updateTradeLog(tradeLog.id, logData);
      toast.success("매매 기록이 수정되었습니다.");
    } else {
      addTradeLog(logData);
      toast.success("매매 기록이 추가되었습니다.");
    }
    onClose();
  };

  const FormErrors = () => {
    const errorMessages = Object.values(errors).map(error => error.message).filter(Boolean);
    if (errorMessages.length === 0) return null;
    const uniqueErrorMessages = [...new Set(errorMessages)];
    return (
      <div className="bg-destructive/10 text-destructive p-3 rounded-md"><div className="flex items-center"><AlertCircle className="h-5 w-5 mr-2" /><ul className="pl-0 space-y-1">{uniqueErrorMessages.map((message, index) => (<li key={index} className="text-sm">{message}</li>))}</ul></div></div>
    );
  };

  const InfoMessage = () => {
    if (!infoMessage) return null;
    return (
      <div className="bg-blue-50 text-blue-800 p-3 rounded-md"><div className="flex items-center"><Info className="h-5 w-5 mr-2" /><p className="text-sm">{infoMessage}</p></div></div>
    );
  };

  const renderPriceField = (name: "buyPrice" | "sellPrice", label: string) => (
    <FormField control={control} name={name} render={({ field }) => {
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const parsedValue = value.replace(/,/g, '');
        const numberValue = parsedValue === '' ? (name === 'sellPrice' ? undefined : 0) : parseFloat(parsedValue);
        if (numberValue !== undefined && !isNaN(numberValue)) {
          const valueInKRW = currency === 'USD' && exchangeRate ? numberValue * exchangeRate : numberValue;
          field.onChange(valueInKRW);
        } else if (name === 'sellPrice') field.onChange(undefined);
        else field.onChange(0);
      };
      let displayValue = field.value;
      if (currency === 'USD' && exchangeRate && typeof displayValue === 'number') displayValue = displayValue / exchangeRate;
      let valueToShow: string;
      if (focusedField === name) valueToShow = displayValue == null ? '' : String(displayValue);
      else valueToShow = displayValue == null || (name === 'buyPrice' && displayValue === 0) ? '' : Number(displayValue).toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 });
      return (<FormItem><FormLabel>{label}</FormLabel><FormControl><div className="relative flex items-center"><Input placeholder="0" type="text" value={valueToShow} onChange={handleChange} onFocus={() => setFocusedField(name)} onBlur={() => setFocusedField(null)} className="pr-8" /><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">{currency === 'KRW' ? <span className="font-sans font-semibold text-xs">₩</span> : <DollarSign className="h-3 w-3" />}</div></div></FormControl></FormItem>);
    }}/>
  );

  const handleStockSelect = (stock: StockInfo) => {
    setValue("name", stock.name, { shouldValidate: true });
    setValue("symbol", stock.symbol, { shouldValidate: true });
    setValue("buyPrice", 0);
    setIsStockSelected(true);
    setSearchQuery("");
    setIsListVisible(false);
  };

  const resetStockSelection = () => {
    setValue("name", "", { shouldValidate: true });
    setValue("symbol", "", { shouldValidate: true });
    setValue("buyPrice", 0);
    setIsStockSelected(false);
  };
  
  const renderDateField = (name: "buyDate" | "sellDate", label: string) => (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem className="flex flex-col"><FormLabel>{label}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "yyyy-MM-dd") : <span>날짜 선택</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start" side={name === 'sellDate' ? "top" : "bottom"} sideOffset={4}><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => { const today = new Date(); today.setHours(0, 0, 0, 0); const minDate = name === 'sellDate' && watchedBuyDate ? new Date(watchedBuyDate) : new Date("1900-01-01"); if (name === 'sellDate' && watchedBuyDate) minDate.setHours(0, 0, 0, 0); return date > today || date < minDate; }} initialFocus /></PopoverContent></Popover></FormItem>
    )}/>
  );
  
  const renderFormField = (name: keyof TradeLogFormValues, label: string, readOnly: boolean = false, placeholder?: string, type: string = "text") => (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem><FormLabel>{label}</FormLabel><FormControl><div className="flex items-center gap-2"><Input placeholder={placeholder} type={type} {...field} value={field.value instanceof Date ? format(field.value, "yyyy-MM-dd") : field.value ?? ''} onChange={(e) => { if (name === 'buyQuantity' || name === 'sellQuantity') { const value = e.target.value; const numberValue = value === '' ? (name === 'sellQuantity' ? undefined : 1) : parseInt(value, 10); field.onChange(isNaN(numberValue!) ? (name === 'sellQuantity' ? undefined : 1) : numberValue); } else { field.onChange(e.target.value); } }} readOnly={readOnly} /></div></FormControl></FormItem>
    )}/>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '매매 기록 수정' : '매매 기록 추가'}</DialogTitle>
          <DialogDescription>{isEditMode ? '매매 내역을 수정합니다.' : '종목을 검색하여 선택한 후, 매매 내역을 입력합니다.'} *는 필수 항목입니다.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4 max-h-[80vh] overflow-y-auto pr-6">
            {isStockSelected ? (
              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                {renderFormField("name", "종목명 *", true)}
                {renderFormField("symbol", "종목코드 *", true)}
                <Button type="button" variant="outline" onClick={resetStockSelection} disabled={isEditMode || !!initialStock}><X className="mr-2 h-4 w-4" />종목 변경</Button>
              </div>
            ) : (
              <Command ref={searchContainerRef} className="relative overflow-visible rounded-lg border">
                <div className="flex items-center px-3"><SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" /><CommandPrimitive.Input placeholder="종목명 또는 종목코드를 검색하세요..." value={searchQuery} onValueChange={setSearchQuery} onFocus={() => searchQuery.length > 0 && setIsListVisible(true)} className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none" /></div>
                {isListVisible && (<CommandList className="absolute top-full z-50 mt-1 w-full rounded-b-md border bg-popover text-popover-foreground shadow-md">{searchResults.length > 0 ? (<CommandGroup>{searchResults.map((stock) => (<CommandItem key={`${stock.symbol}-${stock.exchange}`} onSelect={() => handleStockSelect(stock)} value={`${stock.name} ${stock.symbol}`} className="py-2"><span>{stock.name}</span><Badge variant="outline" className="ml-2">{stock.exchange}</Badge><span className="ml-auto text-xs text-muted-foreground">{stock.symbol}</span></CommandItem>))}</CommandGroup>) : (<CommandEmpty>검색 결과가 없습니다.</CommandEmpty>)}</CommandList>)}
              </Command>
            )}
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">매수 정보</h3>
              <div className="grid grid-cols-3 gap-4">{renderPriceField("buyPrice", "매수가 *")}{renderFormField("buyQuantity", "매수량 *", false, "1", "number")}{renderDateField("buyDate", "매수일 *")}</div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">매수 근거</h3>
              <div className="space-y-2">
                <FormLabel>매수 근거 태그 (중복 O)</FormLabel>
                <Controller control={control} name="rationaleTags" render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {RATIONALE_TAGS.map((tag) => {
                      const isSelected = field.value?.includes(tag);
                      return (
                        <Button key={tag} type="button" variant={isSelected ? "default" : "outline"} size="sm" onClick={() => {
                          const newValue = isSelected ? (field.value || []).filter((value) => value !== tag) : [...(field.value || []), tag];
                          field.onChange(newValue);
                        }}>
                          #{tag}
                        </Button>
                      );
                    })}
                  </div>
                )}/>
              </div>
              <FormField control={control} name="rationale" render={({ field }) => (
                <FormItem>
                  <FormLabel>상세 근거</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea {...field} readOnly={!isRationaleEditing} className="h-32 resize-none pr-32" placeholder="태그를 선택한 후, 상세 근거를 작성해주세요." />
                      <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => setIsRationaleEditing(!isRationaleEditing)} disabled={(watchedRationaleTags?.length ?? 0) === 0}>
                        {isRationaleEditing ? (<><Save className="mr-2 h-4 w-4" /> 저장하기</>) : (<><Pencil className="mr-2 h-4 w-4" /> 작성하기</>)}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}/>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">매도 정보</h3>
              <div className="grid grid-cols-3 gap-4">{renderPriceField("sellPrice", "매도가")}{renderFormField("sellQuantity", "매도량", false, undefined, "number")}{renderDateField("sellDate", "매도일")}</div>
            </div>
            
            <div className="pt-4">
              <InfoMessage />
              <FormErrors />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>취소</Button>
              <Button type="submit" disabled={!isValid || !!infoMessage}>저장</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}