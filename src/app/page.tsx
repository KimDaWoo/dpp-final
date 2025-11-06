import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/layout/user-menu";

export default async function PublicPage() {
  const session = await auth();

  // 사용자가 로그인 상태이면 대시보드로 리디렉션
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Trading Journal</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Pre-trade checklist and mistake analysis.
      </p>
      <UserMenu session={session} />
    </div>
  );
}