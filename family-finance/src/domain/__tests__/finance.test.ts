import { describe, it, expect } from "vitest";
import { Money } from "@/domain/money";
import {
  savingsRate,
  monthlySavings,
  netWorth,
  housingRatio,
  emergencyFundMonths,
  goalProgress,
  budgetDeviation,
} from "@/domain/finance";

describe("indicadores financieros", () => {
  it("calcula la tasa de ahorro", () => {
    expect(savingsRate(Money.fromUnits(5000), Money.fromUnits(4000))).toBeCloseTo(0.2, 5);
    expect(savingsRate(Money.zero(), Money.fromUnits(100))).toBe(0);
  });

  it("calcula el ahorro mensual", () => {
    expect(monthlySavings(Money.fromUnits(5433.33), Money.fromUnits(2403.33)).toUnits()).toBeCloseTo(
      3030,
      2
    );
  });

  it("calcula el patrimonio neto", () => {
    expect(netWorth(Money.fromUnits(425000), Money.fromUnits(228000)).toUnits()).toBe(197000);
  });

  it("calcula el ratio de vivienda y detecta exceso", () => {
    const ratio = housingRatio(Money.fromUnits(2123), Money.fromUnits(5433.33));
    expect(ratio).toBeGreaterThan(0.35);
  });

  it("calcula los meses cubiertos por el fondo de emergencia", () => {
    expect(emergencyFundMonths(Money.fromUnits(12000), Money.fromUnits(2000))).toBe(6);
  });

  it("calcula el progreso de un objetivo y estima la fecha", () => {
    const p = goalProgress(Money.fromUnits(4000), Money.fromUnits(20000), Money.fromUnits(400));
    expect(p.progress).toBeCloseTo(0.2, 5);
    expect(p.monthsToTarget).toBe(40);
    expect(p.estimatedDate).toBeInstanceOf(Date);
  });

  it("calcula la desviación de presupuesto", () => {
    const dev = budgetDeviation(Money.fromUnits(600), Money.fromUnits(680));
    expect(dev.overBudget).toBe(true);
    expect(dev.percent).toBeCloseTo(0.1333, 3);
    expect(dev.absolute.toUnits()).toBe(80);
  });
});
