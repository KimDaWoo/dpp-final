import { StockSearch } from "@/components/trades/stock-search";

export default function TradesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">종목 분석</h1>
      <p className="text-muted-foreground">
        분석하고 싶은 종목을 선택하여 사전 분석 체크리스트를 작성하세요.
      </p>
      <StockSearch />
    </div>
  );
}