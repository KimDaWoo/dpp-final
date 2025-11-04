"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StockAnalysis } from '@/components/checklist/stock-analysis';

function ChecklistComponent() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get('symbol');

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>기업 분석 체크리스트</CardTitle>
          <CardDescription>
            선택된 종목: <span className="font-bold text-primary">{symbol || '없음'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {symbol ? <StockAnalysis symbol={symbol} /> : <p className="text-center text-muted-foreground">종목 분석 페이지에서 종목을 먼저 선택해주세요.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChecklistPage() {
  return (
    <Suspense fallback={<div className="text-center">로딩 중...</div>}>
      <ChecklistComponent />
    </Suspense>
  );
}
