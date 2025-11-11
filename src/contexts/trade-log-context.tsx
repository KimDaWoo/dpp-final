"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 매매 기록 데이터 구조 정의
export interface TradeLog {
  id: string; // 각 로그의 고유 ID
  symbol: string;
  name: string;
  buyPrice: number;
  buyQuantity: number;
  buyDate: string; // "YYYY-MM-DD"
  sellPrice?: number;
  sellQuantity?: number;
  sellDate?: string; // "YYYY-MM-DD"
  profitRate?: number;
}

// Context에서 제공할 값들의 타입 정의
interface TradeLogContextType {
  tradeLogs: TradeLog[];
  addTradeLog: (log: Omit<TradeLog, 'id' | 'profitRate'>) => void;
  updateTradeLog: (id: string, log: Partial<TradeLog>) => void;
  deleteTradeLog: (id: string) => void;
}

// Context 생성
const TradeLogContext = createContext<TradeLogContextType | undefined>(undefined);

// TradeLogProvider 컴포넌트
export const TradeLogProvider = ({ children }: { children: ReactNode }) => {
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);

  // 컴포넌트 마운트 시 localStorage에서 데이터 불러오기
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('tradeLogs');
      if (savedLogs) {
        setTradeLogs(JSON.parse(savedLogs));
      }
    } catch (error) {
      console.error("Failed to load trade logs from localStorage", error);
    }
  }, []);

  // tradeLogs 상태 변경 시 localStorage에 저장하기
  useEffect(() => {
    try {
      localStorage.setItem('tradeLogs', JSON.stringify(tradeLogs));
    } catch (error) {
      console.error("Failed to save trade logs to localStorage", error);
    }
  }, [tradeLogs]);

  // 수익률 계산 함수
  const calculateProfitRate = (log: Partial<TradeLog>): number | undefined => {
    if (
      log.buyPrice != null &&
      log.buyQuantity != null &&
      log.sellPrice != null &&
      log.sellQuantity != null &&
      log.buyPrice > 0 &&
      log.buyQuantity > 0
    ) {
      const totalBuy = log.buyPrice * log.buyQuantity;
      const totalSell = log.sellPrice * log.sellQuantity;
      return ((totalSell - totalBuy) / totalBuy) * 100;
    }
    return undefined;
  };

  // 매매 기록 추가
  const addTradeLog = (log: Omit<TradeLog, 'id' | 'profitRate'>) => {
    setTradeLogs(prevLogs => {
      const newLog: TradeLog = {
        ...log,
        id: new Date().toISOString() + Math.random(), // 고유 ID 생성
        profitRate: calculateProfitRate(log),
      };
      return [...prevLogs, newLog];
    });
  };

  // 매매 기록 수정
  const updateTradeLog = (id: string, updatedFields: Partial<TradeLog>) => {
    setTradeLogs(prevLogs =>
      prevLogs.map(log => {
        if (log.id === id) {
          const updatedLog = { ...log, ...updatedFields };
          updatedLog.profitRate = calculateProfitRate(updatedLog);
          return updatedLog;
        }
        return log;
      })
    );
  };

  // 매매 기록 삭제
  const deleteTradeLog = (id: string) => {
    setTradeLogs(prevLogs => prevLogs.filter(log => log.id !== id));
  };

  const value = {
    tradeLogs,
    addTradeLog,
    updateTradeLog,
    deleteTradeLog,
  };

  return (
    <TradeLogContext.Provider value={value}>
      {children}
    </TradeLogContext.Provider>
  );
};

// 커스텀 훅
export const useTradeLog = () => {
  const context = useContext(TradeLogContext);
  if (context === undefined) {
    throw new Error('useTradeLog must be used within a TradeLogProvider');
  }
  return context;
};
