import { auth } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { handleSignIn } from "@/lib/actions";

export default async function PublicPage() {
  const session = await auth();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 mb-4">
        <Image src="/logo.svg" alt="Trading Journal Logo" width={40} height={40} />
        <h1 className="text-4xl font-bold">사전 거래 분석 및 관리 도구</h1>
      </div>
      <p className="text-xl text-muted-foreground mb-8">
        감정적 매매를 배제하고 원칙에 기반한 트레이딩을 돕습니다.
      </p>
      
      {session?.user ? (
        // 로그인된 경우: 대시보드로 이동하는 버튼 표시
        <Button asChild size="lg">
          <Link href="/dashboard">대시보드로 이동</Link>
        </Button>
      ) : (
        // 로그인되지 않은 경우: 로그인 버튼 표시
        <form action={handleSignIn}>
          <Button variant="outline" size="lg">GitHub 계정으로 시작하기</Button>
        </form>
      )}
    </div>
  );
}