"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InvestmentPersonalityQuiz } from "./investment-personality-quiz";

interface InvestmentPersonalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAnswers?: (number | null)[];
}

export function InvestmentPersonalityModal({
  isOpen,
  onClose,
  initialAnswers,
}: InvestmentPersonalityModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>투자 성향 분석</DialogTitle>
          <DialogDescription>
            간단한 퀴즈를 통해 자신의 투자 스타일을 알아보세요.
          </DialogDescription>
        </DialogHeader>
        <InvestmentPersonalityQuiz
          onComplete={onClose} // "결과 확인" 시 모달을 닫습니다.
          initialAnswers={initialAnswers}
        />
      </DialogContent>
    </Dialog>
  );
}
