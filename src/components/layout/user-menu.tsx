"use client";

import { Button } from "@/components/ui/button";
import { handleSignIn, handleSignOut } from "@/lib/actions";
import type { Session } from "next-auth";

export function UserMenu({ session }: { session: Session | null }) {
  const handleLogout = async () => {
    // Clear user-specific data from localStorage
    localStorage.removeItem("investmentPersonality");
    localStorage.removeItem("investmentAnswers");
    localStorage.removeItem("preferredIndicators");

    // Clear the session-specific onboarding flag
    if (session?.user?.email) {
      sessionStorage.removeItem(`onboardingModalSeen-${session.user.email}`);
    }

    // Call the server action to sign out
    await handleSignOut();
  };

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {session.user?.email}
        </span>
        <form action={handleLogout}>
          <Button variant="outline">로그아웃</Button>
        </form>
      </div>
    );
  }

  return (
    <form action={handleSignIn}>
      <Button variant="outline">로그인</Button>
    </form>
  );
}
