"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  useInvestmentPersonality,
  InvestmentPersonality,
} from "@/contexts/investment-personality-context";

const questions = [
  {
    question: "당신의 나이는?",
    options: [
      { text: "~ 44세", score: 5 },
      { text: "45 - 55세", score: 4 },
      { text: "56 - 65세", score: 3 },
      { text: "66 - 75세", score: 2 },
      { text: "76세 ~", score: 1 },
    ],
  },
  {
    question: "당신의 투자 기간은?",
    options: [
      { text: "20년 이상", score: 5 },
      { text: "11 - 19년", score: 4 },
      { text: "6 - 10년", score: 3 },
      { text: "1 - 5년", score: 2 },
      { text: "1년 이내", score: 1 },
    ],
  },
  {
    question: "당신이 우선 고려 하는 투자는?",
    options: [
      { text: "무조건 수익률 우선", score: 5 },
      { text: "원금보전 고려하나 수익률 우선", score: 4 },
      { text: "수익률과 원금보전 동일하게 고려", score: 3 },
      { text: "수익률 고려하나 원금보전 우선", score: 2 },
      { text: "어떤 경우라도 원금보전 우선", score: 1 },
    ],
  },
  {
    question: "정상적인 주식시장상황에서 이번 투자에서 기대하는 수익은?",
    options: [
      { text: "시장 수익률은 상회해야 한다", score: 5 },
      { text: "시장수익률 수준은 따라가야 한다", score: 4 },
      { text: "시장 수익률 하회해도 평균적인 수익은 내야", score: 3 },
      { text: "어느 정도의 안정성과 평균적인 수익은 내야", score: 2 },
      { text: "안정성이 확보되면서 약간의 수익은 내야", score: 1 },
    ],
  },
  {
    question: "향후 10년간 주식시장 침체가 예상될 때 나의 투자성과는?",
    options: [
      { text: "꽤 괜찮은 수익을 기대한다", score: 5 },
      { text: "부진할 수 있다", score: 4 },
      { text: "약간의 수익은 나야 한다", score: 3 },
      { text: "원금 수준은 유지해야 한다", score: 2 },
      { text: "어떤 경우라도 수익이 나야 한다", score: 1 },
    ],
  },
  {
    question: "향후 3년 투자시 투자성과에 대한 당신의 생각은?",
    options: [
      { text: "원금 손실가능성 인정", score: 5 },
      { text: "대부분의 손실은 감내 가능", score: 4 },
      { text: "약간의 손실은 감내 가능", score: 3 },
      { text: "어떤 손실도 감내 어려움", score: 2 },
      { text: "약간의 수익이라도 내야", score: 1 },
    ],
  },
  {
    question: "향후 3개월 투자시 투자손실에 대한 당신의 생각은?",
    options: [
      { text: "시장변화에 크게 신경 쓰지 않는다", score: 5 },
      { text: "20% 이상 손실발생시 걱정한다", score: 4 },
      { text: "10% 이상 손실발생시 걱정한다", score: 3 },
      { text: "작은 시장변화는 감내한다", score: 2 },
      { text: "어떤 투자손실도 견디기 힘들다", score: 1 },
    ],
  },
];

interface QuizProps {
  onComplete: () => void;
  initialAnswers?: (number | null)[];
}

export function InvestmentPersonalityQuiz({ onComplete, initialAnswers }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const { setPersonalityData } = useInvestmentPersonality();

  useEffect(() => {
    if (initialAnswers && initialAnswers.length === questions.length) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  const handleAnswer = (questionIndex: number, score: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = score;
    setAnswers(newAnswers);
  };

  const calculatePersonality = () => {
    const totalScore = answers.reduce((acc, val) => (acc ?? 0) + (val || 0), 0) ?? 0;
    let personality: InvestmentPersonality;

    if (totalScore <= 10) {
      personality = "conservative";
    } else if (totalScore <= 24) {
      personality = "moderate";
    } else {
      personality = "aggressive";
    }
    
    setPersonalityData(answers, personality);
    onComplete();
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isAllAnswered = answers.every((answer) => answer !== null);
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Card className="border-none shadow-none p-0">
      <CardContent className="p-0">
        <div className="space-y-6">
          <div key={currentQuestionIndex}>
            <p className="font-medium mb-3 text-sm">
              {`${currentQuestionIndex + 1}. ${currentQuestion.question}`}
              <span className="text-muted-foreground ml-2 font-normal">
                ({currentQuestionIndex + 1}/{questions.length})
              </span>
            </p>
            <RadioGroup
              onValueChange={(value) => handleAnswer(currentQuestionIndex, parseInt(value))}
              value={answers[currentQuestionIndex]?.toString()}
            >
              {currentQuestion.options.map((option) => (
                <div key={option.score} className="flex items-center space-x-2 py-1">
                  <RadioGroupItem value={option.score.toString()} id={`q${currentQuestionIndex}-o${option.score}`} />
                  <Label htmlFor={`q${currentQuestionIndex}-o${option.score}`} className="font-normal cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-0 pt-6 flex justify-between items-center">
        {currentQuestionIndex > 0 ? (
          <Button onClick={handlePrev} variant="outline">
            이전
          </Button>
        ) : (
          <div />
        )}

        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={handleNext} disabled={answers[currentQuestionIndex] === null}>
            다음
          </Button>
        ) : (
          <Button onClick={calculatePersonality} disabled={!isAllAnswered}>
            완료
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}