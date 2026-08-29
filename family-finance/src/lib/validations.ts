import { z } from "zod";

/**
 * Esquemas de validación con Zod. Se usan tanto en formularios (cliente) como
 * en la capa de servidor (Server Actions / API) para validar entradas.
 */

export const currencyAmountSchema = z
  .number({ invalid_type_error: "Debe ser un número" })
  .finite("Importe inválido");

export const incomeSchema = z.object({
  description: z.string().min(1, "La descripción es obligatoria").max(120),
  amount: currencyAmountSchema.positive("El importe debe ser positivo"),
  kind: z.enum(["RECURRING", "EXTRA", "ONE_OFF"]),
  memberId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  date: z.coerce.date(),
  extraPayments: z.number().int().min(0).max(14).default(0),
});
export type IncomeInput = z.infer<typeof incomeSchema>;

export const expenseSchema = z.object({
  description: z.string().min(1, "La descripción es obligatoria").max(120),
  amount: currencyAmountSchema.positive("El importe debe ser positivo"),
  categoryId: z.string().uuid().optional(),
  payerId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  date: z.coerce.date(),
  splitMode: z.enum(["PROPORTIONAL", "EQUAL", "CUSTOM", "PAYER_ONLY"]).default("PROPORTIONAL"),
  customBps: z.record(z.string().uuid(), z.number().int().min(0).max(10000)).optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(500).optional(),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const goalSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum([
    "EMERGENCY_FUND",
    "HOME_RENOVATION",
    "VACATION",
    "MORTGAGE_PREPAYMENT",
    "INVESTMENT",
    "VEHICLE",
    "CUSTOM",
  ]),
  target: currencyAmountSchema.positive(),
  current: currencyAmountSchema.min(0).default(0),
  monthlyContribution: currencyAmountSchema.min(0).default(0),
  targetDate: z.coerce.date().optional(),
});
export type GoalInput = z.infer<typeof goalSchema>;

export const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  period: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  amount: currencyAmountSchema.positive(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(0).max(12).default(0),
});
export type BudgetInput = z.infer<typeof budgetSchema>;

export const mortgagePrepaymentSchema = z.object({
  mortgageId: z.string().uuid(),
  amount: currencyAmountSchema.positive(),
});
export type MortgagePrepaymentInput = z.infer<typeof mortgagePrepaymentSchema>;

export const csvRowSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1),
  amount: z.coerce.number().finite(),
  category: z.string().optional(),
});
export type CsvRow = z.infer<typeof csvRowSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;
