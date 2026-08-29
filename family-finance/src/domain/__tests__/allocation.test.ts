import { describe, it, expect } from "vitest";
import { Money } from "@/domain/money";
import { computeSharesFromIncomes, allocateExpense } from "@/domain/allocation";

const p1 = "p1";
const p2 = "p2";

describe("computeSharesFromIncomes", () => {
  it("calcula el reparto proporcional del enunciado (68,7% / 31,3%)", () => {
    const shares = computeSharesFromIncomes([
      { memberId: p1, annualCents: 4_480_000n }, // 44.800 €
      { memberId: p2, annualCents: 2_040_000n }, // 20.400 €
    ]);
    const byId = Object.fromEntries(shares.map((s) => [s.memberId, s.shareBps]));
    expect(byId[p1]).toBe(6871); // 68,71%
    expect(byId[p2]).toBe(3129); // 31,29%
    expect(byId[p1]! + byId[p2]!).toBe(10000);
  });

  it("reparte igualitariamente si no hay ingresos", () => {
    const shares = computeSharesFromIncomes([
      { memberId: p1, annualCents: 0n },
      { memberId: p2, annualCents: 0n },
    ]);
    expect(shares.every((s) => s.shareBps === 5000)).toBe(true);
  });
});

describe("allocateExpense", () => {
  const members = [
    { memberId: p1, shareBps: 6871 },
    { memberId: p2, shareBps: 3129 },
  ];

  it("reparto PROPORCIONAL suma exactamente el gasto", () => {
    const result = allocateExpense(Money.fromUnits(1700), "PROPORTIONAL", members);
    const sum = result.reduce((a, r) => a + r.amount.cents, 0n);
    expect(sum).toBe(170000n);
    expect(result[0]!.amount.toUnits()).toBeCloseTo(1168.07, 2);
  });

  it("reparto EQUAL divide a partes iguales", () => {
    const result = allocateExpense(Money.fromUnits(100), "EQUAL", members);
    expect(result[0]!.amount.toUnits()).toBe(50);
    expect(result[1]!.amount.toUnits()).toBe(50);
  });

  it("reparto PAYER_ONLY imputa todo al pagador", () => {
    const result = allocateExpense(Money.fromUnits(100), "PAYER_ONLY", members, { payerId: p2 });
    expect(result.find((r) => r.memberId === p2)!.amount.toUnits()).toBe(100);
    expect(result.find((r) => r.memberId === p1)!.amount.toUnits()).toBe(0);
  });

  it("reparto CUSTOM respeta los pesos indicados", () => {
    const result = allocateExpense(Money.fromUnits(200), "CUSTOM", members, {
      customBps: { [p1]: 7500, [p2]: 2500 },
    });
    expect(result.find((r) => r.memberId === p1)!.amount.toUnits()).toBe(150);
    expect(result.find((r) => r.memberId === p2)!.amount.toUnits()).toBe(50);
  });
});
