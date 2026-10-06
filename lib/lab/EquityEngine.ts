import { pensionLots,pensionSale } from "./PensionLotEngine";
import type { Simulation } from "../simulation/types";
import type { Asset,Holding,Order } from "./types";
import { ensureLab } from "./PersistenceEngine";
import { decimal,units,D,quantity } from "./decimal";
import { sum,roundCents,formatMoney } from "../simulation/money";
import { gainTax,pensionTax } from "./TaxEngine";
import { daysBetween,addDays } from "../simulation/clock";
import { cashEvent,event } from "./EventEngine";
export function assetById(s:Simulation,id:string):Asset{const a=ensureLab(s).assets.find(a=>a.id===id);if(!a)throw new Error("Ativo não encontrado.");return a;}
export function fx(s:Simulation,currency:string){const l=ensureLab(s);return currency==="USD"?l.usd:currency==="EUR"?l.eur:units(1);}
export function assetBRL(s:Simulation,a:Asset){return units(decimal(a.price).mul(decimal(fx(s,a.currency))));}
export function holdingValue(s:Simulation,h:Holding){return units(decimal(assetBRL(s,assetById(s,h.assetId))).mul(h.qty));}
export function averagePrice(h:Holding,local=false){return new D(h.qty).gt(0)?units(decimal(local?h.localCost:h.cost).div(h.qty)):"0";}
export function saleTax(s:Simulation,h:Holding,gross:string,cost=h.cost){const a=assetById(s,h.assetId),l=ensureLab(s);if(a.class==="pension")return new D(h.qty).gt(0)?pensionSale(h,h.qty,gross,s.date,a.id==="PGBL").tax:"0";if(a.class==="fund"){const full=gainTax((BigInt(gross)+BigInt(h.comeCotasPaid)-BigInt(cost)).toString(),"fund",l.taxPolicy);return BigInt(full)>BigInt(h.comeCotasPaid)?(BigInt(full)-BigInt(h.comeCotasPaid)).toString():"0";}return gainTax((BigInt(gross)-BigInt(cost)).toString(),a.taxCategory,l.taxPolicy);}
export function trade(s:Simulation,assetId:string,side:"buy"|"sell",qtyInput:string,note="",regime:"progressive"|"regressive"="regressive",settlePending=false){
 const l=ensureLab(s),a=assetById(s,assetId);if(a.bankrupt||BigInt(a.price)<=0n)throw new Error("Este ativo não está disponível para negociação.");
 let h=l.holdings.find(h=>h.assetId===assetId);
 // Internal events such as come-cotas can create more than eight fractional digits.
 const fullSale=side==="sell"&&h&&new D(qtyInput).eq(h.qty)&&new D(h.qty).gt(0);
 const qty=fullSale||settlePending?new D(qtyInput).toFixed():quantity(qtyInput,true),local=units(decimal(a.price).mul(qty)),gross=roundCents(units(decimal(assetBRL(s,a)).mul(qty)));
 if(side==="sell"&&!settlePending){const reserved=l.pendingRedemptions!.filter(r=>r.assetId===assetId).reduce((v,r)=>v.plus(r.qty),new D(0));if(!h||new D(h.qty).minus(reserved).lt(qty))throw new Error("Quantidade já reservada para cotização ou maior que sua posição.");if(a.class==="fund"&&(a.quotationDays??0)>0){l.pendingRedemptions!.push({id:`redemption-${s.nextId++}`,assetId,qty,requested:s.date,quoteDate:addDays(s.date,a.quotationDays!),note});event(s,"redemption","Resgate solicitado",`Cotas reservadas até D+${a.quotationDays}; valor definido pela cota futura e pagamento D+${a.settlementDays} após cotização.`,undefined,assetId);return;}}
 if(side==="buy"&&a.class==="pension"&&h&&new D(h.qty).gt(0)&&h.pensionRegime!==regime)throw new Error("A posição previdenciária existente usa outro regime. Compare regimes em universos separados.");
 if(side==="buy"&&h&&new D(h.qty).eq(0)){h.opened=s.date;h.pensionRegime=regime;}
 if(side==="buy"){if(BigInt(s.cash)<BigInt(gross))throw new Error("Saldo fictício insuficiente.");if(BigInt(gross)<=0n)throw new Error("Operação abaixo de um centavo.");cashEvent(s,(-BigInt(gross)).toString(),"purchase",`Compra ${qty} ${a.id} por ${formatMoney(gross)}.`);if(!h){h={assetId,qty:"0",cost:"0",localCost:"0",opened:s.date,realized:"0",income:"0",comeCotasPaid:"0",pensionRegime:regime};l.holdings.push(h);}if(a.class==="pension")h.pensionLots=[...pensionLots(h),{qty,cost:gross,localCost:local,date:s.date}];h.qty=new D(h.qty).plus(qty).toFixed();h.cost=sum([h.cost,gross]);h.localCost=sum([h.localCost,local]);}
 else{if(!h||new D(h.qty).lt(qty))throw new Error("Quantidade maior que sua posição.");const lotSale=a.class==="pension"?pensionSale(h,qty,gross,s.date,a.id==="PGBL"):null;const fraction=new D(qty).div(h.qty),cost=lotSale?.cost??units(decimal(h.cost).mul(fraction)),localCost=lotSale?.localCost??units(decimal(h.localCost).mul(fraction)),prepaid=units(decimal(h.comeCotasPaid).mul(fraction));const tax=lotSale?.tax??saleTax(s,{...h,comeCotasPaid:prepaid},gross,cost),net=(BigInt(gross)-BigInt(tax)).toString();h.realized=sum([h.realized,(BigInt(net)-BigInt(cost)).toString()]);l.realized=sum([l.realized,(BigInt(net)-BigInt(cost)).toString()]);l.taxPaid=sum([l.taxPaid,tax]);if(lotSale)h.pensionLots=lotSale.remaining;h.qty=new D(h.qty).minus(qty).toFixed();h.cost=(BigInt(h.cost)-BigInt(cost)).toString();h.localCost=(BigInt(h.localCost)-BigInt(localCost)).toString();h.comeCotasPaid=(BigInt(h.comeCotasPaid)-BigInt(prepaid)).toString();if(a.settlementDays>0)l.receipts.push({id:`receipt-${s.nextId++}`,amount:net,due:addDays(s.date,a.settlementDays),reason:`Resgate ${a.name}: cotização hoje, pagamento D+${a.settlementDays}`});else cashEvent(s,net,"sale",`Venda ${qty} ${a.id}; imposto efetivo ${formatMoney(tax)}.`);}
 if(note.trim())l.diary.push({id:`diary-${s.nextId++}`,date:s.date,assetId,note:note.trim(),price:a.price,operation:side});event(s,"order",`${side==="buy"?"Compra":"Venda"} · ${a.id}`,`${qty} unidades a ${a.currency} ${decimal(a.price).toFixed(2)}. ${a.settlementDays&&side==="sell"?`Recebimento em D+${a.settlementDays}.`:"Liquidação fictícia imediata."}`,gross,assetId);
}
export function orderBook(s:Simulation,id:string){const a=assetById(s,id);return [1,2,3].map(i=>({bid:units(decimal(a.price).mul(1-i*.001)),ask:units(decimal(a.price).mul(1+i*.001)),qty:100*i}));}
