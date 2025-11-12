"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface OnboardingContextType {
  hasSeenModal: boolean;
  setHasSeenModal: (seen: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasSeenModal, setHasSeenModal] = useState(false);

  return (
    <OnboardingContext.Provider value={{ hasSeenModal, setHasSeenModal }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
