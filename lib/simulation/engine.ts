import { money, sum, accrue, SCALE, roundCents, formatMoney, type Money } from "./money";
import { START_DATE, addDays, addMonths, daysBetween } from "./clock";
import { initialEconomy, stepEconomy } from "./economy";
import { getProduct, annualRate } from "./products";
import { taxes } from "./tax";
import type { Simulation, Position, Snapshot, Transaction } from "./types";
import { ensureLab } from "../lab/PersistenceEngine";
import { portfolio } from "../lab/PortfolioEngine";
import { stepLab } from "../lab/Coordinator";
import { bondTax,bondMarketValue,initializeBond,payCoupon,canRedeem } from "../lab/FixedIncomeEngine";
import { cashEvent } from "../lab/EventEngine";
import { fixedTax } from "../lab/TaxEngine";
export function activePositions(s: Simulation) { return s.positions.filter(p => p.status === "active"); }
export function netPosition(p: Position, date: string) { return getProduct(p.productId).exempt?{iof:"0",ir:"0",total:"0",net:roundCents(p.balance)}:taxes(p.principal, p.balance, daysBetween(p.opened, date)); }
export function totals(s: Simulation) {
  const l=ensureLab(s),p=portfolio(s), invested=sum([p.fixedGross,p.securities,p.options,p.collateral]),principal=sum([...activePositions(s).map(p=>p.principal),...l.holdings.map(h=>h.cost)]);
  const equity=p.equity,netEquity=p.net,profit=p.profit;
  const nominal=BigInt(p.capital)>0n?Number(BigInt(profit)*SCALE/BigInt(p.capital))/Number(SCALE):0;
  const inflation = Number(BigInt(s.economy.inflationFactor) - SCALE) / Number(SCALE);
  return { invested, principal, equity, netEquity, profit, nominal, inflation, real: (1 + nominal) / (1 + inflation) - 1 };
}
function record(s: Simulation, tx: Omit<Transaction, "id" | "date">) { s.transactions.push({ ...tx, id: `tx-${s.nextId++}`, date: s.date }); }
function snapshot(s: Simulation, benchmarks?: { fixedBenchmark: string; cdiBenchmark: string; trueCdiBenchmark?:string }) {
  const t = totals(s), previous = s.snapshots.at(-1);
  const entry: Snapshot = { date: s.date, cash: s.cash, invested: t.invested, equity: t.equity, netEquity: t.netEquity, inflationFactor: s.economy.inflationFactor, cdiBps: s.economy.cdiBps, selicBps: s.economy.selicBps, ipcaBps: s.economy.ipcaBps, fixedBenchmark: benchmarks?.fixedBenchmark ?? previous?.fixedBenchmark ?? money("1000"), cdiBenchmark: benchmarks?.cdiBenchmark ?? previous?.cdiBenchmark ?? money("1000") };
  entry.trueCdiBenchmark=benchmarks?.trueCdiBenchmark??previous?.trueCdiBenchmark??money("1000");
  const l=ensureLab(s),port=portfolio(s);entry.capital=port.capital;entry.contributions=l.contributions;entry.withdrawals=l.withdrawn;entry.income=l.income;entry.obligations=port.obligations;entry.receivables=port.receivables;entry.usd=l.usd;
  const flow=BigInt(l.contributions)-BigInt(previous?.contributions??"0")-(BigInt(l.withdrawn)-BigInt(previous?.withdrawals??"0"));entry.twr=previous&&BigInt(previous.netEquity)>0n?(previous.twr??1)*Number((BigInt(entry.netEquity)-flow)*SCALE/BigInt(previous.netEquity))/Number(SCALE):1;
  const br=l.assets.find(a=>a.id==="BRAS11")!,us=l.assets.find(a=>a.id==="SPXL11")!;entry.brazilIndex=(BigInt(money("1000"))*BigInt(br.price)/BigInt(br.initialPrice)).toString();entry.usaIndex=(BigInt(money("1000"))*BigInt(us.price)/BigInt(us.initialPrice)).toString();
  if (previous?.date === s.date) s.snapshots[s.snapshots.length - 1] = entry; else s.snapshots.push(entry);
}
export function refreshSnapshot(s:Simulation){snapshot(s);return s;}
export function createSimulation(seed = 42719): Simulation {
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 4294967295) throw new Error("Use uma seed entre 1 e 4294967295.");
  const s: Simulation = { version: 1, seed, date: START_DATE, cash: money("10000"), initial: money("10000"), economy: initialEconomy(seed), positions: [], transactions: [], snapshots: [], nextId: 1 };
  record(s, { type: "start", title: "Seu laboratório começou", detail: "R$ 10.000 de dinheiro fictício para aprender experimentando.", amount: s.initial }); snapshot(s); return s;
}
export function invest(old: Simulation, productId: string, amountInput: string,note=""): Simulation {
  const product = getProduct(productId), amount = money(amountInput);
  if (BigInt(amount) < BigInt(money(product.minimum))) throw new Error(`O valor mínimo é R$ ${product.minimum}.`);
  if (BigInt(amount) > BigInt(old.cash)) throw new Error("O valor é maior que seu saldo disponível.");
  const s = structuredClone(old), id = `pos-${s.nextId++}`;
  if(ensureLab(s).failedIssuers.includes(product.issuer??""))throw new Error("O emissor está insolvente neste universo.");
  cashEvent(s,(-BigInt(amount)).toString(),"fixed-purchase",`Aplicação ${product.name}.`);
  s.positions.push({ id, productId, principal: amount, balance: amount, opened: s.date, maturity: addMonths(s.date, product.months), status: "active" });
  if(note.trim())ensureLab(s).diary.push({id:`diary-${s.nextId++}`,date:s.date,assetId:productId,positionId:id,note:note.trim(),price:amount,operation:"Aplicação"});
  initializeBond(s,s.positions.at(-1)!);record(s, { type: "invest", title: `Aplicação · ${product.name}`, detail: "Dinheiro fictício aplicado. Os rendimentos começam com o avanço do tempo.", amount, positionId: id }); snapshot(s); return s;
}
function settle(s: Simulation, p: Position, maturity: boolean) {
  const tax = bondTax(s,p,maturity?p.balance:bondMarketValue(s,p)); cashEvent(s,tax.net,maturity?"fixed-maturity":"fixed-sale","Liquidação de título após impostos."); ensureLab(s).taxPaid=sum([ensureLab(s).taxPaid,tax.total]);ensureLab(s).realized=sum([ensureLab(s).realized,(BigInt(tax.net)-BigInt(p.principal)).toString()]);p.status = maturity ? "matured" : "redeemed";
  if (BigInt(tax.total) > 0n) record(s, { type: "tax", title: "Impostos sobre o rendimento", detail: `IR: ${formatMoney(tax.ir)}; IOF: ${formatMoney(tax.iof)}. Calculados somente sobre o ganho, nunca sobre o valor aplicado.`, amount: tax.total, positionId: p.id });
  record(s, { type: maturity ? "maturity" : "redeem", title: `${maturity ? "Vencimento" : "Resgate"} · ${getProduct(p.productId).name}`, detail: "Valor líquido devolvido ao saldo disponível. O investimento deixou de render.", amount: tax.net, positionId: p.id });
}
export function redeem(old: Simulation, positionId: string): Simulation {
  const s = structuredClone(old), p = s.positions.find(p => p.id === positionId && p.status === "active");
  if (!p) throw new Error("Aplicação ativa não encontrada.");
  if (!canRedeem(s,p)) throw new Error("Este título exige carência ou resgate no vencimento.");
  settle(s, p, false); snapshot(s); return s;
}
/** Always daily: clicking +365 and clicking +1 365 times produce identical state. */
export function advance(old: Simulation, days: number, respectPauses=false): Simulation {
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650) throw new Error("Escolha de 1 a 3.650 dias por avanço.");
  if (daysBetween(ensureLab(old).startDate, old.date) + days > 36500) throw new Error("Este laboratório suporta até 100 anos simulados.");
  const s = structuredClone(old);
  for (let i = 0; i < days; i++) {
    const eventsBefore=ensureLab(s).events.length,transactionsBefore=s.transactions.length;
    s.date = addDays(s.date, 1);
    // The preceding day's rates accrue the interval; new rates take effect tomorrow.
    const previous = s.snapshots.at(-1)!;
    const benchmarks = { trueCdiBenchmark: accrue(previous.trueCdiBenchmark??money("1000"),s.economy.cdiBps), fixedBenchmark: accrue(previous.fixedBenchmark, 1000), cdiBenchmark: accrue(previous.cdiBenchmark, annualRate(getProduct("cdi"), s.economy)) };
    const inflationFactor = accrue(s.economy.inflationFactor, s.economy.ipcaBps);
    for (const p of activePositions(s)) {
      const before = p.balance; p.balance = accrue(p.balance, annualRate(getProduct(p.productId), s.economy));
      record(s, { type: "yield", title: `Rendimento · ${getProduct(p.productId).name}`, detail: "Juros do dia calculados sobre o saldo anterior, incluindo os rendimentos acumulados.", amount: (BigInt(p.balance) - BigInt(before)).toString(), positionId: p.id });
      payCoupon(s,p);
      if (s.date >= p.maturity) settle(s, p, true);
    }
    const next = stepEconomy(s.economy, daysBetween(ensureLab(s).startDate, s.date),ensureLab(s).gdpGrowth,ensureLab(s).unemployment);
    s.economy = { ...next.economy, inflationFactor };
    if (next.event) record(s, { type: "economy", title: "O cenário econômico mudou", detail: next.event });
    stepLab(s);snapshot(s, benchmarks);
    if(respectPauses && (ensureLab(s).events.slice(eventsBefore).some(e=>ensureLab(s).pauses.includes(e.type)) || (next.event&&ensureLab(s).pauses.includes("macro")) || s.transactions.slice(transactionsBefore).some(t=>t.type==="maturity")&&ensureLab(s).pauses.includes("maturity")))break;
  }
  return s;
}
export function project(productId: string, amount: string, months: number, s: Simulation) {
  if (!Number.isSafeInteger(months) || months < 1 || months > 24) throw new Error("Use de 1 a 24 meses.");
  const p = getProduct(productId), principal = money(amount), days = daysBetween(s.date, addMonths(s.date, months));
  let balance=principal,paidGross=0n,paidNet=0n,paidTax=0n,previous=0,couponCount=1;
  if(p.couponMonths){let coupon=daysBetween(s.date,addMonths(s.date,p.couponMonths));while(coupon<days){balance=accrue(balance,annualRate(p,s.economy),coupon-previous);const inflationPrincipal=p.kind==="ipca"?BigInt(accrue(principal,s.economy.ipcaBps,coupon)):BigInt(principal);const amount=BigInt(balance)>inflationPrincipal?BigInt(balance)-inflationPrincipal:0n;const tax=fixedTax("0",amount.toString(),coupon,!!p.exempt);paidGross+=amount;paidNet+=BigInt(tax.net);paidTax+=BigInt(tax.total);balance=(BigInt(balance)-amount).toString();previous=coupon;couponCount++;coupon=daysBetween(s.date,addMonths(s.date,p.couponMonths*couponCount));}}
  balance=accrue(balance,annualRate(p,s.economy),days-previous);const tax=fixedTax(principal,balance,days,!!p.exempt);
  const inflationAtEnd=accrue(s.economy.inflationFactor,s.economy.ipcaBps,days),netEnd=roundCents((BigInt(tax.net)+paidNet).toString()),grossEnd=roundCents((BigInt(balance)+paidGross).toString());
  return {netReal:realValue(netEnd,inflationAtEnd),grossReal:realValue(grossEnd,inflationAtEnd),inflationAtEnd,gross:roundCents((BigInt(balance)+paidGross).toString()),iof:tax.iof,ir:(BigInt(tax.ir)+paidTax).toString(),total:(BigInt(tax.total)+paidTax).toString(),net:roundCents((BigInt(tax.net)+paidNet).toString()),days};
}
export function realValue(value: Money, inflationFactor: string): Money { return (BigInt(value) * SCALE / BigInt(inflationFactor)).toString(); }
