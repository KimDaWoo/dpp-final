"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AVAILABLE_INDICATORS, IndicatorKey } from "@/contexts/indicator-preference-context";

interface IndicatorHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INDICATOR_DESCRIPTIONS: Record<IndicatorKey, { title: string; description: string }> = {
  PER: {
    title: "PER (주가수익비율)",
    description: "주가를 주당순이익(EPS)으로 나눈 값입니다. 기업이 벌어들이는 이익에 비해 주가가 고평가인지 저평가인지 판단하는 지표입니다. 낮을수록 저평가로 간주됩니다.",
  },
  PBR: {
    title: "PBR (주가순자산비율)",
    description: "주가를 주당순자산(BPS)으로 나눈 값입니다. 기업의 순자산에 비해 주가가 얼마나 높게 평가되었는지를 나타냅니다. 1에 가까울수록 주가가 자산 가치와 비슷하다고 봅니다.",
  },
  EPS: {
    title: "EPS (주당순이익)",
    description: "기업의 순이익을 총 발행 주식 수로 나눈 값입니다. 1주당 얼마의 이익을 창출했는지를 나타내며, 기업의 수익성과 성장성을 보여주는 핵심 지표입니다.",
  },
  W52_HIGH_RATIO: {
    title: "52주 최고가 대비 하락률",
    description: "현재 주가가 최근 1년(52주) 동안의 최고가에 비해 얼마나 하락했는지를 보여주는 비율입니다. 주가의 현재 위치를 파악하는 데 사용됩니다.",
  },
  BPS: {
    title: "BPS (주당순자산가치)",
    description: "기업의 총자산에서 부채를 뺀 순자산을 총 발행 주식 수로 나눈 값입니다. 1주당 얼마의 순자산을 가지고 있는지를 나타내며, 기업의 재무 안정성을 평가하는 지표입니다.",
  },
  FOREIGNER_RATIO: {
    title: "외국인 소진율 (%)",
    description: "외국인 투자자가 보유할 수 있는 주식 한도 대비 현재 얼마나 많은 주식을 보유하고 있는지를 나타내는 비율입니다. 외국인 수급 동향을 파악하는 데 참고할 수 있습니다.",
  },
};


export function IndicatorHelpModal({ isOpen, onClose }: IndicatorHelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>투자 지표 안내</DialogTitle>
          <DialogDescription>
            각 투자 지표의 의미는 다음과 같습니다.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full pr-4">
          <div className="space-y-4">
            {(Object.keys(AVAILABLE_INDICATORS) as IndicatorKey[]).map((key) => (
              <div key={key}>
                <h4 className="font-semibold text-sm">{INDICATOR_DESCRIPTIONS[key].title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {INDICATOR_DESCRIPTIONS[key].description}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
