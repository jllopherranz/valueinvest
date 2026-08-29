import { Money, distributeByBps } from "./money";

export type SplitMode = "PROPORTIONAL" | "EQUAL" | "CUSTOM" | "PAYER_ONLY";

export interface MemberShare {
  memberId: string;
  /** Cuota en puntos básicos (68,7% = 6870). */
  shareBps: number;
}

export interface AllocationResult {
  memberId: string;
  amount: Money;
  shareBps: number;
}

/**
 * Calcula la cuota proporcional de cada miembro a partir de sus ingresos
 * anuales. Devuelve puntos básicos que suman 10.000 (100%).
 *
 * Para los ingresos del enunciado:
 *   Persona 1: 44.800 € -> 6871 bps (68,71%)
 *   Persona 2: 20.400 € -> 3129 bps (31,29%)
 */
export function computeSharesFromIncomes(
  incomes: { memberId: string; annualCents: bigint }[]
): MemberShare[] {
  const total = incomes.reduce((a, b) => a + b.annualCents, 0n);
  if (total === 0n) {
    // Reparto igualitario si no hay ingresos registrados.
    const bps = Math.floor(10_000 / incomes.length);
    return incomes.map((i) => ({ memberId: i.memberId, shareBps: bps }));
  }

  // Reparte 10.000 bps con el método del mayor resto para que sumen exactamente 100%.
  const raw = incomes.map((i) => ({
    memberId: i.memberId,
    exact: (Number(i.annualCents) * 10_000) / Number(total),
  }));
  const floored = raw.map((r) => ({ ...r, bps: Math.floor(r.exact) }));
  const assigned = floored.reduce((a, b) => a + b.bps, 0);
  const remainder = 10_000 - assigned;

  const byRemainder = [...floored].sort(
    (a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact))
  );
  for (let k = 0; k < remainder; k++) {
    byRemainder[k % byRemainder.length]!.bps += 1;
  }

  return floored.map((f) => ({ memberId: f.memberId, shareBps: f.bps }));
}

/**
 * Reparte un gasto entre miembros según el modo elegido. El resultado siempre
 * suma exactamente el importe del gasto.
 */
export function allocateExpense(
  amount: Money,
  mode: SplitMode,
  members: MemberShare[],
  options?: { payerId?: string; customBps?: Record<string, number> }
): AllocationResult[] {
  if (members.length === 0) return [];

  switch (mode) {
    case "PAYER_ONLY": {
      const payerId = options?.payerId ?? members[0]!.memberId;
      return members.map((m) => ({
        memberId: m.memberId,
        amount: m.memberId === payerId ? amount : Money.zero(amount.currency),
        shareBps: m.memberId === payerId ? 10_000 : 0,
      }));
    }
    case "EQUAL": {
      const weights = members.map(() => 1);
      const parts = distributeByBps(amount, weights);
      const equalBps = Math.round(10_000 / members.length);
      return members.map((m, i) => ({
        memberId: m.memberId,
        amount: parts[i]!,
        shareBps: equalBps,
      }));
    }
    case "CUSTOM": {
      const custom = options?.customBps ?? {};
      const weights = members.map((m) => custom[m.memberId] ?? 0);
      const parts = distributeByBps(amount, weights);
      return members.map((m, i) => ({
        memberId: m.memberId,
        amount: parts[i]!,
        shareBps: weights[i]!,
      }));
    }
    case "PROPORTIONAL":
    default: {
      const weights = members.map((m) => m.shareBps);
      const parts = distributeByBps(amount, weights);
      return members.map((m, i) => ({
        memberId: m.memberId,
        amount: parts[i]!,
        shareBps: m.shareBps,
      }));
    }
  }
}
