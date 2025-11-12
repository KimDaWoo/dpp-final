"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { OnboardingModal } from "@/components/survey/onboarding-modal";
import { useInvestmentPersonality } from "@/contexts/investment-personality-context";
import { useIndicatorPreferences } from "@/contexts/indicator-preference-context";
import { useOnboarding } from "@/contexts/onboarding-context";

export function AuthWatcher() {
  const { status } = useSession();
  const [isModalOpen, setModalOpen] = useState(false);
  const { personality, answers, isLoading: personalityLoading } = useInvestmentPersonality();
  const { preferences, isLoading: preferencesLoading } = useIndicatorPreferences();
  const { hasSeenModal, setHasSeenModal } = useOnboarding();

  useEffect(() => {
    // Show modal only if authenticated, contexts are loaded, AND the modal hasn't been seen in this session.
    if (status === "authenticated" && !personalityLoading && !preferencesLoading && !hasSeenModal) {
      setModalOpen(true);
    }
  }, [status, personalityLoading, preferencesLoading, hasSeenModal]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setHasSeenModal(true); // Mark as seen for this session
  };

  // Loading or no session, don't render anything
  if (status !== "authenticated" || personalityLoading || preferencesLoading) {
    return null;
  }

  return (
    <OnboardingModal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      initialAnswers={answers ?? undefined}
      initialIndicators={preferences ?? undefined}
    />
  );
}
