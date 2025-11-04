"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const quizQuestions = [
  {
    question: "투자 원금이 50% 손실될 경우 어떻게 대응하시겠습니까?",
    options: [
      { text: "즉시 손절하여 추가 손실을 막는다.", score: -1 },
      { text: "기다렸다가 원금이 회복되면 매도한다.", score: 0 },
      { text: "오히려 좋은 기회라 생각하고 추가 매수한다.", score: 1 },
    ],
  },
  {
    question: "다음 중 가장 선호하는 투자 방식은 무엇입니까?",
    options: [
      { text: "은행 예금처럼 안정적이지만 수익률이 낮은 상품", score: -1 },
      { text: "어느 정도의 위험을 감수하는 시장 평균 수익률의 인덱스 펀드", score: 0 },
      { text: "높은 위험을 감수하더라도 큰 수익을 기대할 수 있는 개별 성장주", score: 1 },
    ],
  },
  {
    question: "투자를 결정할 때 가장 중요하게 생각하는 요소는 무엇입니까?",
    options: [
      { text: "회사의 재무 안정성 및 배당", score: -1 },
      { text: "현재 시장의 트렌드와 인기", score: 1 },
      { text: "둘 다 적절히 고려한다.", score: 0 },
    ],
  },
];

export default function QuizPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  
  const handleAnswerChange = (questionIndex: number, score: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = score;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (answers.includes(null)) {
      toast.error("모든 질문에 답변해주세요.");
      return;
    }

    const totalScore = answers.reduce((acc, val) => acc + (val || 0), 0);
    const investmentType = totalScore >= 1 ? 'aggressive' : 'conservative';
    
    localStorage.setItem('investmentType', investmentType);
    toast.success(`분석 완료! 회원님은 '${investmentType === 'aggressive' ? '공격적' : '보수적'}' 투자자입니다.`);
    router.push('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>투자 성향 분석</CardTitle>
          <CardDescription>나의 투자 스타일을 알아보기 위해 몇 가지 질문에 답변해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {quizQuestions.map((q, index) => (
            <div key={index}>
              <p className="font-semibold mb-4">{index + 1}. {q.question}</p>
              <RadioGroup onValueChange={(value) => handleAnswerChange(index, parseInt(value))}>
                {q.options.map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={opt.score.toString()} id={`q${index}-opt${optIndex}`} />
                    <Label htmlFor={`q${index}-opt${optIndex}`}>{opt.text}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
          <Button onClick={handleSubmit} className="w-full">분석 완료</Button>
        </CardContent>
      </Card>
    </div>
  );
}
