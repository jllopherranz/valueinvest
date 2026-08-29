/**
 * Seed inicial con los datos de ejemplo del enunciado: una pareja en Vidreres
 * (Girona) con sus ingresos, gastos fijos, hipoteca, objetivos y patrimonio.
 *
 * Ejecutar con: `npm run db:seed`
 */
import { PrismaClient } from "@prisma/client";
import {
  SYSTEM_CATEGORIES,
  SEED_MEMBERS,
  SEED_FIXED_EXPENSES,
  SEED_MORTGAGE,
  SEED_ACCOUNTS,
  SEED_GOALS,
} from "../src/lib/constants";
import { computeSharesFromIncomes } from "../src/domain/allocation";

const prisma = new PrismaClient();

const toCents = (units: number) => BigInt(Math.round(units * 100));

async function main() {
  console.log("🌱 Sembrando datos de ejemplo...");

  // Hogar de ejemplo (idempotente por nombre).
  const household = await prisma.household.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Hogar Vidreres",
      currency: "EUR",
      locale: "es-ES",
      location: "Vidreres, Girona",
    },
  });

  // Categorías del sistema.
  for (const c of SYSTEM_CATEGORIES) {
    await prisma.category.upsert({
      where: { householdId_slug: { householdId: household.id, slug: c.slug } },
      update: { name: c.name, icon: c.icon, color: c.color },
      create: {
        householdId: household.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isSystem: true,
      },
    });
  }
  const categories = await prisma.category.findMany({ where: { householdId: household.id } });
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  // Cuota proporcional a partir de los ingresos anuales.
  const shares = computeSharesFromIncomes(
    SEED_MEMBERS.map((m) => ({ memberId: m.key, annualCents: toCents(m.annualIncome) }))
  );
  const shareByKey = new Map(shares.map((s) => [s.memberId, s.shareBps]));

  // Miembros de la pareja.
  const members: Record<string, string> = {};
  for (const m of SEED_MEMBERS) {
    const created = await prisma.member.create({
      data: {
        householdId: household.id,
        name: m.name,
        color: m.color,
        shareBps: shareByKey.get(m.key) ?? 5000,
      },
    });
    members[m.key] = created.id;
  }
  console.log(
    `   Reparto proporcional -> ${SEED_MEMBERS.map(
      (m) => `${m.name}: ${((shareByKey.get(m.key) ?? 0) / 100).toFixed(2)}%`
    ).join(" | ")}`
  );

  // Cuentas / patrimonio.
  for (const a of SEED_ACCOUNTS) {
    await prisma.account.create({
      data: {
        householdId: household.id,
        name: a.name,
        type: a.type as never,
        balanceCents: toCents(a.balance),
        isLiability: a.isLiability,
      },
    });
  }

  // Ingresos recurrentes (salario neto mensual de cada miembro).
  const now = new Date();
  for (const m of SEED_MEMBERS) {
    await prisma.income.create({
      data: {
        householdId: household.id,
        memberId: members[m.key],
        description: `Salario neto ${m.name}`,
        amountCents: toCents(m.monthlyNetSalary),
        kind: "RECURRING",
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        extraPayments: m.extraPayments,
      },
    });
  }

  // Gastos fijos mensualizados del mes en curso, con reparto proporcional.
  const memberShares = SEED_MEMBERS.map((m) => ({
    memberId: members[m.key]!,
    shareBps: shareByKey.get(m.key) ?? 5000,
  }));

  for (const e of SEED_FIXED_EXPENSES) {
    const amountCents = toCents(e.monthly);
    const expense = await prisma.expense.create({
      data: {
        householdId: household.id,
        categoryId: catBySlug.get(e.category) ?? null,
        description: e.name,
        amountCents,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        splitMode: "PROPORTIONAL",
        source: "SEED",
      },
    });

    // Reparto proporcional persistido para trazabilidad.
    let assigned = 0n;
    memberShares.forEach((ms, idx) => {
      const isLast = idx === memberShares.length - 1;
      const part = isLast
        ? amountCents - assigned
        : (amountCents * BigInt(ms.shareBps)) / 10_000n;
      assigned += part;
      return prisma.expenseAllocation
        .create({
          data: {
            expenseId: expense.id,
            memberId: ms.memberId,
            amountCents: part,
            shareBps: ms.shareBps,
          },
        })
        .catch(() => undefined);
    });
  }

  // Hipoteca.
  await prisma.mortgage.create({
    data: {
      householdId: household.id,
      name: SEED_MORTGAGE.name,
      principalCents: toCents(SEED_MORTGAGE.principal),
      outstandingCents: toCents(SEED_MORTGAGE.outstanding),
      annualRateBps: Math.round(SEED_MORTGAGE.annualRatePct * 100),
      termMonths: SEED_MORTGAGE.termMonths,
      monthsPaid: SEED_MORTGAGE.monthsPaid,
      startDate: new Date(now.getFullYear() - 3, 0, 1),
    },
  });

  // Objetivos financieros.
  for (const g of SEED_GOALS) {
    await prisma.goal.create({
      data: {
        householdId: household.id,
        name: g.name,
        type: g.type as never,
        targetCents: toCents(g.target),
        currentCents: toCents(g.current),
        monthlyContributionCents: toCents(g.monthlyContribution),
      },
    });
  }

  // Presupuestos mensuales de ejemplo para algunas categorías.
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const budgetSeed: Record<string, number> = {
    alimentacion: 600,
    ocio: 250,
    transporte: 200,
    suministros: 220,
  };
  for (const [slug, amount] of Object.entries(budgetSeed)) {
    const categoryId = catBySlug.get(slug);
    if (!categoryId) continue;
    await prisma.budget.create({
      data: {
        householdId: household.id,
        categoryId,
        period: "MONTHLY",
        amountCents: toCents(amount),
        year,
        month,
      },
    });
  }

  // Snapshot de patrimonio neto del mes.
  const assets = SEED_ACCOUNTS.filter((a) => !a.isLiability).reduce((s, a) => s + a.balance, 0);
  const liabilities = Math.abs(
    SEED_ACCOUNTS.filter((a) => a.isLiability).reduce((s, a) => s + a.balance, 0)
  );
  await prisma.netWorthSnapshot.create({
    data: {
      householdId: household.id,
      date: new Date(year, now.getMonth(), 1),
      assetsCents: toCents(assets),
      liabilitiesCents: toCents(liabilities),
      netWorthCents: toCents(assets - liabilities),
    },
  });

  console.log("✅ Seed completado.");
  console.log(`   Patrimonio neto inicial: ${(assets - liabilities).toLocaleString("es-ES")} €`);
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
