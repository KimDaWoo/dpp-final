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
  BPS: "BPS (주당순자산가치)",
  FOREIGNER_RATIO: "외국인 소진율 (%)",
};

export type IndicatorKey = keyof typeof AVAILABLE_INDICATORS;

// 필수 지표 정의
export const MANDATORY_INDICATORS: IndicatorKey[] = ['EPS', 'PBR'];

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
      let finalPreferences: IndicatorKey[];

      if (storedPreferences) {
        const parsedPreferences = JSON.parse(storedPreferences) as IndicatorKey[];
        // Set을 사용하여 중복을 제거하고 필수 지표를 합침
        finalPreferences = Array.from(new Set([...MANDATORY_INDICATORS, ...parsedPreferences]));
      } else {
        // 저장된 설정이 없으면 필수 지표만 사용
        finalPreferences = [...MANDATORY_INDICATORS];
      }
      setPreferences(finalPreferences);
    } catch (error) {
      console.error(
        "Failed to load indicator preferences from localStorage",
        error
      );
      // 에러 발생 시 필수 지표로 대체
      setPreferences([...MANDATORY_INDICATORS]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSetPreferences = (newPreferences: IndicatorKey[]) => {
    try {
      // 저장 시에도 항상 필수 지표가 포함되도록 보장
      const finalPreferences = Array.from(new Set([...MANDATORY_INDICATORS, ...newPreferences]));
      localStorage.setItem(
        "preferredIndicators",
        JSON.stringify(finalPreferences)
      );
      setPreferences(finalPreferences);
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
