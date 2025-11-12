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
    question: "투자에 대한 나의 지식수준은?",
    options: [
      { text: "금융투자상품에 투자해 본 경험이 거의 없으며, 지식이 부족하다.", score: 1 },
      { text: "주식, 펀드 등 금융투자상품의 구조 및 위험을 일정 수준 이해하고 있다.", score: 3 },
      { text: "금융투자상품에 대한 충분한 이해와 투자를 위한 지식을 갖추고 있다.", score: 5 },
    ],
  },
  {
    question: "나의 총 자산 중 금융상품이 차지하는 비중은?",
    options: [
      { text: "10% 미만", score: 1 },
      { text: "10% 이상 50% 미만", score: 3 },
      { text: "50% 이상", score: 5 },
    ],
  },
  {
    question: "투자 원금에 손실이 발생할 경우 나의 태도는?",
    options: [
      { text: "원금 손실은 절대 용납할 수 없다.", score: 1 },
      { text: "투자 원금 손실을 감수할 수 있으며, 손실이 발생해도 추가 투자가 가능하다.", score: 3 },
      { text: "기대수익이 높다면 위험이 높아도 상관없다.", score: 5 },
    ],
  },
  {
    question: "투자로 인한 손실 감내 수준은?",
    options: [
      { text: "5% 미만", score: 1 },
      { text: "5% 이상 15% 미만", score: 3 },
      { text: "15% 이상", score: 5 },
    ],
  },
];

interface QuizProps {
  onComplete: () => void;
  initialAnswers?: (number | null)[];
}

export function InvestmentPersonalityQuiz({ onComplete, initialAnswers }: QuizProps) {
  // Always initialize with a correctly-sized array of nulls to prevent the `[].every()` bug.
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const { setPersonalityData } = useInvestmentPersonality();

  // Sync with props from the context once they are loaded.
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

    if (totalScore <= 8) {
      personality = "conservative";
    } else if (totalScore <= 16) {
      personality = "moderate";
    } else {
      personality = "aggressive";
    }
    
    setPersonalityData(answers, personality);
    onComplete();
  };

  const isAllAnswered = answers.every((answer) => answer !== null);

  return (
    <Card className="border-none shadow-none p-0">
      <CardContent className="p-0">
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index}>
              <p className="font-medium mb-3 text-sm">{`${index + 1}. ${q.question}`}</p>
              <RadioGroup
                onValueChange={(value) => handleAnswer(index, parseInt(value))}
                value={answers[index]?.toString()}
              >
                {q.options.map((option) => (
                  <div key={option.score} className="flex items-center space-x-2 py-1">
                    <RadioGroupItem value={option.score.toString()} id={`q${index}-o${option.score}`} />
                    <Label htmlFor={`q${index}-o${option.score}`} className="font-normal cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-0 pt-6 flex">
        <Button onClick={calculatePersonality} disabled={!isAllAnswered} className="w-full">
          완료
        </Button>
      </CardFooter>
    </Card>
  );
}