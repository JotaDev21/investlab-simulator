import Decimal from "decimal.js";
import { SCALE, type Money } from "../simulation/money";
export const D = Decimal.clone({ precision: 48, rounding: Decimal.ROUND_HALF_UP });
export function decimal(value: Money) { return new D(value).div(SCALE.toString()); }
export function units(value: Decimal.Value): Money { return new D(value).mul(SCALE.toString()).toDecimalPlaces(0).toFixed(0); }
export function mMul(value: Money, multiplier: Decimal.Value): Money { return units(decimal(value).mul(multiplier)); }
export function mDiv(a: Money, b: Money): string { return decimal(a).div(decimal(b)).toFixed(12); }
const rateCache=new Map<string,InstanceType<typeof D>>();
export function equivalentRate(annual: Decimal.Value, days: Decimal.Value) {const key=`${annual}/${days}`,cached=rateCache.get(key);if(cached)return cached;const rate=new D(1).plus(annual).pow(new D(days).div(365)).minus(1);if(rateCache.size>20000)rateCache.clear();rateCache.set(key,rate);return rate;}
export function quantity(input: string, fractional = false): string { const n = new D(input); if (!n.isFinite() || n.lte(0) || n.gt(100000000) || (!fractional && !n.isInteger()) || n.decimalPlaces() > 8) throw new Error(fractional ? "Use uma quantidade positiva com até 8 casas decimais." : "Use uma quantidade inteira positiva."); return n.toFixed(); }
