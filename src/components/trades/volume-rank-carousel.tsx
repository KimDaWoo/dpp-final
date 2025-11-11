'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useCurrency } from '@/contexts/currency-context';

// 거래량 순위 API 응답 데이터 타입 정의
interface VolumeRankItem {
  hts_kor_isnm: string; // 한글 종목명
  mksc_shrn_iscd: string; // 종목코드
  data_rank: string; // 순위
  stck_prpr: string; // 현재가
  prdy_vrss_sign: string; // 전일 대비 부호 (1:상한, 2:상승, 3:보합, 4:하한, 5:하락)
  prdy_ctrt: string; // 전일 대비율
  exchange: string; // 소속 시장
}

// 전일 대비 부호에 따른 스타일을 반환하는 함수
const getPriceChangeClassName = (sign: string) => {
  switch (sign) {
    case '1': case '2': return 'text-red-500';
    case '4': case '5': return 'text-blue-500';
    default: return 'text-gray-500';
  }
};

// 전일 대비 부호를 아이콘/텍스트로 변환하는 함수
const formatPriceChange = (sign: string, changeRate: string) => {
  switch (sign) {
    case '1': case '2': return `↑ ${changeRate}%`;
    case '4': case '5': return `↓ ${changeRate}%`;
    default: return `${changeRate}%`;
  }
};

// 배열을 주어진 크기로 나누는 헬퍼 함수
function chunk<T>(array: T[], size: number): T[][] {
  if (!array.length) {
    return [];
  }
  const head = array.slice(0, size);
  const tail = array.slice(size);
  return [head, ...chunk(tail, size)];
}

export function VolumeRankCarousel({ onSelectStock }: { onSelectStock: (stock: { symbol: string; exchange: string }) => void }) {
  const [volumeRank, setVolumeRank] = useState<VolumeRankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchVolumeRank = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/stock/volume-rank');
        if (!response.ok) throw new Error('Failed to fetch volume rank data');
        const data = await response.json();
        setVolumeRank(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVolumeRank();
  }, []);

  const groupedData = chunk(volumeRank, 2);

  if (isLoading) {
    return (
      <Carousel className="w-full">
        <CarouselContent>
          {Array.from({ length: 8 }).map((_, index) => (
            <CarouselItem key={index} className="basis-1/5 md:basis-1/6 lg:basis-1/8">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-[90px] w-full" />
                <Skeleton className="h-[90px] w-full" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (volumeRank.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-gray-500">거래량 순위 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Carousel
        opts={{ align: "start", loop: true }}
        className="w-full relative group overflow-hidden"
      >
        <CarouselContent className="-ml-2">
          {groupedData.map((group, index) => (
            <CarouselItem
              key={index}
              className="pl-2 basis-[20%] md:basis-[16.6667%] lg:basis-[12.5%] min-w-0"
            >
              <div className="flex flex-col gap-3">
                {group.map((stock) => (
                  <Card
                    key={stock.mksc_shrn_iscd}
                    className="cursor-pointer hover:bg-accent transition-colors py-4 px-2 overflow-hidden"
                    onClick={() => onSelectStock({ symbol: stock.mksc_shrn_iscd, exchange: stock.exchange })}
                  >
                    <CardContent className="py-1.5 px-2 min-w-0">
                      <div className="text-xs font-medium leading-snug flex items-center gap-1 min-w-0">
                        <span className="font-bold">{stock.data_rank}</span>
                        <span className="truncate" title={stock.hts_kor_isnm}>
                          {stock.hts_kor_isnm}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-base font-bold leading-tight">
                          {formatCurrency(Number((stock.stck_prpr || "0").replace(/,/g, "")), 'KRW')}
                        </p>
                        <p className={`text-xs leading-tight mt-1 ${getPriceChangeClassName(stock.prdy_vrss_sign)}`}>
                          {formatPriceChange(stock.prdy_vrss_sign, stock.prdy_ctrt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
  
        {/* 화살표: 호버 시에만 보이도록 오버레이 */}
        <CarouselPrevious
          className="
            absolute left-2 top-1/2 -translate-y-1/2 z-20
            opacity-0 group-hover:opacity-100 focus-visible:opacity-100
            pointer-events-none group-hover:pointer-events-auto
            transition-opacity duration-200
            h-8 w-8 rounded-full bg-background/80 backdrop-blur shadow
            hidden sm:flex
          "
        />
        <CarouselNext
          className="
            absolute right-2 top-1/2 -translate-y-1/2 z-20
            opacity-0 group-hover:opacity-100 focus-visible:opacity-100
            pointer-events-none group-hover:pointer-events-auto
            transition-opacity duration-200
            h-8 w-8 rounded-full bg-background/80 backdrop-blur shadow
            hidden sm:flex
          "
        />
  
        {/* (선택) 좌우 페이드 그라데이션: 호버 시 표시 */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </Carousel>
    </div>
  );
}
