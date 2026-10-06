import type { Holding } from "./types";
import { decimal,units,D } from "./decimal";
import { pensionTax } from "./TaxEngine";
import { daysBetween } from "../simulation/clock";
import { sum } from "../simulation/money";
export function pensionLots(h:Holding){return h.pensionLots??(new D(h.qty).gt(0)?[{qty:h.qty,cost:h.cost,localCost:h.localCost,date:h.opened}]:[]);}
export function pensionSale(h:Holding,quantity:string,gross:string,date:string,pgbl:boolean){let need=new D(quantity),total=new D(quantity);const consumed:{qty:string;cost:string;localCost:string;date:string}[]=[],remaining:typeof consumed=[];for(const lot of pensionLots(h)){const taken=D.min(need,new D(lot.qty)),fraction=taken.div(lot.qty);if(taken.gt(0))consumed.push({...lot,qty:taken.toFixed(),cost:units(decimal(lot.cost).mul(fraction)),localCost:units(decimal(lot.localCost).mul(fraction))});const left=new D(lot.qty).minus(taken);if(left.gt(0))remaining.push({...lot,qty:left.toFixed(),cost:(BigInt(lot.cost)-BigInt(units(decimal(lot.cost).mul(fraction)))).toString(),localCost:units(decimal(lot.localCost).mul(new D(1).minus(fraction)))});need=need.minus(taken);}
 if(need.gt("1e-16"))throw new Error("Lotes previdenciários insuficientes.");const taxes=consumed.map(lot=>pensionTax(lot.cost,units(decimal(gross).mul(new D(lot.qty).div(total))),daysBetween(lot.date,date),pgbl,h.pensionRegime??"regressive"));return{cost:sum(consumed.map(l=>l.cost)),localCost:sum(consumed.map(l=>l.localCost)),tax:sum(taxes),remaining,consumed};}
