import type { Money } from "./money";
import {
  savingsRate,
  housingRatio,
  emergencyFundMonths,
  budgetDeviation,
} from "./finance";

export type AlertType =
  | "BUDGET_EXCEEDED"
  | "LOW_SAVINGS_RATE"
  | "HIGH_HOUSING_RATIO"
  | "LOW_EMERGENCY_FUND"
  | "UNDERUSED_SUBSCRIPTION";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface Alert {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  context: Record<string, number | string>;
}

// Umbrales de negocio. Centralizados para poder ajustarlos fácilmente.
export const THRESHOLDS = {
  minSavingsRate: 0.2, // 20%
  maxHousingRatio: 0.35, // 35%
  minEmergencyMonths: 6,
} as const;

export interface AlertInputs {
  income: Money;
  expenses: Money;
  housingExpenses: Money;
  emergencyFund: Money;
  monthlyExpenses: Money;
  budgets: { category: string; budgeted: Money; actual: Money }[];
  subscriptions: { name: string; lastUsedDaysAgo: number; monthlyCents: number }[];
}

/** Motor de reglas que evalúa la salud financiera y emite alertas. */
export function evaluateAlerts(input: AlertInputs): Alert[] {
  const alerts: Alert[] = [];

  // 1. Presupuesto superado por categoría.
  for (const b of input.budgets) {
    const dev = budgetDeviation(b.budgeted, b.actual);
    if (dev.overBudget) {
      alerts.push({
        type: "BUDGET_EXCEEDED",
        severity: dev.percent > 0.25 ? "CRITICAL" : "WARNING",
        title: `Presupuesto superado: ${b.category}`,
        message: `Has gastado ${b.actual.toString()} de ${b.budgeted.toString()} (${(dev.percent * 100).toFixed(0)}% por encima).`,
        context: { category: b.category, deviationPct: Number((dev.percent * 100).toFixed(1)) },
      });
    }
  }

  // 2. Tasa de ahorro por debajo del 20%.
  const rate = savingsRate(input.income, input.expenses);
  if (rate < THRESHOLDS.minSavingsRate) {
    alerts.push({
      type: "LOW_SAVINGS_RATE",
      severity: rate < 0.1 ? "CRITICAL" : "WARNING",
      title: "Tasa de ahorro baja",
      message: `Tu tasa de ahorro es del ${(rate * 100).toFixed(1)}%, por debajo del objetivo del 20%.`,
      context: { savingsRatePct: Number((rate * 100).toFixed(1)) },
    });
  }

  // 3. Gasto de vivienda superior al 35% de los ingresos.
  const housing = housingRatio(input.housingExpenses, input.income);
  if (housing > THRESHOLDS.maxHousingRatio) {
    alerts.push({
      type: "HIGH_HOUSING_RATIO",
      severity: housing > 0.45 ? "CRITICAL" : "WARNING",
      title: "Gasto de vivienda elevado",
      message: `La vivienda supone el ${(housing * 100).toFixed(1)}% de tus ingresos (umbral recomendado: 35%).`,
      context: { housingRatioPct: Number((housing * 100).toFixed(1)) },
    });
  }

  // 4. Fondo de emergencia inferior a 6 meses de gastos.
  const months = emergencyFundMonths(input.emergencyFund, input.monthlyExpenses);
  if (months < THRESHOLDS.minEmergencyMonths) {
    alerts.push({
      type: "LOW_EMERGENCY_FUND",
      severity: months < 3 ? "CRITICAL" : "WARNING",
      title: "Fondo de emergencia insuficiente",
      message: `Tu fondo cubre ${months.toFixed(1)} meses de gastos (recomendado: 6 meses).`,
      context: { emergencyMonths: Number(months.toFixed(1)) },
    });
  }

  // 5. Suscripciones infrautilizadas (>60 días sin uso).
  for (const s of input.subscriptions) {
    if (s.lastUsedDaysAgo > 60) {
      alerts.push({
        type: "UNDERUSED_SUBSCRIPTION",
        severity: "INFO",
        title: `Suscripción infrautilizada: ${s.name}`,
        message: `No usas ${s.name} desde hace ${s.lastUsedDaysAgo} días. Cuesta ${(s.monthlyCents / 100).toFixed(2)} €/mes.`,
        context: { subscription: s.name, daysUnused: s.lastUsedDaysAgo },
      });
    }
  }

  return alerts;
}
