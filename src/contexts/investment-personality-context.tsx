"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type InvestmentPersonality = "conservative" | "moderate" | "aggressive";

export const personalityTextMap: Record<
  InvestmentPersonality,
  { title: string; description: string }
> = {
  conservative: {
    title: "안정형 (보수적 투자자)",
    description:
      "안정성을 최우선으로 생각하며, 원금 손실의 위험을 최소화하고자 합니다. 예금이나 채권과 같은 안전 자산에 대한 선호도가 높습니다.",
  },
  moderate: {
    title: "중립형 (균형 투자자)",
    description:
      "안정성과 수익성의 균형을 추구합니다. 위험을 감수하더라도 예금보다는 높은 수익을 기대할 수 있는 투자 상품에 관심을 가집니다.",
  },
  aggressive: {
    title: "공격형 (적극적 투자자)",
    description:
      "높은 위험을 감수하더라도 높은 수익률을 목표로 합니다. 주식과 같은 위험 자산에 대한 투자 비중이 높으며, 시장 변동성에 대한 이해도가 높습니다.",
  },
};

interface InvestmentPersonalityContextType {
  personality: InvestmentPersonality | null;
  answers: (number | null)[];
  setPersonalityData: (
    answers: (number | null)[],
    personality: InvestmentPersonality
  ) => void;
  isLoading: boolean;
  getPreferenceValues: () => { per: number; pbr: number; eps: number };
}

const InvestmentPersonalityContext = createContext<
  InvestmentPersonalityContextType | undefined
>(undefined);

export function InvestmentPersonalityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [personality, setPersonality] = useState<InvestmentPersonality | null>(
    null
  );
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedPersonality = localStorage.getItem("investmentPersonality");
      const storedAnswers = localStorage.getItem("investmentAnswers");

      if (storedPersonality) {
        setPersonality(JSON.parse(storedPersonality));
      } else {
        setPersonality("moderate"); // 기본값 설정
      }
      if (storedAnswers) {
        setAnswers(JSON.parse(storedAnswers));
      }
    } catch (error) {
      console.error("Failed to load personality data from localStorage", error);
      setPersonality("moderate"); // 에러 시 기본값 설정
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setPersonalityData = (
    newAnswers: (number | null)[],
    newPersonality: InvestmentPersonality
  ) => {
    try {
      localStorage.setItem("investmentAnswers", JSON.stringify(newAnswers));
      localStorage.setItem(
        "investmentPersonality",
        JSON.stringify(newPersonality)
      );
      setAnswers(newAnswers);
      setPersonality(newPersonality);
    } catch (error) {
      console.error("Failed to save personality data to localStorage", error);
    }
  };

  const getPreferenceValues = () => {
    switch (personality) {
      case "conservative":
        return { per: 10, pbr: 0.8, eps: 2000 };
      case "aggressive":
        return { per: 25, pbr: 2.0, eps: 1000 };
      case "moderate":
      default:
        return { per: 15, pbr: 1.2, eps: 1500 };
    }
  };

  return (
    <InvestmentPersonalityContext.Provider
      value={{ personality, answers, setPersonalityData, isLoading, getPreferenceValues }}
    >
      {children}
    </InvestmentPersonalityContext.Provider>
  );
}

export function useInvestmentPersonality() {
  const context = useContext(InvestmentPersonalityContext);
  if (context === undefined) {
    throw new Error(
      "useInvestmentPersonality must be used within an InvestmentPersonalityProvider"
    );
  }
  return context;
}