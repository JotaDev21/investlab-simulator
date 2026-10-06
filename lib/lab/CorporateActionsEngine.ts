import type { Simulation } from "../simulation/types";
import { ensureLab } from "./PersistenceEngine";
import { assetById,trade } from "./EquityEngine";
import { decimal,units,D } from "./decimal";
import { addDays } from "../simulation/clock";
import { event } from "./EventEngine";
import { publishNews } from "./NewsEngine";
export function split(s:Simulation,id:string,ratio:number,bonus=false){if(ratio<=0||!Number.isFinite(ratio))throw new Error("Proporção inválida.");const a=assetById(s,id),l=ensureLab(s);a.price=units(decimal(a.price).div(ratio));a.initialPrice=units(decimal(a.initialPrice).div(ratio));if(a.fundamentals)a.fundamentals.shares=new D(a.fundamentals.shares).mul(ratio).toFixed();
 for(const h of l.holdings.filter(h=>h.assetId===id))h.qty=new D(h.qty).mul(ratio).toFixed();
 for(const h of l.shorts.filter(h=>h.assetId===id)){h.qty=new D(h.qty).mul(ratio).toFixed();h.entryPrice=units(decimal(h.entryPrice).div(ratio));}
 for(const f of l.futures!.filter(f=>f.assetId===id)){f.qty=new D(f.qty).mul(ratio).toFixed();f.entryPrice=units(decimal(f.entryPrice).div(ratio));f.lastPrice=units(decimal(f.lastPrice).div(ratio));}
 for(const o of l.options.filter(o=>o.assetId===id)){o.qty=new D(o.qty).mul(ratio).toFixed();o.strike=units(decimal(o.strike).div(ratio));}
 for(const o of l.orders.filter(o=>o.assetId===id&&o.status==="open")){o.qty=new D(o.qty).mul(ratio).toFixed();if(o.limit)o.limit=units(decimal(o.limit).div(ratio));if(o.stop)o.stop=units(decimal(o.stop).div(ratio));}
 event(s,"corporate",`${bonus?"Bonificação":ratio>1?"Desdobramento":"Grupamento"} · ${id}`,`Quantidade multiplicada por ${ratio}; preço dividido pelo mesmo fator. Custo total e patrimônio não mudam por este evento.`,undefined,id);publishNews(s,`${a.name} ajusta número de ações`,"O ajuste modifica quantidades e preços por ação, sem criar riqueza por si só.");}
export function subscription(s:Simulation,id:string){const l=ensureLab(s),a=assetById(s,id),h=l.holdings.find(h=>h.assetId===id);if(h&&new D(h.qty).gt(0))l.subscriptionRights.push({id:`right-${s.nextId++}`,assetId:id,qty:new D(h.qty).mul(.1).floor().toFixed(),price:a.price,expires:addDays(s.date,30),used:false});event(s,"corporate",`Subscrição · ${id}`,"Emissão a preço de mercado, com direito de participação. A subscrição requer caixa e preserva a proporção econômica; não há desconto gratuito.",undefined,id);}
export function exerciseSubscription(s:Simulation,id:string){const l=ensureLab(s),r=l.subscriptionRights.find(r=>r.id===id&&!r.used);if(!r||r.expires<s.date)throw new Error("Direito expirado ou inexistente.");if(new D(r.qty).lte(0))throw new Error("Não há quantidade subscrevível.");const a=assetById(s,r.assetId),current=a.price;a.price=r.price;try{trade(s,a.id,"buy",r.qty,"Exercício do direito de subscrição");r.used=true;}finally{a.price=current;}}
