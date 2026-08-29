/**
 * Constantes de dominio y datos iniciales del hogar de ejemplo.
 * Fuente: enunciado del producto (pareja en Vidreres, Girona).
 */

export const DEFAULT_CURRENCY = "EUR";
export const DEFAULT_LOCALE = "es-ES";

/** Categorías iniciales del sistema. */
export const SYSTEM_CATEGORIES = [
  { slug: "vivienda", name: "Vivienda", icon: "home", color: "#2563eb" },
  { slug: "suministros", name: "Suministros", icon: "zap", color: "#0891b2" },
  { slug: "alimentacion", name: "Alimentación", icon: "shopping-cart", color: "#16a34a" },
  { slug: "transporte", name: "Transporte", icon: "car", color: "#ca8a04" },
  { slug: "seguros", name: "Seguros", icon: "shield", color: "#9333ea" },
  { slug: "salud", name: "Salud", icon: "heart-pulse", color: "#dc2626" },
  { slug: "ocio", name: "Ocio", icon: "party-popper", color: "#db2777" },
  { slug: "viajes", name: "Viajes", icon: "plane", color: "#0d9488" },
  { slug: "educacion", name: "Educación", icon: "graduation-cap", color: "#4f46e5" },
  { slug: "impuestos", name: "Impuestos", icon: "landmark", color: "#64748b" },
  { slug: "mascotas", name: "Mascotas", icon: "paw-print", color: "#a16207" },
  { slug: "suscripciones", name: "Suscripciones", icon: "repeat", color: "#7c3aed" },
  { slug: "inversiones", name: "Inversiones", icon: "trending-up", color: "#059669" },
  { slug: "imprevistos", name: "Imprevistos", icon: "alert-triangle", color: "#ea580c" },
  { slug: "otros", name: "Otros", icon: "more-horizontal", color: "#94a3b8" },
] as const;

/** Datos de la pareja del enunciado. */
export const SEED_MEMBERS = [
  {
    key: "persona1",
    name: "Persona 1",
    color: "#2563eb",
    monthlyNetSalary: 3200,
    extraPayments: 2,
    annualIncome: 44800, // 3200 * 14
  },
  {
    key: "persona2",
    name: "Persona 2",
    color: "#db2777",
    monthlyNetSalary: 1700,
    extraPayments: 0,
    annualIncome: 20400, // 1700 * 12
  },
] as const;

export const JOINT_ANNUAL_INCOME = 65200;
export const AVG_MONTHLY_INCOME = 5433.33;

/**
 * Gastos fijos del enunciado. `monthly` es el coste mensualizado
 * (los anuales se dividen entre 12). `category` es el slug de categoría.
 */
export const SEED_FIXED_EXPENSES = [
  { name: "Hipoteca", monthly: 1700, category: "vivienda", isHousing: true },
  { name: "IBI", monthly: 1000 / 12, category: "impuestos", isHousing: true },
  { name: "Seguro del hogar", monthly: 600 / 12, category: "seguros", isHousing: true },
  { name: "Seguro de vida", monthly: 600 / 12, category: "seguros", isHousing: false },
  { name: "Electricidad", monthly: 120, category: "suministros", isHousing: false },
  { name: "Agua", monthly: 45, category: "suministros", isHousing: false },
  { name: "Internet y móvil", monthly: 50, category: "suministros", isHousing: false },
  { name: "Mantenimiento piscina", monthly: 80, category: "vivienda", isHousing: true },
  { name: "Mantenimiento jardín", monthly: 60, category: "vivienda", isHousing: true },
  { name: "Fondo mantenimiento vivienda", monthly: 150, category: "vivienda", isHousing: true },
  { name: "Tasa de residuos", monthly: 180 / 12, category: "impuestos", isHousing: true },
] as const;

/** Hipoteca de ejemplo coherente con una cuota ~1.700 €/mes. */
export const SEED_MORTGAGE = {
  name: "Hipoteca vivienda Vidreres",
  principal: 250_000,
  outstanding: 228_000,
  annualRatePct: 3.0,
  termMonths: 360,
  monthsPaid: 36,
} as const;

/** Patrimonio inicial de ejemplo (cuentas y activos). */
export const SEED_ACCOUNTS = [
  { name: "Cuenta corriente conjunta", type: "CHECKING", balance: 8500, isLiability: false },
  { name: "Cuenta de ahorro", type: "SAVINGS", balance: 22000, isLiability: false },
  { name: "Cartera de inversión", type: "INVESTMENT", balance: 15000, isLiability: false },
  { name: "Vivienda (Vidreres)", type: "PROPERTY", balance: 380000, isLiability: false },
  { name: "Hipoteca pendiente", type: "LOAN", balance: -228000, isLiability: true },
] as const;

/** Objetivos financieros de ejemplo. */
export const SEED_GOALS = [
  {
    name: "Fondo de emergencia",
    type: "EMERGENCY_FUND",
    target: 18000,
    current: 12000,
    monthlyContribution: 500,
  },
  {
    name: "Reforma cocina",
    type: "HOME_RENOVATION",
    target: 20000,
    current: 4000,
    monthlyContribution: 400,
  },
  {
    name: "Vacaciones Japón",
    type: "VACATION",
    target: 8000,
    current: 2500,
    monthlyContribution: 300,
  },
  {
    name: "Amortización anticipada hipoteca",
    type: "MORTGAGE_PREPAYMENT",
    target: 30000,
    current: 6000,
    monthlyContribution: 600,
  },
  {
    name: "Inversión mensual",
    type: "INVESTMENT",
    target: 50000,
    current: 15000,
    monthlyContribution: 400,
  },
  {
    name: "Compra de vehículo",
    type: "VEHICLE",
    target: 25000,
    current: 5000,
    monthlyContribution: 350,
  },
] as const;
