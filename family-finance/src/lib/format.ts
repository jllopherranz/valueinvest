import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "./constants";

/** Formatea un importe en unidades (€) según el locale es-ES. */
export function formatCurrency(
  amount: number,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Formatea céntimos (bigint/number) como divisa. */
export function formatCents(
  cents: bigint | number,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE
): string {
  return formatCurrency(Number(cents) / 100, currency, locale);
}

/** Formatea un ratio 0-1 como porcentaje. */
export function formatPercent(ratio: number, locale = DEFAULT_LOCALE, digits = 1): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(ratio);
}

export function formatDate(date: Date | string, locale = DEFAULT_LOCALE): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

/** Convierte puntos básicos a ratio 0-1. */
export function bpsToRatio(bps: number): number {
  return bps / 10_000;
}
