"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type InvestmentPersonality = "aggressive" | "moderate" | "conservative";

// 컨텍스트가 제공할 값의 타입 정의
interface InvestmentPersonalityContextType {
  personality: InvestmentPersonality | null;
  quizAnswers: number[] | null; // 퀴즈 답변을 저장할 상태
  setPersonality: (
    personality: InvestmentPersonality | null,
    answers: number[] | null
  ) => void;
  isLoading: boolean;
}

const InvestmentPersonalityContext =
  createContext<InvestmentPersonalityContextType | undefined>(undefined);

export const InvestmentPersonalityProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [personality, setPersonality] =
    useState<InvestmentPersonality | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[] | null>(null); // 퀴즈 답변 상태
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // 저장된 객체 전체를 불러옵니다.
      const item = window.localStorage.getItem("investmentProfile");
      if (item) {
        const profile = JSON.parse(item);
        setPersonality(profile.personality || null);
        setQuizAnswers(profile.answers || null);
      }
    } catch (error) {
      console.error("Failed to load investment profile from storage", error);
      setPersonality(null);
      setQuizAnswers(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 성향과 답변을 함께 저장하는 함수
  const handleSetPersonality = (
    newPersonality: InvestmentPersonality | null,
    newAnswers: number[] | null
  ) => {
    try {
      if (newPersonality && newAnswers) {
        // 성향과 답변을 하나의 객체로 묶어 저장
        const profile = { personality: newPersonality, answers: newAnswers };
        window.localStorage.setItem("investmentProfile", JSON.stringify(profile));
      } else {
        window.localStorage.removeItem("investmentProfile");
      }
      setPersonality(newPersonality);
      setQuizAnswers(newAnswers);
    } catch (error) {
      console.error("Failed to save investment profile to storage", error);
    }
  };

  return (
    <InvestmentPersonalityContext.Provider
      value={{
        personality,
        quizAnswers,
        setPersonality: handleSetPersonality,
        isLoading,
      }}
    >
      {children}
    </InvestmentPersonalityContext.Provider>
  );
};

export const useInvestmentPersonality = () => {
  const context = useContext(InvestmentPersonalityContext);
  if (context === undefined) {
    throw new Error(
      "useInvestmentPersonality must be used within a InvestmentPersonalityProvider"
    );
  }
  return context;
};
