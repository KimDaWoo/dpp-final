"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dontAskAgain: boolean) => void;
}

export function TradeConfirmationModal({ isOpen, onClose, onConfirm }: TradeConfirmationModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleConfirm = () => {
    onConfirm(dontAskAgain);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>매매 기록 저장</DialogTitle>
          <DialogDescription>
            실제 거래를 진행하기 전에, 현재 종목과 가격으로 매매 기록을 저장하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 my-4">
          <Checkbox 
            id="dont-ask-again" 
            checked={dontAskAgain}
            onCheckedChange={(checked) => setDontAskAgain(!!checked)}
          />
          <Label htmlFor="dont-ask-again">다시 묻지 않기</Label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            아니오
          </Button>
          <Button type="button" onClick={handleConfirm}>
            예, 저장합니다
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
