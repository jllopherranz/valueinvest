import { describe, it, expect } from "vitest";
import { buildDashboardModel } from "@/lib/dashboard-data";

/**
 * Test de integración: comprueba que el modelo del dashboard se compone
 * correctamente a partir de las constantes de ejemplo y la capa de dominio,
 * reproduciendo las cifras del enunciado.
 */
describe("dashboard model (integración dominio + constantes)", () => {
  const d = buildDashboardModel();

  it("los ingresos mensuales conjuntos son 4.900 € (salarios netos)", () => {
    // 3.200 + 1.700 = 4.900 €/mes en salario neto base.
    expect(d.monthlyIncome).toBe(4900);
  });

  it("dispara la alerta de gasto de vivienda > 35%", () => {
    expect(d.housingRatioPct).toBeGreaterThan(35);
    expect(d.alerts.some((a) => a.type === "HIGH_HOUSING_RATIO")).toBe(true);
  });

  it("el reparto por miembro suma el gasto total del mes", () => {
    const sum = d.byMember.reduce((a, m) => a + m.value, 0);
    expect(sum).toBeCloseTo(d.monthlyExpenses, 0);
  });

  it("incluye los 6 objetivos del enunciado", () => {
    expect(d.goals).toHaveLength(6);
    expect(d.goals.map((g) => g.name)).toContain("Fondo de emergencia");
  });

  it("genera 12 puntos en las series temporales", () => {
    expect(d.netWorthSeries).toHaveLength(12);
    expect(d.savingsSeries).toHaveLength(12);
  });

  it("detecta la suscripción infrautilizada del demo", () => {
    expect(d.alerts.some((a) => a.type === "UNDERUSED_SUBSCRIPTION")).toBe(true);
  });
});
