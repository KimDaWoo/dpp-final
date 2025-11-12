"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useInvestmentPersonality } from "@/contexts/investment-personality-context";
import { useIndicatorPreferences } from "@/contexts/indicator-preference-context";
import { InvestmentPersonalityModal } from "../survey/investment-personality-modal";
import { IndicatorPreferenceModal } from "../survey/indicator-preference-modal";

export function OnboardingManager() {
  const { data: session, status } = useSession();
  const [isQuizModalOpen, setQuizModalOpen] = useState(false);
  const [isIndicatorModalOpen, setIndicatorModalOpen] = useState(false);
  
  const { answers, isLoading: personalityLoading } = useInvestmentPersonality();
  const { preferences, isLoading: preferencesLoading } = useIndicatorPreferences();

  useEffect(() => {
    // Trigger onboarding only if the user is logged in AND has never completed the personality quiz.
    // The source of truth is the presence of the 'investmentPersonality' key in localStorage.
    if (status === "authenticated" && !personalityLoading && !preferencesLoading) {
      const hasCompletedQuiz = localStorage.getItem("investmentPersonality");
      if (!hasCompletedQuiz) {
        setQuizModalOpen(true);
      }
    }
  }, [status, personalityLoading, preferencesLoading]);

  const handleCloseQuizModal = () => {
    setQuizModalOpen(false);
    // After the quiz, immediately open the indicator modal for the first-time setup.
    setIndicatorModalOpen(true);
  };

  const handleCloseIndicatorModal = () => {
    setIndicatorModalOpen(false);
  };

  if (status !== "authenticated" || personalityLoading || preferencesLoading) {
    return null;
  }

  return (
    <>
      <InvestmentPersonalityModal
        isOpen={isQuizModalOpen}
        onClose={handleCloseQuizModal}
        initialAnswers={answers ?? undefined}
      />
      <IndicatorPreferenceModal
        isOpen={isIndicatorModalOpen}
        onClose={handleCloseIndicatorModal}
        initialIndicators={preferences ?? undefined}
      />
    </>
  );
}
