'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { VolumeRankCarousel } from '@/components/trades/volume-rank-carousel';

// StockSearch 컴포넌트는 클라이언트에서만 렌더링되어야 하므로, SSR을 비활성화하여 동적으로 가져옵니다.
const StockSearch = dynamic(
  () => import('@/components/trades/stock-search').then((mod) => mod.StockSearch),
  { 
    ssr: false,
    loading: () => <Skeleton className="w-full h-12 rounded-lg" />,
  }
);

interface SelectedStockInfo {
  symbol: string;
  exchange: string | null;
}

export default function TradesClient() {
  const [selectedStock, setSelectedStock] = useState<SelectedStockInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectStock = (stock: SelectedStockInfo) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStock(null);
  };

  return (
    <div className="flex flex-col space-y-74">
      {/* 상단 영역: 종목 검색 */}
      <div className="pb-6">
        <h2 className="text-lg font-semibold mb-3">종목 검색</h2>
        <StockSearch 
          selectedStock={selectedStock}
          isModalOpen={isModalOpen}
          onModalClose={handleModalClose}
          onSelectStock={(symbol) => handleSelectStock({ symbol, exchange: null })}
        />
      </div>

      {/* 하단 영역: 거래량 순위 (남은 공간 모두 차지) */}
      <div className="relative pb-4 min-w-0 flex flex-col">
        <h2 className="text-lg font-semibold mb-3">거래량 순위 TOP 30</h2>
        <VolumeRankCarousel onSelectStock={handleSelectStock} />
      </div>
    </div>
  );
}
