import { test } from "node:test";
import assert from "node:assert/strict";
import { money, accrue, displayNumber, sum, SCALE, roundCents } from "../lib/simulation/money";
import { createSimulation, invest, advance, redeem, totals, project, activePositions } from "../lib/simulation/engine";
import { annualRate, getProduct } from "../lib/simulation/products";
import { taxes, incomeTaxBps } from "../lib/simulation/tax";
import { addMonths, daysBetween } from "../lib/simulation/clock";
import { random, initialEconomy } from "../lib/simulation/economy";
import { stepMarket } from "../lib/simulation/market";
import { parseSimulation } from "../lib/simulation/storage";
test("R$1.000 a 10% em 365 dias = R$1.100 brutos", () => assert.equal(displayNumber(accrue(money("1000"), 1000, 365)), 1100));
test("R$1.000 a 10% em 730 dias = R$1.210 brutos", () => assert.equal(displayNumber(accrue(money("1000"), 1000, 730)), 1210));
test("100% de CDI de 10% = 10% na metodologia anual efetiva", () => {
  const p = { ...getProduct("cdi"), rateBps: 10000 }; assert.equal(annualRate(p, { cdiBps: 1000 }), 1000); assert.equal(displayNumber(accrue(money("1000"), annualRate(p, { cdiBps: 1000 }), 365)),1100);
});
test("110% de CDI de 10% = 11% anual efetivo", () => assert.equal(displayNumber(accrue(money("1000"), annualRate(getProduct("cdi"), { cdiBps: 1000 }), 365)),1110));
test("participação no CDI preserva frações de ponto-base", () => { const rate = annualRate(getProduct("cdi"), { cdiBps: 1065 }); assert.equal(rate,1171.5); assert.equal(displayNumber(accrue(money("1000"),rate,365)),1117.15); });
test("período fracionado e capitalização sequencial", () => {
  const one = displayNumber(accrue(money("1000"),1000,30)); assert.ok(Math.abs(one - 1000 * 1.1 ** (30/365)) < 0.005);
  assert.equal(roundCents(accrue(accrue(money("1000"),1000,100),1000,265)),money("1100"));
});
test("dinheiro usa escala inteira e rejeita valores inválidos", () => { assert.equal(sum([money("0.10"),money("0.20")]),money("0.30")); for(const v of ["-1","1.001","NaN","","1e3","Infinity"]) assert.throws(() => money(v)); });
test("apresentação de prejuízo arredonda valores negativos simetricamente", () => { assert.equal(displayNumber((-BigInt(money("100"))).toString()),-100); assert.equal(displayNumber((-BigInt(money("0.01"))).toString()),-0.01); });
test("aplicação conserva patrimônio e não permite saldo negativo", () => {
  const old = createSimulation(), next = invest(old,"cdi","1000"); assert.equal(displayNumber(next.cash),9000); assert.equal(totals(next).netEquity, old.initial); assert.equal(old.positions.length,0); assert.throws(() => invest(old,"cdi","10001")); assert.throws(() => invest(old,"fixed","99.99")); assert.throws(() => invest(old,"unknown","100"));
});
test("IR regressivo respeita todas as fronteiras", () => {
  for(const [day,rate] of [[180,2250],[181,2000],[360,2000],[361,1750],[720,1750],[721,1500]]) assert.equal(incomeTaxBps(day),rate);
  const tax = taxes(money("1000"),money("1100"),365); assert.equal(displayNumber(tax.ir),17.5); assert.equal(displayNumber(tax.net),1082.5);
});
test("IOF nos dias 1, 29 e 30; IR só sobre rendimento após IOF", () => {
  const early = taxes(money("1000"),money("1100"),1); assert.equal(displayNumber(early.iof),96); assert.equal(displayNumber(early.ir),0.9); assert.equal(displayNumber(taxes(money("1000"),money("1100"),29).iof),3); assert.equal(displayNumber(taxes(money("1000"),money("1100"),30).iof),0);
  assert.equal(taxes(money("1000"),money("1000"),1).total,"0"); assert.equal(taxes(money("1000"),money("900"),10).total,"0");
});
test("resgate credita líquido, cobra impostos uma vez e encerra rendimentos", () => {
  const invested = advance(invest(createSimulation(),"cdi","1000"),30), p = invested.positions[0], tax = taxes(p.principal,p.balance,30), redeemed = redeem(invested,p.id);
  assert.equal(redeemed.cash,sum([invested.cash,tax.net])); assert.equal(activePositions(redeemed).length,0); assert.throws(() => redeem(redeemed,p.id)); assert.equal(advance(redeemed,365).cash,redeemed.cash); assert.equal(invested.positions[0].status,"active");
});
test("prefixado não permite resgate antes de vencer", () => { const s = invest(createSimulation(),"fixed","1000"); assert.throws(() => redeem(s,s.positions[0].id),/vencimento/); });
test("vencimento ocorre no dia exato, sem juros depois de vencer", () => {
  const s = invest(createSimulation(),"fixed","1000"), days = daysBetween(s.date,s.positions[0].maturity), before = advance(s,days-1); assert.equal(activePositions(before).length,1);
  const after = advance(before,1); assert.equal(after.positions[0].status,"matured"); assert.equal(displayNumber(after.cash),9000 + displayNumber(taxes(money("1000"),accrue(money("1000"),1000,days),days).net));
  assert.equal(advance(after,300).cash,after.cash); assert.equal(after.transactions.filter(t => t.type === "maturity").length,1);
});
test("alteração do CDI afeta só o período posterior", () => {
  const s = invest(createSimulation(),"cdi","1000"), first = advance(s,90); assert.equal(roundCents(first.positions[0].balance),roundCents(accrue(money("1000"),annualRate(getProduct("cdi"),s.economy),90)));
  const next = advance(first,1); assert.equal(next.positions[0].balance,accrue(first.positions[0].balance,annualRate(getProduct("cdi"),first.economy))); assert.notEqual(first.economy.cdiBps,s.economy.cdiBps);
});
test("avanço em bloco e 365 avanços diários são idênticos", () => {
  const start = invest(createSimulation(),"cdi","1000"), bulk = advance(start,365); let daily = start; for(let i=0;i<365;i++) daily=advance(daily,1); assert.deepEqual(daily,bulk);
});
test("seed reproduz economia e seeds diferentes mudam trajetória", () => { assert.deepEqual(advance(createSimulation(99),720),advance(createSimulation(99),720)); assert.notDeepEqual(advance(createSimulation(99),720).economy,advance(createSimulation(100),720).economy); });
test("inflação reduz poder de compra mesmo sem aplicações", () => { const s = advance(createSimulation(),365); assert.equal(totals(s).nominal,0); assert.ok(totals(s).real < 0); assert.ok(BigInt(s.economy.inflationFactor)>SCALE); assert.equal(s.snapshots.length,366); });
test("histórico conserva fechamento diário e eventos macroeconômicos", () => { const s = advance(invest(createSimulation(),"fixed","1000"),180); assert.equal(s.transactions.filter(t=>t.type === "yield").length,180); assert.equal(s.transactions.filter(t=>t.type === "economy").length,2); assert.equal(s.snapshots[0].date,"2026-10-06"); assert.equal(displayNumber(s.snapshots[0].cash),9000); });
test("mês e ano usam calendário, incluindo ano bissexto", () => { assert.equal(addMonths("2027-01-31",1),"2027-02-28"); assert.equal(addMonths("2028-01-31",1),"2028-02-29"); assert.equal(addMonths("2028-02-29",12),"2029-02-28"); });
test("períodos inválidos rejeitados sem modificar estado", () => { const s = createSimulation(); for(const days of [0,-1,0.5,3651,NaN]) assert.throws(()=>advance(s,days)); assert.equal(s.date,"2026-10-06"); });
test("projeção usa taxas constantes e não altera cenário", () => { const s = createSimulation(), before=JSON.stringify(s); assert.equal(displayNumber(project("fixed","1000",12,s).gross),1100); assert.equal(displayNumber(project("fixed","1000",12,s).net),1082.5); assert.equal(JSON.stringify(s),before); });
test("cenário pode ser serializado, validado e recuperado", () => { const s=advance(invest(createSimulation(),"cdi","1000"),90); assert.deepEqual(parseSimulation(JSON.stringify(s)),s); assert.throws(()=>parseSimulation('{"version":1}')); assert.throws(()=>parseSimulation(JSON.stringify({...s,cash:"NaN"}))); });
test("mercado extensível é determinístico e mantém momentum", () => { const m={price:money("100"),momentumBps:20,volatilityBps:100,rng:99}; const e=initialEconomy(99); assert.deepEqual(stepMarket(m,e),stepMarket(m,e)); assert.ok(stepMarket(m,e).momentumBps>0); assert.equal(random(99)[1],random(99)[1]); });
