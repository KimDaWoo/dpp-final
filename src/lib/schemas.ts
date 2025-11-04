import { z } from "zod";

export const ChecklistSchema = z.object({
  entry: z.coerce.number().positive(),
  stop: z.coerce.number().positive(),
  target: z.coerce.number().positive(),
  qty: z.coerce.number().int().positive(),
  acct: z.coerce.number().positive(),
  maxRiskPct: z.coerce.number().min(0.1).max(5),
});

export const JournalEntrySchema = z.object({
  symbol: z.string().min(1, "종목을 입력해주세요."),
  entryPrice: z.coerce.number().positive("매수가는 0보다 커야 합니다."),
  exitPrice: z.coerce.number().positive("매도가는 0보다 커야 합니다."),
  quantity: z.coerce.number().int().positive("수량은 0보다 커야 합니다."),
  notes: z.string().min(10, "최소 10자 이상의 복기 노트를 작성해주세요.").optional(),
});
