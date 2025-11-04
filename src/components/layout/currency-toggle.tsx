"use client";

import { useCurrency } from '@/contexts/currency-context';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function CurrencyToggle() {
  const { currency, toggleCurrency, exchangeRate } = useCurrency();

  if (!exchangeRate) {
    return null; // 환율 정보가 로드되기 전에는 버튼을 숨김
  }

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="currency-switch" className={currency === 'USD' ? 'font-bold text-primary' : 'text-muted-foreground'}>USD</Label>
      <Switch
        id="currency-switch"
        checked={currency === 'KRW'}
        onCheckedChange={toggleCurrency}
      />
      <Label htmlFor="currency-switch" className={currency === 'KRW' ? 'font-bold text-primary' : 'text-muted-foreground'}>KRW</Label>
    </div>
  );
}
