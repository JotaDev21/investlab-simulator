import { money, sum, accrue, SCALE, roundCents, formatMoney, type Money } from "./money";
import { START_DATE, addDays, addMonths, daysBetween } from "./clock";
import { initialEconomy, stepEconomy } from "./economy";
import { getProduct, annualRate } from "./products";
import { taxes } from "./tax";
import type { Simulation, Position, Snapshot, Transaction } from "./types";
export function activePositions(s: Simulation) { return s.positions.filter(p => p.status === "active"); }
export function netPosition(p: Position, date: string) { return taxes(p.principal, p.balance, daysBetween(p.opened, date)); }
export function totals(s: Simulation) {
  const active = activePositions(s), invested = sum(active.map(p => p.balance)), principal = sum(active.map(p => p.principal));
  const equity = sum([s.cash, invested]), netEquity = sum([s.cash, ...active.map(p => netPosition(p, s.date).net)]);
  const profit = (BigInt(netEquity) - BigInt(s.initial)).toString();
  const nominal = Number(BigInt(netEquity) * SCALE / BigInt(s.initial) - SCALE) / Number(SCALE);
  const inflation = Number(BigInt(s.economy.inflationFactor) - SCALE) / Number(SCALE);
  return { invested, principal, equity, netEquity, profit, nominal, inflation, real: (1 + nominal) / (1 + inflation) - 1 };
}
function record(s: Simulation, tx: Omit<Transaction, "id" | "date">) { s.transactions.push({ ...tx, id: `tx-${s.nextId++}`, date: s.date }); }
function snapshot(s: Simulation, benchmarks?: { fixedBenchmark: string; cdiBenchmark: string }) {
  const t = totals(s), previous = s.snapshots.at(-1);
  const entry: Snapshot = { date: s.date, cash: s.cash, invested: t.invested, equity: t.equity, netEquity: t.netEquity, inflationFactor: s.economy.inflationFactor, cdiBps: s.economy.cdiBps, selicBps: s.economy.selicBps, ipcaBps: s.economy.ipcaBps, fixedBenchmark: benchmarks?.fixedBenchmark ?? previous?.fixedBenchmark ?? money("1000"), cdiBenchmark: benchmarks?.cdiBenchmark ?? previous?.cdiBenchmark ?? money("1000") };
  if (previous?.date === s.date) s.snapshots[s.snapshots.length - 1] = entry; else s.snapshots.push(entry);
}
export function createSimulation(seed = 42719): Simulation {
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 4294967295) throw new Error("Use uma seed entre 1 e 4294967295.");
  const s: Simulation = { version: 1, seed, date: START_DATE, cash: money("10000"), initial: money("10000"), economy: initialEconomy(seed), positions: [], transactions: [], snapshots: [], nextId: 1 };
  record(s, { type: "start", title: "Seu laboratório começou", detail: "R$ 10.000 de dinheiro fictício para aprender experimentando.", amount: s.initial }); snapshot(s); return s;
}
export function invest(old: Simulation, productId: string, amountInput: string): Simulation {
  const product = getProduct(productId), amount = money(amountInput);
  if (BigInt(amount) < BigInt(money(product.minimum))) throw new Error(`O valor mínimo é R$ ${product.minimum}.`);
  if (BigInt(amount) > BigInt(old.cash)) throw new Error("O valor é maior que seu saldo disponível.");
  const s = structuredClone(old), id = `pos-${s.nextId++}`;
  s.cash = (BigInt(s.cash) - BigInt(amount)).toString();
  s.positions.push({ id, productId, principal: amount, balance: amount, opened: s.date, maturity: addMonths(s.date, product.months), status: "active" });
  record(s, { type: "invest", title: `Aplicação · ${product.name}`, detail: "Dinheiro fictício aplicado. Os rendimentos começam com o avanço do tempo.", amount, positionId: id }); snapshot(s); return s;
}
function settle(s: Simulation, p: Position, maturity: boolean) {
  const tax = netPosition(p, s.date); s.cash = sum([s.cash, tax.net]); p.status = maturity ? "matured" : "redeemed";
  if (BigInt(tax.total) > 0n) record(s, { type: "tax", title: "Impostos sobre o rendimento", detail: `IR: ${formatMoney(tax.ir)}; IOF: ${formatMoney(tax.iof)}. Calculados somente sobre o ganho, nunca sobre o valor aplicado.`, amount: tax.total, positionId: p.id });
  record(s, { type: maturity ? "maturity" : "redeem", title: `${maturity ? "Vencimento" : "Resgate"} · ${getProduct(p.productId).name}`, detail: "Valor líquido devolvido ao saldo disponível. O investimento deixou de render.", amount: tax.net, positionId: p.id });
}
export function redeem(old: Simulation, positionId: string): Simulation {
  const s = structuredClone(old), p = s.positions.find(p => p.id === positionId && p.status === "active");
  if (!p) throw new Error("Aplicação ativa não encontrada.");
  if (getProduct(p.productId).liquidity === "maturity" && s.date < p.maturity) throw new Error("Este prefixado só permite resgate no vencimento.");
  settle(s, p, false); snapshot(s); return s;
}
/** Always daily: clicking +365 and clicking +1 365 times produce identical state. */
export function advance(old: Simulation, days: number): Simulation {
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650) throw new Error("Escolha de 1 a 3.650 dias por avanço.");
  if (daysBetween(START_DATE, old.date) + days > 36500) throw new Error("Este laboratório suporta até 100 anos simulados.");
  const s = structuredClone(old);
  for (let i = 0; i < days; i++) {
    s.date = addDays(s.date, 1);
    // The preceding day's rates accrue the interval; new rates take effect tomorrow.
    const previous = s.snapshots.at(-1)!;
    const benchmarks = { fixedBenchmark: accrue(previous.fixedBenchmark, 1000), cdiBenchmark: accrue(previous.cdiBenchmark, annualRate(getProduct("cdi"), s.economy)) };
    const inflationFactor = accrue(s.economy.inflationFactor, s.economy.ipcaBps);
    for (const p of activePositions(s)) {
      const before = p.balance; p.balance = accrue(p.balance, annualRate(getProduct(p.productId), s.economy));
      record(s, { type: "yield", title: `Rendimento · ${getProduct(p.productId).name}`, detail: "Juros do dia calculados sobre o saldo anterior, incluindo os rendimentos acumulados.", amount: (BigInt(p.balance) - BigInt(before)).toString(), positionId: p.id });
      if (s.date >= p.maturity) settle(s, p, true);
    }
    const next = stepEconomy(s.economy, daysBetween(START_DATE, s.date));
    s.economy = { ...next.economy, inflationFactor };
    if (next.event) record(s, { type: "economy", title: "O cenário econômico mudou", detail: next.event });
    snapshot(s, benchmarks);
  }
  return s;
}
export function project(productId: string, amount: string, months: number, s: Simulation) {
  if (!Number.isSafeInteger(months) || months < 1 || months > 24) throw new Error("Use de 1 a 24 meses.");
  const p = getProduct(productId), principal = money(amount), days = daysBetween(s.date, addMonths(s.date, months));
  const gross = accrue(principal, annualRate(p, s.economy), days);
  return { gross: roundCents(gross), ...taxes(principal, gross, days), days };
}
export function realValue(value: Money, inflationFactor: string): Money { return (BigInt(value) * SCALE / BigInt(inflationFactor)).toString(); }
