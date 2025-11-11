"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// 사용 가능한 지표 목록 정의
export const AVAILABLE_INDICATORS = {
  PER: "PER (주가수익비율)",
  PBR: "PBR (주가순자산비율)",
  EPS: "EPS (주당순이익)",
  W52_HIGH_RATIO: "52주 최고가 대비 하락률",
};

export type IndicatorKey = keyof typeof AVAILABLE_INDICATORS;

interface IndicatorPreferenceContextType {
  preferences: IndicatorKey[] | null;
  setPreferences: (preferences: IndicatorKey[]) => void;
  isLoading: boolean;
}

const IndicatorPreferenceContext = createContext<
  IndicatorPreferenceContextType | undefined
>(undefined);

export function IndicatorPreferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState<IndicatorKey[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedPreferences = localStorage.getItem("preferredIndicators");
      if (storedPreferences) {
        const parsedPreferences = JSON.parse(storedPreferences);
        if (Array.isArray(parsedPreferences) && parsedPreferences.length > 0) {
          setPreferences(parsedPreferences);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load indicator preferences from localStorage",
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSetPreferences = (newPreferences: IndicatorKey[]) => {
    try {
      localStorage.setItem(
        "preferredIndicators",
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
    } catch (error) {
      console.error(
        "Failed to save indicator preferences to localStorage",
        error
      );
    }
  };

  return (
    <IndicatorPreferenceContext.Provider
      value={{
        preferences,
        setPreferences: handleSetPreferences,
        isLoading,
      }}
    >
      {children}
    </IndicatorPreferenceContext.Provider>
  );
}

export function useIndicatorPreferences() {
  const context = useContext(IndicatorPreferenceContext);
  if (context === undefined) {
    throw new Error(
      "useIndicatorPreferences must be used within an IndicatorPreferenceProvider"
    );
  }
  return context;
}
