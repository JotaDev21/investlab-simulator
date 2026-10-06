import { publishNews } from "./NewsEngine";
import { issuerProfile } from "./CreditEngine";
import type { Simulation,Position } from "../simulation/types";
import { getProduct, annualRate } from "../simulation/products";
import { daysBetween, addMonths } from "../simulation/clock";
import { accrue, SCALE, sum, money, roundCents, formatMoney } from "../simulation/money";
import { decimal, units, D } from "./decimal";
import { ensureLab } from "./PersistenceEngine";
import { yieldAt } from "./EconomyEngine";
import { fixedTax,policy } from "./TaxEngine";
import { cashEvent,event } from "./EventEngine";
export function initializeBond(s:Simulation,p:Position){const product=getProduct(p.productId),term=daysBetween(p.opened,p.maturity)/365,nominal=yieldAt(s,term)+(product.issuer==="Tesouro fictício"?0:ensureLab(s).riskPremium+issuerProfile(product.issuer??"").spreadBps);const market=product.kind==="ipca"?((1+nominal/10000)/(1+s.economy.ipcaBps/10000)-1)*10000:nominal;ensureLab(s).bondCoupons[p.id]={date:p.opened,count:0,grossPaid:"0",inflationAtBuy:s.economy.inflationFactor,marketAtBuy:market};}
export function bondMarketValue(s:Simulation,p:Position,marketBps?:number):string{
 const product=getProduct(p.productId);if(product.liquidity!=="market"||s.date>=p.maturity)return p.balance;
 if(product.kind==="selic")return p.balance;
 const term=Math.max(0,daysBetween(s.date,p.maturity))/365;
 const contracted=product.kind==="ipca"?product.rateBps:annualRate(product,s.economy);
 const nominal=yieldAt(s,term)+(product.issuer==="Tesouro fictício"?0:ensureLab(s).riskPremium+issuerProfile(product.issuer??"").spreadBps),market=product.kind==="ipca"?((1+nominal/10000)/(1+s.economy.ipcaBps/10000)-1)*10000:nominal;
 const current=marketBps??Math.max(0,contracted+market-(ensureLab(s).bondCoupons[p.id]?.marketAtBuy??market));
 // Discount the remaining contracted cash flows. Book balance already includes accrued inflation.
 let date=s.date, value=new D(0), balance=decimal(p.balance), lastCoupon=ensureLab(s).bondCoupons[p.id]?.date??p.opened;
 if(product.couponMonths){let couponDate=addMonths(p.opened,product.couponMonths);while(couponDate<=s.date)couponDate=addMonths(couponDate,product.couponMonths);
  while(couponDate<p.maturity){const period=daysBetween(lastCoupon,couponDate);const couponPrincipal=product.kind==="ipca"?decimal(p.principal).mul(new D(s.economy.inflationFactor).div(ensureLab(s).bondCoupons[p.id]?.inflationAtBuy??SCALE.toString())):decimal(p.principal);const accrued=couponPrincipal.mul(new D(1+contracted/10000).pow(new D(period).div(365)).minus(1));const futureBalance=balance.mul(new D(1+contracted/10000).pow(new D(daysBetween(date,couponDate)).div(365)));const coupon=D.min(futureBalance,accrued);
   value=value.plus(coupon.div(new D(1+current/10000).pow(new D(daysBetween(s.date,couponDate)).div(365))));balance=futureBalance.minus(coupon);date=couponDate;lastCoupon=couponDate;couponDate=addMonths(couponDate,product.couponMonths);}
 }
 const final=balance.mul(new D(1+contracted/10000).pow(new D(daysBetween(date,p.maturity)).div(365)));
 return units(value.plus(final.div(new D(1+current/10000).pow(term))));
}
export function bondTax(s:Simulation,p:Position,value=bondMarketValue(s,p)){return fixedTax(p.principal,value,daysBetween(p.opened,s.date),!!getProduct(p.productId).exempt);}
export function canRedeem(s:Simulation,p:Position){const product=getProduct(p.productId);return p.status==="active"&&!ensureLab(s).failedIssuers.includes(product.issuer??"")&&daysBetween(p.opened,s.date)>=(product.graceDays??0)&&(product.liquidity!=="maturity"||s.date>=p.maturity);}
export function bondSensitivity(s:Simulation,p:Position){const product=getProduct(p.productId),term=Math.max(0,daysBetween(s.date,p.maturity))/365,nominal=yieldAt(s,term)+(product.issuer==="Tesouro fictício"?0:ensureLab(s).riskPremium+issuerProfile(product.issuer??"").spreadBps),market=product.kind==="ipca"?((1+nominal/10000)/(1+s.economy.ipcaBps/10000)-1)*10000:nominal,contracted=product.kind==="ipca"?product.rateBps:annualRate(product,s.economy),rate=Math.max(0,contracted+market-(ensureLab(s).bondCoupons[p.id]?.marketAtBuy??market));const base=decimal(bondMarketValue(s,p,rate)),low=decimal(bondMarketValue(s,p,Math.max(0,rate-1))),high=decimal(bondMarketValue(s,p,rate+1));return{rate,price:units(base),up:bondMarketValue(s,p,rate+100),down:bondMarketValue(s,p,Math.max(0,rate-100)),duration:base.gt(0)?low.minus(high).div(base.mul(".0002")).toNumber():0,convexity:base.gt(0)?high.plus(low).minus(base.mul(2)).div(base.mul(".00000001")).toNumber():0,curve:Array.from({length:21},(_,i)=>{const bps=Math.max(0,rate-200+i*20);return{rate:bps/100,price:decimal(bondMarketValue(s,p,bps)).toNumber()};})};}
export function payCoupon(s:Simulation,p:Position){const product=getProduct(p.productId);if(!product.couponMonths)return;
 const l=ensureLab(s),meta=l.bondCoupons[p.id]??{date:p.opened,count:0,grossPaid:"0",inflationAtBuy:SCALE.toString()};
 if(s.date<addMonths(p.opened,(meta.count+1)*product.couponMonths)||s.date>=p.maturity)return;
 const gain=BigInt(p.balance)>BigInt(p.principal)?BigInt(p.balance)-BigInt(p.principal):0n;
 // Distribute accrued interest, retaining inflation accretion in the principal for IPCA+.
 const inflationPrincipal=product.kind==="ipca"?BigInt(p.principal)*BigInt(accrue(s.economy.inflationFactor,s.economy.ipcaBps))/BigInt(meta.inflationAtBuy):BigInt(p.principal);
 const distributable=BigInt(p.balance)>inflationPrincipal?BigInt(p.balance)-inflationPrincipal:0n;
 const gross=roundCents((product.kind==="ipca"?distributable:gain).toString());if(BigInt(gross)<=0n)return;
 const tax=fixedTax("0",gross,daysBetween(p.opened,s.date),!!product.exempt);
 p.balance=(BigInt(p.balance)-BigInt(gross)).toString();cashEvent(s,tax.net,"coupon",`Juros semestrais ${product.name}. Bruto ${formatMoney(gross)}; imposto ${formatMoney(tax.total)}.`);
 l.taxPaid=sum([l.taxPaid,tax.total]);l.income=sum([l.income,tax.net]);meta.count++;meta.date=s.date;meta.grossPaid=sum([meta.grossPaid,gross]);l.bondCoupons[p.id]=meta;event(s,"dividend","Juros semestrais recebidos",`${product.name}: fluxo entrou no caixa e foi removido do título.`,tax.net,p.id);
}
export function defaultIssuer(s:Simulation,issuer:string){const l=ensureLab(s);if(l.failedIssuers.includes(issuer))return;l.failedIssuers.push(issuer);event(s,"credit",`Emissor insolvente · ${issuer}`,"Evento do cenário fictício. Novas aplicações estão bloqueadas; títulos existentes serão liquidados conforme a garantia configurada.");publishNews(s,`Insolvência de ${issuer}`,"O emissor fictício deixou de cumprir o crédito; a recuperação depende da elegibilidade e dos limites da garantia.");
 let covered=0n;const recent=sum(l.fgcClaims.filter(c=>daysBetween(c.date,s.date)<=1461).map(c=>c.amount));const globalLimit=BigInt(money(policy(l.taxPolicy).fgcFourYears))-BigInt(recent);
 for(const p of s.positions.filter(p=>p.status==="active"&&getProduct(p.productId).issuer===issuer)){const product=getProduct(p.productId),value=bondTax(s,p,p.balance).net;let recovery=0n;if(product.fgc){const cap=BigInt(money(policy(l.taxPolicy).fgcIssuer))-covered;recovery=[BigInt(value),cap,globalLimit-covered].reduce((a,b)=>a<b?a:b);if(recovery<0n)recovery=0n;covered+=recovery;}p.status="defaulted";if(recovery>0n)l.receipts.push({id:`fgc-${s.nextId++}`,amount:recovery.toString(),due:addMonths(s.date,2),reason:`Garantia simulada ${issuer}`});event(s,"credit","Insolvência fictícia",`${issuer}: título encerrado, recuperação elegível ${formatMoney(recovery.toString())}; prazo de garantia simulado de 2 meses.`,(BigInt(value)-recovery).toString(),p.id);}
 if(covered>0n)l.fgcClaims.push({date:s.date,amount:covered.toString()});
}
export function purchaseBond(s:Simulation,productId:string,amount:string,note=""){
 const product=getProduct(productId),l=ensureLab(s);if(BigInt(amount)<BigInt(money(product.minimum))||BigInt(amount)>BigInt(s.cash))throw new Error("Aplicação deve respeitar saldo e mínimo do produto.");if(l.failedIssuers.includes(product.issuer??""))throw new Error("Emissor insolvente.");
 const id=`pos-${s.nextId++}`;cashEvent(s,(-BigInt(amount)).toString(),"fixed-purchase",`Aplicação ${product.name}.`);const p:Position={id,productId,principal:amount,balance:amount,opened:s.date,maturity:addMonths(s.date,product.months),status:"active"};s.positions.push(p);initializeBond(s,p);
 if(note.trim())l.diary.push({id:`diary-${s.nextId++}`,date:s.date,assetId:productId,positionId:id,note,price:amount,operation:"Aplicação"});event(s,"invest",`Aplicação · ${product.name}`,"Capital transferido para título; rendimento começa no avanço do tempo.",amount,id);return p;
}
export function sellBondFraction(s:Simulation,id:string,fraction:number){
 const p=s.positions.find(p=>p.id===id&&p.status==="active");if(!p||!canRedeem(s,p)||!Number.isFinite(fraction)||fraction<=0||fraction>1)throw new Error("Resgate parcial indisponível.");const part={...p,principal:units(decimal(p.principal).mul(fraction)),balance:units(decimal(p.balance).mul(fraction))},tax=bondTax(s,part);
 cashEvent(s,tax.net,"fixed-sale",`Resgate parcial ${(fraction*100).toFixed(4)}% de ${getProduct(p.productId).name}; IR ${formatMoney(tax.ir)} e IOF ${formatMoney(tax.iof)}.`);const l=ensureLab(s);l.taxPaid=sum([l.taxPaid,tax.total]);l.realized=sum([l.realized,(BigInt(tax.net)-BigInt(part.principal)).toString()]);p.principal=(BigInt(p.principal)-BigInt(part.principal)).toString();p.balance=(BigInt(p.balance)-BigInt(part.balance)).toString();if(fraction===1)p.status="redeemed";event(s,"redeem","Resgate parcial de renda fixa","Prazo fiscal e taxa original preservados na parcela restante.",tax.net,p.id);
}
export function holdToMaturity(s:Simulation,p:Position){const product=getProduct(p.productId),days=Math.max(0,daysBetween(s.date,p.maturity)),state=structuredClone(s),position=state.positions.find(x=>x.id===p.id)??structuredClone(p);if(!state.positions.some(x=>x.id===p.id))state.positions.push(position);const initialCash=BigInt(state.cash),initialTax=BigInt(ensureLab(state).taxPaid);for(let i=0;i<days;i++){state.date=importAddDays(state.date,1);position.balance=accrue(position.balance,annualRate(product,s.economy));payCoupon(state,position);state.economy.inflationFactor=accrue(state.economy.inflationFactor,s.economy.ipcaBps);}const finalTax=bondTax(state,position,position.balance),coupons=(BigInt(state.cash)-initialCash).toString();return{days,grossFinal:position.balance,netFinal:finalTax.net,coupons,total:sum([coupons,finalTax.net]),tax:sum([(BigInt(ensureLab(state).taxPaid)-initialTax).toString(),finalTax.total]),inflation:state.economy.inflationFactor,assumedRate:annualRate(product,s.economy)};}
import { addDays as importAddDays } from "../simulation/clock";
