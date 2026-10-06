import { roundCents, type Money } from "./money";
// Educational CDB model; IR on positive earnings after IOF. Sources in README.
const IOF = [100,96,93,90,86,83,80,76,73,70,66,63,60,56,53,50,46,43,40,36,33,30,26,23,20,16,13,10,6,3,0];
export function incomeTaxBps(days: number): number { return days <= 180 ? 2250 : days <= 360 ? 2000 : days <= 720 ? 1750 : 1500; }
export function taxes(principal: Money, balance: Money, days: number) {
  const gain = BigInt(balance) > BigInt(principal) ? BigInt(balance) - BigInt(principal) : 0n;
  const iof = BigInt(roundCents((gain * BigInt(IOF[Math.max(0, Math.min(30, days))]) / 100n).toString()));
  const ir = BigInt(roundCents(((gain - iof) * BigInt(incomeTaxBps(days)) / 10000n).toString()));
  return { iof: iof.toString(), ir: ir.toString(), total: (iof + ir).toString(), net: roundCents((BigInt(balance) - iof - ir).toString()) };
}
