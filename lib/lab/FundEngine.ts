import { trade } from "./EquityEngine";
import type { Simulation } from "../simulation/types";
import type { Asset } from "./types";
import { ensureLab } from "./PersistenceEngine";
import { decimal,units,D,equivalentRate } from "./decimal";
import { sum } from "../simulation/money";
import { policy } from "./TaxEngine";
import { event } from "./EventEngine";
export function fundDailyReturn(s:Simulation,a:Asset,marketReturn:number,fxReturn:number){if(a.benchmark==="CDI")return equivalentRate(s.economy.cdiBps/10000,1).toNumber()*(a.id==="FIMM"?.5:1)+marketReturn*(a.id==="FIMM"?.5:0);if(a.benchmark==="USD")return fxReturn;return marketReturn;}
export function applyFundFees(a:Asset,grossReturn:number,benchmarkReturn:number){const before=decimal(a.price),gross=before.mul(new D(1).plus(grossReturn)),admin=gross.mul(equivalentRate(a.adminBps/10000,1).div(new D(1).plus(equivalentRate(a.adminBps/10000,1))));
 // Annual high-water-mark performance fee charged only on new excess gain.
 const high=decimal(a.highWater??a.initialPrice);const excess=D.max(0,gross.minus(D.max(high,before.mul(new D(1).plus(benchmarkReturn)))));const perf=excess.mul(a.performanceBps/10000);a.price=units(D.max(.000001,gross.minus(admin).minus(perf)));a.feesPaid=sum([a.feesPaid,units(admin.plus(perf))]);if(gross.gt(high))a.highWater=units(gross);}
export function comeCotas(s:Simulation){const l=ensureLab(s),d=new Date(s.date+"T12:00:00Z"),month=d.getUTCMonth();if(![4,10].includes(month))return;const tomorrow=new Date(d);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);if(tomorrow.getUTCMonth()===month)return;
 for(const h of l.holdings){const a=l.assets.find(a=>a.id===h.assetId)!;if(a.class!=="fund"||!["FIRF","FIMM","FICAMB"].includes(a.id)||new D(h.qty).lte(0))continue;
 const value=decimal(a.price).mul(h.qty),gain=D.max(0,value.plus(decimal(h.comeCotasPaid)).minus(decimal(h.cost))),tax=D.max(0,gain.mul(policy(l.taxPolicy).comeCotasBps/10000).minus(decimal(h.comeCotasPaid)));
 const reduction=tax.div(decimal(a.price)),remaining=new D(h.qty).minus(reduction).div(h.qty);for(const r of l.pendingRedemptions!.filter(r=>r.assetId===h.assetId))r.qty=new D(r.qty).mul(remaining).toDecimalPlaces(18,D.ROUND_DOWN).toFixed();h.qty=new D(h.qty).minus(reduction).toDecimalPlaces(18).toFixed();h.comeCotasPaid=sum([h.comeCotasPaid,units(tax)]);l.taxPaid=sum([l.taxPaid,units(tax)]);event(s,"tax",`Come-cotas · ${a.id}`,"Antecipação de imposto reduziu a quantidade de cotas. O crédito fiscal será descontado no resgate.",units(tax),a.id);
 }
}

export function quoteRedemptions(s:Simulation){const l=ensureLab(s);for(const r of [...l.pendingRedemptions!])if(r.quoteDate<=s.date){l.pendingRedemptions=l.pendingRedemptions!.filter(x=>x.id!==r.id);trade(s,r.assetId,"sell",r.qty,r.note,"regressive",true);event(s,"settlement","Resgate cotizado",`${r.assetId}: preço definido nesta data; segue o prazo de pagamento.`,undefined,r.assetId);}}
