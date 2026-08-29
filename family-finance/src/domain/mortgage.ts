import { Money } from "./money";

export interface MortgageParams {
  /** Capital pendiente actual en céntimos. */
  outstandingCents: bigint;
  /** Tipo nominal anual en puntos básicos (3% = 300). */
  annualRateBps: number;
  /** Plazo restante en meses. */
  termMonths: number;
}

export interface AmortizationRow {
  month: number;
  payment: Money;
  interest: Money;
  principal: Money;
  balance: Money;
}

export interface AmortizationSummary {
  monthlyPayment: Money;
  totalInterest: Money;
  totalPaid: Money;
  schedule: AmortizationRow[];
}

/**
 * Cuota mensual del sistema francés (cuota constante):
 *   C = P * i / (1 - (1 + i)^-n)
 * donde `i` es el tipo mensual y `n` el número de cuotas.
 */
export function monthlyPayment(params: MortgageParams): Money {
  const principal = Number(params.outstandingCents) / 100;
  const i = params.annualRateBps / 10_000 / 12;
  const n = params.termMonths;

  if (n <= 0) return Money.zero();
  if (i === 0) return Money.fromUnits(principal / n);

  const c = (principal * i) / (1 - Math.pow(1 + i, -n));
  return Money.fromUnits(c);
}

/**
 * Genera el cuadro de amortización completo. Aplica la cuota constante e imputa
 * el resto de capital pendiente en la última cuota para cerrar a saldo 0.
 */
export function buildAmortizationSchedule(
  params: MortgageParams,
  prepaymentCents = 0n
): AmortizationSummary {
  const i = params.annualRateBps / 10_000 / 12;
  const payment = monthlyPayment(params);
  const schedule: AmortizationRow[] = [];

  let balance = params.outstandingCents - prepaymentCents;
  if (balance < 0n) balance = 0n;

  let totalInterest = 0n;
  let totalPaid = 0n;
  let month = 0;

  while (balance > 0n && month < params.termMonths) {
    month += 1;
    const interestCents = BigInt(Math.round(Number(balance) * i));
    let principalCents = payment.cents - interestCents;

    if (principalCents >= balance) {
      // Última cuota: salda el remanente exacto.
      principalCents = balance;
    }

    const rowPayment = principalCents + interestCents;
    balance -= principalCents;
    totalInterest += interestCents;
    totalPaid += rowPayment;

    schedule.push({
      month,
      payment: Money.fromCents(rowPayment),
      interest: Money.fromCents(interestCents),
      principal: Money.fromCents(principalCents),
      balance: Money.fromCents(balance),
    });
  }

  return {
    monthlyPayment: payment,
    totalInterest: Money.fromCents(totalInterest),
    totalPaid: Money.fromCents(totalPaid),
    schedule,
  };
}

export interface PrepaymentComparison {
  /** Ahorro total de intereses con la amortización anticipada. */
  interestSaved: Money;
  /** Meses que se reducen del plazo. */
  monthsSaved: number;
  baseline: AmortizationSummary;
  withPrepayment: AmortizationSummary;
}

/**
 * Simula una amortización anticipada que reduce plazo (manteniendo la cuota) y
 * cuantifica el ahorro en intereses y la reducción del plazo.
 */
export function simulatePrepayment(
  params: MortgageParams,
  prepaymentCents: bigint
): PrepaymentComparison {
  const baseline = buildAmortizationSchedule(params);
  const withPrepayment = buildAmortizationSchedule(params, prepaymentCents);

  return {
    interestSaved: baseline.totalInterest.subtract(withPrepayment.totalInterest),
    monthsSaved: baseline.schedule.length - withPrepayment.schedule.length,
    baseline,
    withPrepayment,
  };
}
