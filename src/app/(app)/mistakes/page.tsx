"use client";

import { useState } from 'react';
import { useTradeLog } from '@/contexts/trade-log-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { AddTradeLogModal } from '@/components/trades/add-trade-log-modal';

export default function MistakesPage() {
  const { tradeLogs, deleteTradeLog } = useTradeLog();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteTradeLog(id);
    toast.error("매매 기록을 삭제했습니다.");
  };
  
  const handleEdit = (id: string) => {
    setEditingLogId(id);
    // TODO: Implement edit functionality by opening a pre-filled modal
    toast.info("수정 기능은 곧 구현될 예정입니다.");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">매매 복기 노트</h1>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
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
                <TableHead>매수가</TableHead>
                <TableHead>매수량</TableHead>
                <TableHead>매도일</TableHead>
                <TableHead>매도가</TableHead>
                <TableHead>매도량</TableHead>
                <TableHead>수익률</TableHead>
                <TableHead className="text-right">관리</TableHead>
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
                      <TableCell>{log.buyPrice.toLocaleString()}원</TableCell>
                      <TableCell>{log.buyQuantity}</TableCell>
                      <TableCell>{log.sellDate || 'N/A'}</TableCell>
                      <TableCell>{log.sellPrice != null ? `${log.sellPrice.toLocaleString()}원` : 'N/A'}</TableCell>
                      <TableCell>{log.sellQuantity || 'N/A'}</TableCell>
                      <TableCell className={profitColor}>
                        {profitRate != null ? `${profitRate.toFixed(2)}%` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(log.id)}>
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
                  <TableCell colSpan={9} className="text-center">기록된 매매가 없습니다.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddTradeLogModal 
        isOpen={isAddModalOpen} 
        onClose={() => setAddModalOpen(false)} 
      />
    </div>
  );
}