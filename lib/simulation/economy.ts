import { SCALE, accrue } from "./money";
export type Economy = { selicBps: number; cdiBps: number; ipcaBps: number; inflationFactor: string; rng: number; regime: "expansion" | "contraction" | "stable" };
export function initialEconomy(seed: number): Economy { return { selicBps: 1075, cdiBps: 1065, ipcaBps: 450, inflationFactor: SCALE.toString(), rng: seed >>> 0 || 1, regime: "stable" }; }
export function random(state: number): [number, number] { let x = state >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return [(x >>> 0) / 4294967296, x >>> 0]; }
export function stepEconomy(old: Economy, elapsedDays: number, activity=0, unemployment=7.5): { economy: Economy; event?: string } {
  const e = { ...old }; let event: string | undefined;
  if (elapsedDays > 0 && elapsedDays % 90 === 0) {
    const [draw, rng] = random(e.rng); e.rng = rng;
    e.regime = draw < 0.3 ? "contraction" : draw > 0.7 ? "expansion" : "stable";
    const change = e.regime === "expansion" ? 35 : e.regime === "contraction" ? -35 : e.ipcaBps > 450 ? -15 : 15;
    e.ipcaBps = Math.max(200, Math.min(900, e.ipcaBps + change));
    const response = e.ipcaBps > 480 ? 50 : e.ipcaBps < 420 ? -50 : (activity<0&&unemployment>9?-25:draw>.4&&draw<.6?0:draw>0.5?25:-25);
    e.selicBps = Math.max(300, Math.min(1800, e.selicBps + response)); e.cdiBps = e.selicBps - 10;
    event = response === 0 ? "Juros mantidos pelo Banco Central fictício. Observe o efeito da curva, do crédito e das expectativas em diferentes partes da carteira; relações não são absolutas." : response > 0 ? "Juros em alta no cenário. O CDI subiu e os CDBs pós-fixados passam a render mais a partir de hoje. A taxa contratada do prefixado continua igual." : "Juros em queda no cenário. O CDI caiu e o rendimento futuro dos CDBs pós-fixados diminui. O prefixado mantém sua taxa contratada.";
  }
  e.inflationFactor = accrue(e.inflationFactor, e.ipcaBps);
  return { economy: e, event };
}
