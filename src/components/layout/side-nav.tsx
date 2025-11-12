"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BarChart3, ClipboardList, UserCircle } from "lucide-react";

const links = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "종목 분석", href: "/trades", icon: BarChart3 },
  { name: "매매 복기", href: "/mistakes", icon: ClipboardList },
  { name: "매매 분석", href: "/analysis", icon: BarChart3 },
  { name: "마이페이지", href: "/mypage", icon: UserCircle },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              { "bg-muted text-primary": pathname === link.href }
            )}
          >
            <Icon className="h-4 w-4" />
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
