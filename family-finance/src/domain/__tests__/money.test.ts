import { describe, it, expect } from "vitest";
import { Money, distributeByBps } from "@/domain/money";

describe("Money", () => {
  it("crea importes desde unidades sin errores de coma flotante", () => {
    expect(Money.fromUnits(1700.5).cents).toBe(170050n);
    expect(Money.fromUnits(0.1).add(Money.fromUnits(0.2)).toUnits()).toBe(0.3);
  });

  it("suma y resta manteniendo precisión", () => {
    const a = Money.fromUnits(3200);
    const b = Money.fromUnits(1700);
    expect(a.add(b).toUnits()).toBe(4900);
    expect(a.subtract(b).toUnits()).toBe(1500);
  });

  it("aplica porcentajes en puntos básicos", () => {
    const total = Money.fromUnits(1000);
    expect(total.applyBps(6871).toUnits()).toBeCloseTo(687.1, 2);
  });

  it("rechaza operar divisas distintas", () => {
    expect(() => Money.fromUnits(1, "EUR").add(Money.fromUnits(1, "USD"))).toThrow();
  });
});

describe("distributeByBps", () => {
  it("reparte sin perder ni inventar céntimos", () => {
    const total = Money.fromUnits(100);
    const parts = distributeByBps(total, [6871, 3129]);
    const sum = parts.reduce((a, p) => a + p.cents, 0n);
    expect(sum).toBe(total.cents);
  });

  it("reparte un importe indivisible asignando el remanente", () => {
    const total = Money.fromCents(101n); // 1,01 €
    const parts = distributeByBps(total, [1, 1, 1]);
    const sum = parts.reduce((a, p) => a + p.cents, 0n);
    expect(sum).toBe(101n);
    // 101 céntimos entre 3 -> 34, 34, 33 (en algún orden).
    expect(parts.map((p) => Number(p.cents)).sort()).toEqual([33, 34, 34]);
  });
});
