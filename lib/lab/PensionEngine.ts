import { pensionLots } from "./PensionLotEngine";
import { sum } from "../simulation/money";
import { D,decimal,units,equivalentRate } from "./decimal";
import { pensionTax } from "./TaxEngine";
import type { Simulation } from "../simulation/types";
import { assetById,holdingValue } from "./EquityEngine";
import { daysBetween } from "../simulation/clock";
export function pensionProjection(s:Simulation,id:string,monthly:string,years:number,incomeYears:number,regime:"progressive"|"regressive"){
 if(!Number.isInteger(years)||years<1||years>50||!Number.isInteger(incomeYears)||incomeYears<1||incomeYears>50||decimal(monthly).lt(0))throw new Error("Use horizontes de 1 a 50 anos e contribuição não negativa.");
 const a=assetById(s,id),h=s.lab?.holdings.find(h=>h.assetId===id),current=h?decimal(holdingValue(s,h)):new D(0),cost=h?decimal(h.cost):new D(0),annual=new D(1).plus(new D(s.economy.cdiBps).div(10000)).div(new D(1).plus(new D(a.adminBps).div(10000))).minus(1),r=equivalentRate(annual,new D(365).div(12)),n=years*12,growth=r.plus(1).pow(n),annuity=r.eq(0)?new D(n):growth.minus(1).div(r),end=current.mul(growth).plus(decimal(monthly).mul(annuity)),capital=cost.plus(decimal(monthly).mul(n)),tax=sum([...(h?pensionLots(h).map(l=>pensionTax(l.cost,units(current.mul(new D(l.qty).div(h.qty)).mul(growth)),daysBetween(l.date,s.date)+years*365,id==="PGBL",regime)):[]),...Array.from({length:n},(_,i)=>pensionTax(monthly,units(decimal(monthly).mul(r.plus(1).pow(n-i-1))),(n-i-1)*365/12,id==="PGBL",regime))]),net=end.minus(decimal(tax));
 return{gross:units(end),capital:units(capital),tax,net:units(net),income:units(net.div(incomeYears*12)),real:units(net.div(new D(s.economy.inflationFactor).div("1e18").mul(new D(1).plus(new D(s.economy.ipcaBps).div(10000)).pow(years)))),annual:annual.toNumber(),months:n};
}
