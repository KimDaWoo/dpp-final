import Link from "next/link";

export function SideNav() {
  return (
    <nav className="flex flex-col gap-4">
      <Link href="/dashboard" className="font-bold">Dashboard</Link>
      <Link href="/checklist" className="text-muted-foreground">Checklist</Link>
      <Link href="/trades" className="text-muted-foreground">Trades</Link>
      <Link href="/mistakes" className="text-muted-foreground">Mistakes</Link>
    </nav>
  );
}
