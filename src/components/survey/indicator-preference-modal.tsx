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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IndicatorPreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIndicators?: IndicatorKey[];
}

export function IndicatorPreferenceModal({
  isOpen,
  onClose,
  initialIndicators = [],
}: IndicatorPreferenceModalProps) {
  const { setPreferences } = useIndicatorPreferences();
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorKey[]>([]);

  useEffect(() => {
    if (isOpen) {
      const combinedIndicators = Array.from(new Set([...MANDATORY_INDICATORS, ...initialIndicators]));
      setSelectedIndicators(combinedIndicators);
    }
  }, [isOpen, initialIndicators]);

  const handleCheckboxChange = (indicator: IndicatorKey) => {
    setSelectedIndicators((prev) =>
      prev.includes(indicator)
        ? prev.filter((item) => item !== indicator)
        : [...prev, indicator]
    );
  };

  const handleSubmit = () => {
    const finalIndicators = Array.from(new Set([...MANDATORY_INDICATORS, ...selectedIndicators]));
    setPreferences(finalIndicators);
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
          <DialogTitle>선호 지표 설정</DialogTitle>
          <DialogDescription>
            종목 분석 시 우선적으로 참고할 투자 지표를 선택해주세요.
          </DialogDescription>
        </DialogHeader>
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
                    checked={selectedIndicators.includes(key)}
                    onCheckedChange={() => !isMandatory && handleCheckboxChange(key)}
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
                            <Label htmlFor={key} className="cursor-not-allowed text-muted-foreground">
                              {AVAILABLE_INDICATORS[key]}
                            </Label>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p>필수 지표는 항상 포함됩니다.</p></TooltipContent>
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
          <Button onClick={handleSubmit}>설정 완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
