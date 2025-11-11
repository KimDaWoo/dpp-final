"use client";

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { JournalEntrySchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";
import { Trash2 } from 'lucide-react';

type JournalEntryFormValues = z.infer<typeof JournalEntrySchema>;

export default function MistakesPage() {
  const [entries, setEntries] = useState<JournalEntryFormValues[]>([]);

  useEffect(() => {
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(JournalEntrySchema as any),
    defaultValues: {
      symbol: '',
      entryPrice: 0,
      exitPrice: 0,
      quantity: 0,
      notes: '',
    },
  });

  const onSubmit: SubmitHandler<JournalEntryFormValues> = (data) => {
    const newEntries = [...entries, data];
    setEntries(newEntries);
    localStorage.setItem('journalEntries', JSON.stringify(newEntries));
    form.reset();
    toast.success("매매 기록이 성공적으로 저장되었습니다.");
  };

  const deleteEntry = (indexToDelete: number) => {
    const newEntries = entries.filter((_, index) => index !== indexToDelete);
    setEntries(newEntries);
    localStorage.setItem('journalEntries', JSON.stringify(newEntries));
    toast.error("매매 기록을 삭제했습니다.");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>매매 복기 노트 작성</CardTitle>
          <CardDescription>자신의 매매를 기록하고 분석하여 성장하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="symbol" render={({ field }) => <FormItem><FormLabel>종목</FormLabel><FormControl><Input placeholder="예: AAPL" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="entryPrice" render={({ field }) => <FormItem><FormLabel>매수가</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="exitPrice" render={({ field }) => <FormItem><FormLabel>매도가</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="quantity" render={({ field }) => <FormItem><FormLabel>수량</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>매매 복기</FormLabel><FormControl><Textarea placeholder="매매 근거, 잘한 점, 아쉬운 점 등을 기록하세요." {...field} /></FormControl><FormMessage /></FormItem>} />
              <Button type="submit">기록 저장</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>나의 매매 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종목</TableHead>
                <TableHead>매수가</TableHead>
                <TableHead>매도가</TableHead>
                <TableHead>수량</TableHead>
                <TableHead>수익률</TableHead>
                <TableHead className="text-right">삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length > 0 ? (
                entries.map((entry, index) => {
                  const profitPct = ((entry.exitPrice - entry.entryPrice) / entry.entryPrice) * 100;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{entry.symbol.toUpperCase()}</TableCell>
                      <TableCell>${entry.entryPrice.toFixed(2)}</TableCell>
                      <TableCell>${entry.exitPrice.toFixed(2)}</TableCell>
                      <TableCell>{entry.quantity}</TableCell>
                      <TableCell className={profitPct >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {profitPct.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteEntry(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">기록된 매매가 없습니다.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}