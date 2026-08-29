/**
 * Value Object `Money`.
 *
 * Representa un importe monetario en céntimos (entero) para evitar los errores
 * de redondeo de la coma flotante. Es inmutable: toda operación devuelve una
 * nueva instancia. Trabaja siempre en una única divisa.
 */
export class Money {
  private constructor(
    public readonly cents: bigint,
    public readonly currency: string
  ) {}

  static fromCents(cents: bigint | number, currency = "EUR"): Money {
    return new Money(BigInt(Math.trunc(Number(cents))), currency);
  }

  /** Crea un `Money` a partir de un importe en unidades (p. ej. 1700.5 €). */
  static fromUnits(amount: number, currency = "EUR"): Money {
    return new Money(BigInt(Math.round(amount * 100)), currency);
  }

  static zero(currency = "EUR"): Money {
    return new Money(0n, currency);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `No se pueden operar divisas distintas: ${this.currency} vs ${other.currency}`
      );
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  /** Multiplica por un escalar redondeando al céntimo (banker-safe round-half-up). */
  multiply(factor: number): Money {
    const result = Math.round(Number(this.cents) * factor);
    return new Money(BigInt(result), this.currency);
  }

  /** Aplica un porcentaje expresado en puntos básicos (68,7% = 6870 bps). */
  applyBps(bps: number): Money {
    return this.multiply(bps / 10_000);
  }

  isNegative(): boolean {
    return this.cents < 0n;
  }

  isZero(): boolean {
    return this.cents === 0n;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents > other.cents;
  }

  /** Importe en unidades como número (uso en UI / serialización). */
  toUnits(): number {
    return Number(this.cents) / 100;
  }

  toString(): string {
    return `${this.toUnits().toFixed(2)} ${this.currency}`;
  }
}

/**
 * Reparte un importe entre `n` partes según pesos en puntos básicos,
 * garantizando que la suma de las partes es exactamente el total (sin perder
 * ni inventar céntimos). El remanente por redondeo se asigna a las primeras
 * partes — el "largest remainder method" simplificado.
 */
export function distributeByBps(total: Money, weightsBps: number[]): Money[] {
  const totalBps = weightsBps.reduce((a, b) => a + b, 0);
  if (totalBps === 0) throw new Error("Los pesos deben sumar más de 0");

  const totalCents = total.cents;
  const raw = weightsBps.map((w) => (totalCents * BigInt(w)) / BigInt(totalBps));
  const assigned = raw.reduce((a, b) => a + b, 0n);
  let remainder = totalCents - assigned;

  // Reparte el remanente de a 1 céntimo, empezando por los mayores restos.
  const remainders = weightsBps.map((w, i) => ({
    i,
    rem: (totalCents * BigInt(w)) % BigInt(totalBps),
  }));
  remainders.sort((a, b) => (b.rem > a.rem ? 1 : b.rem < a.rem ? -1 : 0));

  const result = [...raw];
  let idx = 0;
  while (remainder > 0n && remainders.length > 0) {
    const target = remainders[idx % remainders.length]!.i;
    result[target] = result[target]! + 1n;
    remainder -= 1n;
    idx += 1;
  }

  return result.map((c) => Money.fromCents(c, total.currency));
}
