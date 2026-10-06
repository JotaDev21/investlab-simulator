import { random } from "./economy";
import type { Economy } from "./economy";
import { SCALE, multiply } from "./money";
/** Extension point for equities/ETFs/FIIs; persistent regime and correlated returns. */
export type MarketState = { price: string; momentumBps: number; volatilityBps: number; rng: number };
export function stepMarket(m: MarketState, e: Economy): MarketState {
  const [noise, rng] = random(m.rng);
  const drift = e.regime === "expansion" ? 6 : e.regime === "contraction" ? -8 : 0;
  const momentumBps = Math.round(m.momentumBps * 0.8 + drift * 0.2);
  const change = momentumBps + Math.round((noise - 0.5) * m.volatilityBps * 2);
  return { ...m, momentumBps, rng, price: multiply(BigInt(m.price), SCALE + SCALE * BigInt(Math.max(-9000, change)) / 10000n).toString() };
}
