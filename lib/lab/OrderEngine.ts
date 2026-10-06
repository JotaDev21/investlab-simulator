import type { Simulation } from "../simulation/types";
import type { Order } from "./types";
import { ensureLab } from "./PersistenceEngine";
import { assetById,trade } from "./EquityEngine";
import { decimal,quantity } from "./decimal";
export function placeOrder(s:Simulation,input:Omit<Order,"id"|"triggered"|"status"|"created">){
 const l=ensureLab(s);assetById(s,input.assetId);const full= input.side==="sell"&&l.holdings.find(h=>h.assetId===input.assetId&&h.qty===input.qty);if(!full)quantity(input.qty,true);
 if(!["market","limit","stop","stop-limit"].includes(input.kind)||!["buy","sell"].includes(input.side))throw new Error("Tipo de ordem inválido.");
 if(["limit","stop-limit"].includes(input.kind)&&(!input.limit||decimal(input.limit).lte(0)))throw new Error("Informe preço limite positivo.");
 if(["stop","stop-limit"].includes(input.kind)&&(!input.stop||decimal(input.stop).lte(0)))throw new Error("Informe preço de disparo positivo.");
 const o:Order={...input,id:`order-${s.nextId++}`,triggered:false,status:"open",created:s.date};l.orders.push(o);executeOrders(s);return o;
}
export function executeOrders(s:Simulation){for(const o of ensureLab(s).orders.filter(o=>o.status==="open")){const price=decimal(assetById(s,o.assetId).price);if(o.kind.includes("stop")&&!o.triggered){o.triggered=o.side==="buy"?price.gte(decimal(o.stop!)):price.lte(decimal(o.stop!));}const triggered=!o.kind.includes("stop")||o.triggered,limit=!o.kind.includes("limit")||(o.side==="buy"?price.lte(decimal(o.limit!)):price.gte(decimal(o.limit!)));if(triggered&&limit){try{trade(s,o.assetId,o.side,o.qty,o.note,o.pensionRegime);o.status="executed";o.executedDate=s.date;}catch(e){o.status="rejected";o.reason=(e as Error).message;}}}}
export function cancelOrder(s:Simulation,id:string){const o=ensureLab(s).orders.find(o=>o.id===id&&o.status==="open");if(!o)throw new Error("Ordem aberta não encontrada.");o.status="cancelled";}
