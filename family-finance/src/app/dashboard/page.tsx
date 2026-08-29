import { Banknote, PiggyBank, Percent, TrendingDown, Home, ShieldCheck } from "lucide-react";
import { buildDashboardModel } from "@/lib/dashboard-data";
import { formatCurrency, formatPercent } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { GoalsList } from "@/components/dashboard/goals-list";
import { CategoryPie } from "@/components/charts/category-pie";
import { NetWorthArea } from "@/components/charts/net-worth-area";
import { IncomeExpenseBar } from "@/components/charts/income-expense-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const d = buildDashboardModel();

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Hogar Vidreres · Junio 2026</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container space-y-6 py-6">
        {/* KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            title="Patrimonio neto"
            value={formatCurrency(d.netWorth)}
            icon={Banknote}
            hint="Activos − pasivos"
          />
          <KpiCard
            title="Ahorro mensual"
            value={formatCurrency(d.monthlySavings)}
            icon={PiggyBank}
            trend="up"
            hint="Ingresos − gastos"
          />
          <KpiCard
            title="Tasa de ahorro"
            value={formatPercent(d.savingsRatePct / 100)}
            icon={Percent}
            trend={d.savingsRatePct >= 20 ? "up" : "down"}
            hint="Objetivo: ≥ 20%"
          />
          <KpiCard
            title="Gastos del mes"
            value={formatCurrency(d.monthlyExpenses)}
            icon={TrendingDown}
            hint="Gastos fijos"
          />
          <KpiCard
            title="Ratio vivienda"
            value={formatPercent(d.housingRatioPct / 100)}
            icon={Home}
            trend={d.housingRatioPct <= 35 ? "up" : "down"}
            hint="Umbral: ≤ 35%"
          />
          <KpiCard
            title="Fondo emergencia"
            value={`${d.emergencyMonths.toFixed(1)} meses`}
            icon={ShieldCheck}
            trend={d.emergencyMonths >= 6 ? "up" : "down"}
            hint="Recomendado: 6 meses"
          />
        </section>

        {/* Gráficos */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Evolución del patrimonio neto</CardTitle>
            </CardHeader>
            <CardContent>
              <NetWorthArea data={d.netWorthSeries} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ingresos vs gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeExpenseBar data={d.savingsSeries} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Distribución de gastos por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPie data={d.expensesByCategory} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gasto por miembro (reparto proporcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                {d.byMember.map((mb) => (
                  <div key={mb.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ background: mb.color }}
                        />
                        {mb.name}
                      </span>
                      <span className="text-muted-foreground">{formatCurrency(mb.value)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(mb.value / d.monthlyExpenses) * 100}%`,
                          background: mb.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Objetivos + alertas */}
        <section className="grid gap-6 lg:grid-cols-2">
          <GoalsList goals={d.goals} />
          <AlertsPanel alerts={d.alerts} />
        </section>
      </div>
    </main>
  );
}
