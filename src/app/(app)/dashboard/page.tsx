"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/currency-context";
import { useFavorites } from "@/contexts/favorites-context";
import { useInvestmentPersonality } from "@/contexts/investment-personality-context";
import { OnboardingModal } from "@/components/survey/onboarding-modal";
import { Inbox, Star } from "lucide-react";
import { toast } from "sonner";

// StockSearch 컴포넌트는 모달을 포함하고 있으며, SSR을 비활성화해야 합니다.
const StockSearch = dynamic(
  () => import('@/components/trades/stock-search').then((mod) => mod.StockSearch),
  { ssr: false }
);

interface StockData {
  Symbol: string;
  Name: string;
  Sector: string;
  MarketCapitalization: number;
  Exchange: string; // Exchange 정보 추가
}

interface SelectedStockInfo {
  symbol: string;
  exchange: string | null;
}

export default function DashboardPage() {
  const { currency, formatCurrency } = useCurrency();
  const { favorites, removeFavorite } = useFavorites();
  const { personality, isLoading: isLoadingPersonality } = useInvestmentPersonality();

  const [favoritesData, setFavoritesData] = useState<StockData[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // 모달 상태 관리
  const [selectedStock, setSelectedStock] = useState<SelectedStockInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isCheckingUserSetup = isLoadingPersonality;

  useEffect(() => {
    if (!isCheckingUserSetup && !personality) {
      setShowOnboardingModal(true);
    }
  }, [personality, isCheckingUserSetup]);

  useEffect(() => {
    if (isCheckingUserSetup || favorites.length === 0) {
      setFavoritesData([]);
      setIsLoadingFavorites(false);
      return;
    }

    const fetchFavoritesData = async () => {
      setIsLoadingFavorites(true);
      const dataPromises = favorites.map((symbol) =>
        fetch(`/api/stock/${symbol}`).then((res) => res.json())
      );
      const results = await Promise.all(dataPromises);
      setFavoritesData(results.filter((d) => d && !d.error));
      setIsLoadingFavorites(false);
    };

    fetchFavoritesData();
  }, [favorites, isCheckingUserSetup]);

  const handleRemoveFavorite = (
    e: React.MouseEvent,
    symbolToRemove: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(symbolToRemove);
    toast.error(`${symbolToRemove}을(를) 관심 종목에서 제거했습니다.`);
  };

  // 모달 열기 핸들러
  const handleCardClick = (stock: StockData) => {
    setSelectedStock({ symbol: stock.Symbol, exchange: stock.Exchange });
    setIsModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStock(null);
  };

  if (isCheckingUserSetup) {
    return (
      <div className="text-center p-8">사용자 정보를 확인하는 중입니다...</div>
    );
  }

  return (
    <>
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
      />
      {/* 모달 기능을 위해 StockSearch 컴포넌트를 렌더링하지만, 검색 UI는 보이지 않도록 처리 */}
      <div className="hidden">
        <StockSearch
          selectedStock={selectedStock}
          isModalOpen={isModalOpen}
          onModalClose={handleModalClose}
          onSelectStock={() => {}} // 대시보드에서는 이 기능이 필요 없음
        />
      </div>

      <div className="space-y-24">
        <div>
          <h2 className="text-lg font-bold">관심 종목</h2>
          {isLoadingFavorites ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : favoritesData.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-3">
              {favoritesData.map((stock) => (
                <Card
                  key={stock.Symbol}
                  className="hover:bg-muted/50 transition-colors relative cursor-pointer"
                  onClick={() => handleCardClick(stock)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleRemoveFavorite(e, stock.Symbol)}
                    className="absolute top-2 right-2 z-10"
                  >
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  </Button>
                  <div className="flex flex-col h-full p-6">
                    <CardHeader className="p-0">
                      <CardTitle>
                        {stock.Name} ({stock.Symbol})
                      </CardTitle>
                      <CardDescription className="pt-2">
                        <Badge variant="outline">
                          {stock.Sector || "N/A"}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 mt-auto pt-4">
                      <p className="font-semibold">시가총액</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{currency}</Badge>
                        <span className="text-lg font-bold">
                          {formatCurrency(stock.MarketCapitalization, 'KRW')}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4"
              style={{ minHeight: "40vh" }}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">
                  아직 추가된 관심 종목이 없습니다.
                </h3>
                <p className="text-sm text-muted-foreground">
                  '종목 분석' 페이지에서 관심 있는 종목을 추가해보세요.
                </p>
                <Link href="/trades">
                  <Button className="mt-4">종목 분석하러 가기</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
