"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useIndicatorPreferences,
  AVAILABLE_INDICATORS,
  IndicatorKey,
} from "@/contexts/indicator-preference-context";
import { toast } from "sonner";
import { InvestmentPersonalityQuiz } from "./investment-personality-quiz";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIndicators?: IndicatorKey[];
  initialAnswers?: (number | null)[];
}

export function OnboardingModal({
  isOpen,
  onClose,
  initialIndicators = [],
  initialAnswers,
}: OnboardingModalProps) {
  const [step, setStep] = useState<"quiz" | "indicators">("quiz");
  const { setPreferences } = useIndicatorPreferences();
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorKey[]>(
    initialIndicators
  );

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때마다 상태를 초기화합니다.
      setSelectedIndicators(initialIndicators);
      // 수정 시에는 항상 퀴즈부터 다시 시작합니다.
      setStep("quiz");
    }
  }, [isOpen, initialIndicators]);

  const handleQuizComplete = () => {
    setStep("indicators");
  };

  const handleIndicatorCheckboxChange = (indicator: IndicatorKey) => {
    setSelectedIndicators((prev) =>
      prev.includes(indicator)
        ? prev.filter((item) => item !== indicator)
        : [...prev, indicator]
    );
  };

  const handleIndicatorSubmit = () => {
    if (selectedIndicators.length === 0) {
      toast.warning("하나 이상의 선호 지표를 선택해주세요.");
      return;
    }
    setPreferences(selectedIndicators);
    toast.success("새로운 설정이 저장되었습니다!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {step === 'quiz' ? '투자 성향 분석 (1/2)' : '선호 지표 설정'}
          </DialogTitle>
          <DialogDescription>
            {step === 'quiz'
              ? '간단한 퀴즈를 통해 자신의 투자 스타일을 알아보세요.'
              : '종목 분석 시 우선적으로 참고할 투자 지표를 선택해주세요.'}
          </DialogDescription>
        </DialogHeader>

        {step === "quiz" ? (
          <InvestmentPersonalityQuiz
            onComplete={handleQuizComplete}
            initialAnswers={initialAnswers}
          />
        ) : (
          <>
            <div className="grid gap-4 py-4">
              {(Object.keys(AVAILABLE_INDICATORS) as IndicatorKey[]).map(
                (key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={selectedIndicators.includes(key)}
                      onCheckedChange={() => handleIndicatorCheckboxChange(key)}
                    />
                    <Label htmlFor={key} className="cursor-pointer">
                      {AVAILABLE_INDICATORS[key]}
                    </Label>
                  </div>
                )
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleIndicatorSubmit}>설정 완료</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
