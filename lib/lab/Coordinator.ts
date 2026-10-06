import { stepCredit } from "./CreditEngine";
import { stepFutures } from "./FuturesEngine";
import type { Simulation } from "../simulation/types";
import { ensureLab } from "./PersistenceEngine";
import { stepIntegratedEconomy } from "./EconomyEngine";
import { stepMarket } from "./MarketEngine";
import { executeOrders } from "./OrderEngine";
import { comeCotas,quoteRedemptions } from "./FundEngine";
import { stepDerivatives } from "./DerivativeEngine";
import { portfolio } from "./PortfolioEngine";
import { defaultIssuer,purchaseBond,sellBondFraction,bondMarketValue,canRedeem } from "./FixedIncomeEngine";
import { cashEvent,event } from "./EventEngine";
import { addDays,addMonths,daysBetween } from "../simulation/clock";
import { sum,formatMoney } from "../simulation/money";
import { holdingValue,assetById,assetBRL,trade } from "./EquityEngine";
import { decimal,D } from "./decimal";
import { random } from "../simulation/economy";
export function addContribution(s:Simulation,amount:string){if(BigInt(amount)<=0n)throw new Error("Aporte precisa ser positivo.");const l=ensureLab(s);cashEvent(s,amount,"contribution","Dinheiro fictício novo. Aporte não é rentabilidade.");l.contributions=sum([l.contributions,amount]);event(s,"contribution","Aporte fictício", "Novo capital separado dos rendimentos nos gráficos.",amount);}
export function spend(s:Simulation,amount:string){if(BigInt(amount)<=0n||BigInt(amount)>BigInt(s.cash))throw new Error("Gasto precisa caber no saldo.");const l=ensureLab(s);cashEvent(s,(-BigInt(amount)).toString(),"withdrawal","Gasto fictício: saída externa, sem ser confundida com prejuízo de investimento.");l.withdrawn=sum([l.withdrawn,amount]);event(s,"withdrawal","Gasto fictício", "Retirada separada de lucro/prejuízo.",amount);}
export function rebalance(s:Simulation){const l=ensureLab(s),total=decimal(portfolio(s).equity);if(total.lte(0)||l.shorts.length||BigInt(l.debt)>0n)throw new Error("Rebalanceamento automático exige patrimônio positivo e ausência de short/dívida.");let actions=0;
 const fixed=s.positions.filter(p=>p.status==="active"),fixedValue=fixed.reduce((v,p)=>v.plus(decimal(bondMarketValue(s,p))),new D(0)),fixedTarget=total.mul((l.target.fixed??0)/100);let excess=D.max(0,fixedValue.minus(fixedTarget));
 for(const p of fixed){if(excess.lte(0)||!canRedeem(s,p))continue;const value=decimal(bondMarketValue(s,p));if(value.lte(0))continue;const fraction=D.min(1,excess.div(value)).toNumber();sellBondFraction(s,p.id,fraction);excess=excess.minus(value.mul(fraction));actions++;}

 for(const h of l.holdings.filter(h=>new D(h.qty).gt(0))){const a=assetById(s,h.assetId),classValue=l.holdings.filter(x=>assetById(s,x.assetId).class===a.class).reduce((v,x)=>v.plus(decimal(holdingValue(s,x))),new D(0)),target=total.mul((l.target[a.class]??0)/100);if(classValue.gt(target)&&a.settlementDays===0){const qty=D.min(new D(h.qty),classValue.minus(target).div(decimal(assetBRL(s,a))));const executable=qty.toDecimalPlaces(8,D.ROUND_DOWN);if(executable.gt(0)){trade(s,a.id,"sell",executable.toFixed(),"Rebalanceamento de classe");actions++;}}}
 for(const [cls,weight] of Object.entries(l.target)){if(cls==="fixed"){const current=s.positions.filter(p=>p.status==="active").reduce((v,p)=>v.plus(decimal(bondMarketValue(s,p))),new D(0)),gap=total.mul(weight/100).minus(current),amount=D.min(gap,decimal(s.cash)).toDecimalPlaces(2,D.ROUND_DOWN);if(amount.gte(100)){purchaseBond(s,l.targetAssets?.fixed??"cdi",amount.mul("1e18").toFixed(0),"Alocação-alvo definida pelo usuário");actions++;}continue;}const current=l.holdings.filter(h=>assetById(s,h.assetId).class===cls).reduce((v,h)=>v.plus(decimal(holdingValue(s,h))),new D(0));const gap=total.mul(weight/100).minus(current),a=l.assets.find(a=>a.class===cls&&(!l.targetAssets?.[cls]||a.id===l.targetAssets[cls])&&!a.bankrupt);if(a&&gap.gt(1)&&BigInt(s.cash)>0n){const amount=D.min(gap,decimal(s.cash)),qty=amount.div(decimal(assetBRL(s,a))).toDecimalPlaces(8,D.ROUND_DOWN);if(qty.gt(0)){trade(s,a.id,"buy",qty.toFixed(),"Rebalanceamento de classe");actions++;}}}
 l.lastRebalance=s.date;event(s,"rebalance","Rebalanceamento da carteira",`${actions} operações. Produtos restritos, parcelas sem ativo elegível, taxas e impostos podem impedir a alocação exata.`);
}
export function stepLab(s:Simulation){const l=ensureLab(s),elapsed=daysBetween(l.marketStart,s.date),usd=l.usd,eur=l.eur;const oldValues=l.holdings.map(h=>({id:h.assetId,value:holdingValue(s,h)}));stepIntegratedEconomy(s,elapsed);stepMarket(s,elapsed,usd,eur);comeCotas(s);quoteRedemptions(s);stepDerivatives(s);stepFutures(s);executeOrders(s);
 for(const r of [...l.receipts])if(r.due<=s.date){cashEvent(s,r.amount,"receivable",r.reason);l.receipts=l.receipts.filter(x=>x.id!==r.id);event(s,"settlement","Recebível liquidado",r.reason,r.amount);}
 for(const plan of l.schedules.filter(p=>p.enabled&&p.next<=s.date)){addContribution(s,plan.amount);plan.next=plan.monthly?addMonths(plan.next,1):addDays(plan.next,plan.intervalDays);}
 if(l.rebalanceEvery>0&&daysBetween(l.lastRebalance,s.date)>=l.rebalanceEvery)rebalance(s);
 stepCredit(s,elapsed);
 const changes=oldValues.map(x=>`${x.id}: ${formatMoney(x.value)} → ${formatMoney(holdingValue(s,l.holdings.find(h=>h.assetId===x.id)!))}`).filter(x=>!x.endsWith("→ undefined"));if(changes.length)event(s,"valuation","Reavaliação diária de mercado",changes.join("; "));
}
