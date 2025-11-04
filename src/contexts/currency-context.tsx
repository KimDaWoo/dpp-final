"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Currency = 'USD' | 'KRW';

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number | null;
  toggleCurrency: () => void;
  formatCurrency: (value: number | null | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    // localStorage에서 저장된 통화 설정 불러오기
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }

    // 환율 정보 가져오기
    const fetchRate = async () => {
      try {
        const response = await fetch('/api/exchange-rate');
        const data = await response.json();
        if (data.rate) {
          setExchangeRate(data.rate);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate on load", error);
      }
    };
    fetchRate();
  }, []);

  const toggleCurrency = () => {
    const newCurrency = currency === 'USD' ? 'KRW' : 'USD';
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const formatCurrency = useCallback((value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';

    if (currency === 'KRW' && exchangeRate) {
      const krwValue = value * exchangeRate;
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(krwValue);
    }
    
    // USD
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, [currency, exchangeRate]);

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, toggleCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
