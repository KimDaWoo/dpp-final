import { UserMenu } from "@/components/layout/user-menu";

export default function PublicPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Trading Journal</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Pre-trade checklist and mistake analysis.
      </p>
      <UserMenu />
    </div>
  );
}
