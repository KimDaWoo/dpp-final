"use client";

import { useState } from 'react';
import { useTradeLog, TradeLog } from '@/contexts/trade-log-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";
import { Trash2, Edit, PlusCircle, MinusCircle, DollarSign } from 'lucide-react';
import { AddTradeLogModal } from '@/components/trades/add-trade-log-modal';
import { cn } from "@/lib/utils";
import { useCurrency } from '@/contexts/currency-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export default function MistakesPage() {
  const { tradeLogs, deleteTradeLog } = useTradeLog();
  const { currency, exchangeRate } = useCurrency();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TradeLog | undefined>(undefined);

  const handleDelete = (id: string) => {
    deleteTradeLog(id);
    toast.error("매매 기록을 삭제했습니다.");
  };
  
  const handleEdit = (log: TradeLog) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedLog(undefined);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedLog(undefined);
  }

  const NoDataIcon = () => <MinusCircle className="h-4 w-4 text-muted-foreground mx-auto" />;

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return null;
    
    let displayValue = value;
    if (currency === 'USD' && exchangeRate) {
      displayValue = value / exchangeRate;
    }
    
    return Number(displayValue).toLocaleString(undefined, { 
      maximumFractionDigits: currency === 'USD' ? 2 : 0 
    });
  };

  const CurrencyHeader = ({ title }: { title: string }) => (
    <div className="flex items-center justify-center gap-2">
      <span>{title}</span>
      <div className="flex items-center justify-center p-1 rounded-md bg-muted text-muted-foreground">
        {currency === 'KRW' ? (
          <span className="font-sans font-semibold text-xs">₩</span>
        ) : (
          <DollarSign className="h-3 w-3" />
        )}
      </div>
    </div>
  );

  const RationaleCell = ({ log }: { log: TradeLog }) => {
    const tags = log.rationaleTags;
    const rationale = log.rationale;

    if (!tags || tags.length === 0) {
      return <NoDataIcon />;
    }

    const displayTag = `#${tags[0]}`;
    const remainingCount = tags.length - 1;
    const displayText = remainingCount > 0 ? `${displayTag} 외 ${remainingCount}` : displayTag;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="cursor-pointer text-sm">{displayText}</Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs shadow-lg rounded-lg p-4 bg-background border">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground">태그</h4>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
                </div>
              </div>
              {rationale && (
                <div>
                  <hr className="my-2" />
                  <h4 className="text-sm font-semibold mb-2 text-foreground">상세 근거</h4>
                  <p className="text-sm text-muted-foreground">{rationale}</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-bold">매매 복기 노트</h1>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          직접 입력
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>나의 매매 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종목명</TableHead>
                <TableHead>매수일</TableHead>
                <TableHead className="text-center"><CurrencyHeader title="매수가" /></TableHead>
                <TableHead className="text-center">매수량</TableHead>
                <TableHead className="text-center">매도일</TableHead>
                <TableHead className="text-center"><CurrencyHeader title="매도가" /></TableHead>
                <TableHead className="text-center">매도량</TableHead>
                <TableHead className="text-center">수익률</TableHead>
                <TableHead className="text-center">매수 근거</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tradeLogs.length > 0 ? (
                tradeLogs.map((log) => {
                  const profitRate = log.profitRate;
                  const isProfitable = profitRate != null && profitRate >= 0;
                  const profitColor = profitRate == null ? '' : isProfitable ? 'text-green-500' : 'text-red-500';

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.name} ({log.symbol})</TableCell>
                      <TableCell>{log.buyDate}</TableCell>
                      <TableCell className="text-center">{formatNumber(log.buyPrice)}</TableCell>
                      <TableCell className="text-center">{log.buyQuantity}</TableCell>
                      <TableCell className="text-center">{log.sellDate || <NoDataIcon />}</TableCell>
                      <TableCell className="text-center">{formatNumber(log.sellPrice) || <NoDataIcon />}</TableCell>
                      <TableCell className="text-center">{log.sellQuantity || <NoDataIcon />}</TableCell>
                      <TableCell className={cn("text-center", profitColor)}>
                        {profitRate != null ? `${profitRate.toFixed(2)}%` : <NoDataIcon />}
                      </TableCell>
                      <TableCell className="text-center">
                        <RationaleCell log={log} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(log)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">기록된 매매가 없습니다.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddTradeLogModal 
        isOpen={modalOpen} 
        onClose={closeModal}
        tradeLog={selectedLog}
      />
    </div>
  );
}