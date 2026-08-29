import { describe, it, expect } from "vitest";
import { monthlyPayment, buildAmortizationSchedule, simulatePrepayment } from "@/domain/mortgage";

const params = {
  outstandingCents: 22_800_000n, // 228.000 €
  annualRateBps: 300, // 3%
  termMonths: 324, // 27 años restantes
};

describe("mortgage", () => {
  it("calcula la cuota mensual del sistema francés", () => {
    const c = monthlyPayment(params);
    // ~1.060 € para 228k a 3% en 324 meses.
    expect(c.toUnits()).toBeGreaterThan(1000);
    expect(c.toUnits()).toBeLessThan(1150);
  });

  it("el cuadro de amortización cierra a saldo 0", () => {
    const { schedule } = buildAmortizationSchedule(params);
    const last = schedule[schedule.length - 1]!;
    expect(last.balance.toUnits()).toBe(0);
  });

  it("la suma de capital amortizado iguala el capital pendiente", () => {
    const { schedule } = buildAmortizationSchedule(params);
    const totalPrincipal = schedule.reduce((a, r) => a + r.principal.cents, 0n);
    expect(totalPrincipal).toBe(params.outstandingCents);
  });

  it("una amortización anticipada reduce intereses y plazo", () => {
    const sim = simulatePrepayment(params, 2_000_000n); // 20.000 €
    expect(sim.interestSaved.cents).toBeGreaterThan(0n);
    expect(sim.monthsSaved).toBeGreaterThan(0);
  });

  it("con tipo 0% reparte el capital linealmente", () => {
    const c = monthlyPayment({ outstandingCents: 12_000n, annualRateBps: 0, termMonths: 12 });
    expect(c.toUnits()).toBe(10);
  });
});
