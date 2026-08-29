/**
 * Construye el modelo de datos del dashboard a partir de las constantes de
 * ejemplo y la capa de dominio. Permite renderizar el panel sin depender de la
 * base de datos (modo demo); en producción estos cálculos se alimentan de
 * consultas a Prisma con la misma lógica de dominio.
 */
import { Money } from "@/domain/money";
import {
  savingsRate,
  monthlySavings,
  netWorth,
  housingRatio,
  emergencyFundMonths,
} from "@/domain/finance";
import { evaluateAlerts } from "@/domain/alerts";
import { computeSharesFromIncomes } from "@/domain/allocation";
import {
  SEED_MEMBERS,
  SEED_FIXED_EXPENSES,
  SEED_ACCOUNTS,
  SEED_GOALS,
  SYSTEM_CATEGORIES,
} from "@/lib/constants";

const m = (units: number) => Money.fromUnits(units);

export interface DashboardModel {
  netWorth: number;
  monthlySavings: number;
  savingsRatePct: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  housingRatioPct: number;
  emergencyMonths: number;
  expensesByCategory: { name: string; value: number; color: string }[];
  netWorthSeries: { month: string; value: number }[];
  savingsSeries: { month: string; income: number; expenses: number; savings: number }[];
  byMember: { name: string; value: number; color: string }[];
  goals: { name: string; current: number; target: number; progressPct: number }[];
  alerts: { type: string; severity: string; title: string; message: string }[];
}

export function buildDashboardModel(): DashboardModel {
  const monthlyIncome = SEED_MEMBERS.reduce((s, x) => s + x.monthlyNetSalary, 0);
  const income = m(monthlyIncome);

  const monthlyExpensesUnits = SEED_FIXED_EXPENSES.reduce((s, e) => s + e.monthly, 0);
  const expenses = m(monthlyExpensesUnits);

  const housingUnits = SEED_FIXED_EXPENSES.filter((e) => e.isHousing).reduce(
    (s, e) => s + e.monthly,
    0
  );

  const assets = m(SEED_ACCOUNTS.filter((a) => !a.isLiability).reduce((s, a) => s + a.balance, 0));
  const liabilities = m(
    Math.abs(SEED_ACCOUNTS.filter((a) => a.isLiability).reduce((s, a) => s + a.balance, 0))
  );

  const emergencyGoal = SEED_GOALS.find((g) => g.type === "EMERGENCY_FUND");
  const emergencyFund = m(emergencyGoal?.current ?? 0);

  // Reparto proporcional por miembro sobre el gasto mensual.
  const shares = computeSharesFromIncomes(
    SEED_MEMBERS.map((x) => ({ memberId: x.key, annualCents: BigInt(x.annualIncome * 100) }))
  );
  const byMember = SEED_MEMBERS.map((member) => {
    const bps = shares.find((s) => s.memberId === member.key)?.shareBps ?? 5000;
    return {
      name: member.name,
      value: Number((monthlyExpensesUnits * bps) / 10000),
      color: member.color,
    };
  });

  // Gasto por categoría.
  const colorBySlug = new Map<string, { name: string; color: string }>(
    SYSTEM_CATEGORIES.map((c) => [c.slug, { name: c.name, color: c.color }])
  );
  const catTotals = new Map<string, number>();
  for (const e of SEED_FIXED_EXPENSES) {
    catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + e.monthly);
  }
  const expensesByCategory = [...catTotals.entries()]
    .map(([slug, value]) => ({
      name: colorBySlug.get(slug)?.name ?? slug,
      value: Math.round(value * 100) / 100,
      color: colorBySlug.get(slug)?.color ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);

  // Series temporales simuladas (12 meses) con ligera tendencia al alza.
  const months = ["Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun"];
  const baseNetWorth = netWorth(assets, liabilities).toUnits();
  const netWorthSeries = months.map((month, i) => ({
    month,
    value: Math.round(baseNetWorth - (11 - i) * 1500),
  }));
  const savingsSeries = months.map((month, i) => {
    const inc = monthlyIncome + (i % 6 === 5 ? 3200 : 0); // pagas extra cada 6 meses aprox.
    const exp = monthlyExpensesUnits + ((i * 37) % 400);
    return {
      month,
      income: Math.round(inc),
      expenses: Math.round(exp),
      savings: Math.round(inc - exp),
    };
  });

  const goals = SEED_GOALS.map((g) => ({
    name: g.name,
    current: g.current,
    target: g.target,
    progressPct: Math.round((g.current / g.target) * 100),
  }));

  const alerts = evaluateAlerts({
    income,
    expenses,
    housingExpenses: m(housingUnits),
    emergencyFund,
    monthlyExpenses: expenses,
    budgets: [{ category: "Alimentación", budgeted: m(600), actual: m(680) }],
    subscriptions: [{ name: "Gimnasio", lastUsedDaysAgo: 75, monthlyCents: 3500 }],
  }).map((a) => ({ type: a.type, severity: a.severity, title: a.title, message: a.message }));

  return {
    netWorth: netWorth(assets, liabilities).toUnits(),
    monthlySavings: monthlySavings(income, expenses).toUnits(),
    savingsRatePct: savingsRate(income, expenses) * 100,
    monthlyExpenses: expenses.toUnits(),
    monthlyIncome,
    housingRatioPct: housingRatio(m(housingUnits), income) * 100,
    emergencyMonths: emergencyFundMonths(emergencyFund, expenses),
    expensesByCategory,
    netWorthSeries,
    savingsSeries,
    byMember,
    goals,
    alerts,
  };
}
