import { SideNav } from "@/components/layout/side-nav";
import { MainNav } from "@/components/layout/main-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { CurrencyToggle } from "@/components/layout/currency-toggle";
import Link from "next/link";
import Image from "next/image"; // Image 컴포넌트 임포트
import { auth } from "@/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Image src="/logo.svg" alt="Trading Journal Logo" width={24} height={24} />
              <span>Trading Journal</span>
            </Link>
          </div>
          <div className="flex-1">
            <SideNav />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
            <MainNav />
          </div>
          <CurrencyToggle />
          <UserMenu session={session} />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
