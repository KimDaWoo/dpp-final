"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RateData {
  hts_kor_isnm: string;
  bond_mnrt_prpr: string;
  prdy_vrss_sign: string;
  bond_mnrt_prdy_vrss: string;
  prdy_ctrt?: string; // 국내 금리용
  bstp_nmix_prdy_ctrt?: string; // 해외 금리용
}

interface ApiResponse {
  output1: RateData[]; // 국내
  output2: RateData[]; // 해외
  stck_bsop_date: string;
}

const ChangeIcon = ({ sign }: { sign: string }) => {
  if (sign === '2') return <ArrowUp className="h-4 w-4 text-red-500" />;
  if (sign === '5') return <ArrowDown className="h-4 w-4 text-blue-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const RateTable = ({ title, data, marketType }: { title: string, data: RateData[], marketType: 'domestic' | 'foreign' }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>지표명</TableHead>
            <TableHead className="text-right">현재가 (%)</TableHead>
            <TableHead className="text-right">전일대비</TableHead>
            <TableHead className="text-right">등락률 (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((rate) => (
            <TableRow key={rate.hts_kor_isnm}>
              <TableCell className="font-medium">{rate.hts_kor_isnm}</TableCell>
              <TableCell className="text-right font-mono">{parseFloat(rate.bond_mnrt_prpr).toFixed(3)}</TableCell>
              <TableCell className="text-right font-mono flex items-center justify-end gap-1">
                <ChangeIcon sign={rate.prdy_vrss_sign} />
                {parseFloat(rate.bond_mnrt_prdy_vrss).toFixed(3)}
              </TableCell>
              <TableCell className={`text-right font-mono ${rate.prdy_vrss_sign === '2' ? 'text-red-500' : rate.prdy_vrss_sign === '5' ? 'text-blue-500' : ''}`}>
                {parseFloat(rate.prdy_ctrt || rate.bstp_nmix_prdy_ctrt || '0').toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export function InterestRateDisplay() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/interest-rate');
        if (!response.ok) {
          throw new Error('금리 정보를 불러오는데 실패했습니다.');
        }
        const result = await response.json();
        if (result.rt_cd !== '0') {
          throw new Error(result.msg1 || 'API에서 오류가 발생했습니다.');
        }
        setData({ ...result, stck_bsop_date: result.output1?.[0]?.stck_bsop_date });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data || (!data.output1 && !data.output2)) {
    return (
      <Card className="col-span-full">
        <CardHeader><CardTitle>금리 정보</CardTitle></CardHeader>
        <CardContent>
          <p className="text-red-500">{error || '데이터를 불러올 수 없습니다.'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
       <div className="flex items-center gap-2 mb-3">
         <h2 className="text-lg font-bold">주요 금리 정보</h2>
         {data.stck_bsop_date && <Badge variant="outline">기준일: {data.stck_bsop_date}</Badge>}
       </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data.output2 && <RateTable title="국내 주요 금리" data={data.output2} marketType="domestic" />}
        {data.output1 && <RateTable title="해외 주요 금리" data={data.output1} marketType="foreign" />}
      </div>
    </div>
  );
}
