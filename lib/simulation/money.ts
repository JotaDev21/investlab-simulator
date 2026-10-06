/** Fixed-point BRL with 18 decimal places. No floating-point monetary arithmetic. */
export const SCALE = 10n ** 18n;
export const CENT = SCALE / 100n;
export type Money = string;
export function money(input: string): Money {
  if (!/^\d+(\.\d{1,2})?$/.test(input)) throw new Error("Informe um valor com até duas casas decimais.");
  const [whole, fraction = ""] = input.split(".");
  return (BigInt(whole) * SCALE + BigInt(fraction.padEnd(2, "0")) * CENT).toString();
}
export function multiply(a: bigint, b: bigint): bigint { return (a * b + SCALE / 2n) / SCALE; }
export function power(base: bigint, exponent: number): bigint {
  let result = SCALE;
  while (exponent > 0) { if (exponent % 2) result = multiply(result, base); base = multiply(base, base); exponent = Math.floor(exponent / 2); }
  return result;
}
const factors = new Map<number, bigint>();
/** Actual/365, annual effective rate in basis points; integer 365th-root. */
export function dailyFactor(annualBps: number): bigint {
  if (!Number.isFinite(annualBps) || annualBps < 0 || annualBps > 10000) throw new Error("Taxa anual inválida.");
  const cached = factors.get(annualBps); if (cached) return cached;
  // Rate precision: 1/10,000 basis point, including fractional CDI participation.
  const target = SCALE + SCALE * BigInt(Math.round(annualBps * 10000)) / 100000000n;
  let low = SCALE, high = target;
  while (high - low > 1n) { const mid = (high + low) / 2n; if (power(mid, 365) > target) high = mid; else low = mid; }
  factors.set(annualBps, low); return low;
}
export function accrue(balance: Money, annualBps: number, days = 1): Money {
  return multiply(BigInt(balance), power(dailyFactor(annualBps), days)).toString();
}
export function roundCents(value: Money): Money { const n = BigInt(value), sign = n < 0n ? -1n : 1n; return (sign * (((n * sign) + CENT / 2n) / CENT) * CENT).toString(); }
/** Conversion is only for presentation/chart coordinates, never account mutations. */
export function displayNumber(value: Money): number { return Number(BigInt(roundCents(value)) / CENT) / 100; }
export function formatMoney(value: Money): string { return displayNumber(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
export function sum(values: Money[]): Money { return values.reduce((a, b) => a + BigInt(b), 0n).toString(); }
