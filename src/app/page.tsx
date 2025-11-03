import { UserMenu } from "@/components/layout/user-menu";
import { auth } from "@/auth";

export default async function PublicPage() {
  const session = await auth();
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