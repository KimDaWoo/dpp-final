"use client";

import { Button } from "@/components/ui/button";
import { handleSignIn, handleSignOut } from "@/lib/actions";
import type { Session } from "next-auth";

export function UserMenu({ session }: { session: Session | null }) {
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {session.user?.email}
        </span>
        <form action={handleSignOut}>
          <Button variant="secondary">Sign out</Button>
        </form>
      </div>
    );
  }

  return (
    <form action={handleSignIn}>
      <Button variant="outline">Sign in</Button>
    </form>
  );
}
