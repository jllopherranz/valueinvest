import type { Money } from "./money";

/** Tasa de ahorro = (ingresos - gastos) / ingresos. Devuelve 0-1. */
export function savingsRate(income: Money, expenses: Money): number {
  if (income.isZero() || income.isNegative()) return 0;
  const saved = Number(income.subtract(expenses).cents);
  return saved / Number(income.cents);
}

/** Ahorro mensual absoluto. */
export function monthlySavings(income: Money, expenses: Money): Money {
  return income.subtract(expenses);
}

/** Patrimonio neto = activos - pasivos. */
export function netWorth(assets: Money, liabilities: Money): Money {
  return assets.subtract(liabilities);
}

/** Ratio de gasto de vivienda sobre ingresos (0-1). */
export function housingRatio(housingExpenses: Money, income: Money): number {
  if (income.isZero() || income.isNegative()) return 0;
  return Number(housingExpenses.cents) / Number(income.cents);
}

/** Ratio de endeudamiento = deuda total / activos (0-1). */
export function debtRatio(totalDebt: Money, totalAssets: Money): number {
  if (totalAssets.isZero() || totalAssets.isNegative()) return 0;
  return Number(totalDebt.cents) / Number(totalAssets.cents);
}

/** Meses de gastos cubiertos por el fondo de emergencia. */
export function emergencyFundMonths(fund: Money, monthlyExpenses: Money): number {
  if (monthlyExpenses.isZero() || monthlyExpenses.isNegative()) return 0;
  return Number(fund.cents) / Number(monthlyExpenses.cents);
}

export interface GoalProgress {
  progress: number; // 0-1
  remaining: Money;
  monthsToTarget: number | null;
  estimatedDate: Date | null;
}

/** Progreso de un objetivo y fecha estimada de cumplimiento. */
export function goalProgress(
  current: Money,
  target: Money,
  monthlyContribution: Money,
  from: Date = new Date()
): GoalProgress {
  const progress =
    target.isZero() || target.isNegative()
      ? 1
      : Math.min(1, Number(current.cents) / Number(target.cents));
  const remaining = target.subtract(current);

  let monthsToTarget: number | null = null;
  let estimatedDate: Date | null = null;

  if (remaining.cents > 0n && monthlyContribution.cents > 0n) {
    monthsToTarget = Math.ceil(Number(remaining.cents) / Number(monthlyContribution.cents));
    estimatedDate = new Date(from);
    estimatedDate.setMonth(estimatedDate.getMonth() + monthsToTarget);
  } else if (remaining.cents <= 0n) {
    monthsToTarget = 0;
    estimatedDate = from;
  }

  return { progress, remaining, monthsToTarget, estimatedDate };
}

export interface BudgetDeviation {
  absolute: Money; // real - presupuestado (positivo = sobregasto)
  percent: number; // desviación relativa (0.1 = +10%)
  overBudget: boolean;
}

/** Desviación de un presupuesto frente al gasto real. */
export function budgetDeviation(budgeted: Money, actual: Money): BudgetDeviation {
  const absolute = actual.subtract(budgeted);
  const percent =
    budgeted.isZero() || budgeted.isNegative()
      ? actual.isZero()
        ? 0
        : 1
      : Number(absolute.cents) / Number(budgeted.cents);
  return { absolute, percent, overBudget: absolute.cents > 0n };
}
