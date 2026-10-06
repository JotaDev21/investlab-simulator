import type { Simulation } from "../simulation/types";
import { sum } from "../simulation/money";
import { ensureLab } from "./PersistenceEngine";
export function cashEvent(s: Simulation,delta:string,source:string,detail:string){const l=ensureLab(s),before=s.cash;s.cash=sum([s.cash,delta]);l.audit.push({id:`audit-${s.nextId++}`,date:s.date,source,delta,before,after:s.cash,detail});}
export function event(s:Simulation,type:string,title:string,detail:string,amount?:string,assetId?:string){const l=ensureLab(s),id=`event-${s.nextId++}`;l.events.push({id,date:s.date,type,detail,...(assetId?{assetId}:{})});s.transactions.push({id,date:s.date,type:"lab",title,detail,...(amount!==undefined?{amount}:{}),...(assetId?{positionId:assetId}:{})});}
