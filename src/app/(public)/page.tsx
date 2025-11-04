import { UserMenu } from "@/components/layout/user-menu";

export default function PublicPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">사전 거래 분석 및 관리 도구</h1>
      <p className="text-xl text-muted-foreground mb-8">
        감정적 매매를 배제하고 원칙에 기반한 트레이딩을 돕습니다.
      </p>
      <UserMenu />
    </div>
  );
}
