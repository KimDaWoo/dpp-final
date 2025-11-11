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
  MANDATORY_INDICATORS,
} from "@/contexts/indicator-preference-context";
import { toast } from "sonner";
import { InvestmentPersonalityQuiz } from "./investment-personality-quiz";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIndicators?: IndicatorKey[];
  initialAnswers?: (number | null)[];
  initialStep?: "quiz" | "indicators";
}

export function OnboardingModal({
  isOpen,
  onClose,
  initialIndicators = [],
  initialAnswers,
  initialStep = "quiz",
}: OnboardingModalProps) {
  const [step, setStep] = useState<"quiz" | "indicators">(initialStep);
  const { setPreferences } = useIndicatorPreferences();
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorKey[]>(
    [] // Initialize with an empty array, will be updated in useEffect
  );

  useEffect(() => {
    if (isOpen) {
      // Ensure mandatory indicators are always included in the local state
      const combinedIndicators = Array.from(new Set([...MANDATORY_INDICATORS, ...initialIndicators]));
      setSelectedIndicators(combinedIndicators);
      setStep(initialStep);
    }
  }, [isOpen, initialIndicators, initialStep]);

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
    // The setPreferences function in the context already handles merging mandatory indicators.
    // So, we just pass the currently selected (non-mandatory) indicators.
    // However, to be safe, let's ensure mandatory ones are in the list being submitted.
    const finalIndicatorsToSubmit = Array.from(new Set([...MANDATORY_INDICATORS, ...selectedIndicators]));

    if (finalIndicatorsToSubmit.length === 0) { // This check might be redundant if mandatory are always there
      toast.warning("하나 이상의 선호 지표를 선택해주세요.");
      return;
    }
    setPreferences(finalIndicatorsToSubmit);
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
              <TooltipProvider>
                {(Object.keys(AVAILABLE_INDICATORS) as IndicatorKey[])
                  .sort((a, b) => {
                    const aIsMandatory = MANDATORY_INDICATORS.includes(a);
                    const bIsMandatory = MANDATORY_INDICATORS.includes(b);
                    if (aIsMandatory && !bIsMandatory) return -1;
                    if (!aIsMandatory && bIsMandatory) return 1;
                    return AVAILABLE_INDICATORS[a].localeCompare(AVAILABLE_INDICATORS[b]);
                  })
                  .map((key) => {
                    const isMandatory = MANDATORY_INDICATORS.includes(key);
                    const checkbox = (
                      <Checkbox
                        id={key}
                        checked={selectedIndicators.includes(key)} // This is the key part
                        onCheckedChange={() =>
                          !isMandatory && handleIndicatorCheckboxChange(key)
                        }
                        disabled={isMandatory}
                      />
                    );

                    return (
                      <div key={key} className="flex items-center space-x-2">
                        {isMandatory ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center space-x-2">
                                {checkbox}
                                <Label
                                  htmlFor={key}
                                  className="cursor-not-allowed text-muted-foreground"
                                >
                                  {AVAILABLE_INDICATORS[key]}
                                </Label>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>필수 지표는 항상 포함됩니다.</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <> 
                            {checkbox}
                            <Label htmlFor={key} className="cursor-pointer">
                              {AVAILABLE_INDICATORS[key]}
                            </Label>
                          </>
                        )}
                      </div>
                    );
                  })}
              </TooltipProvider>
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