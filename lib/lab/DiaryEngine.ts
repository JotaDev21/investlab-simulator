import type { Simulation } from "../simulation/types";
import type { DiaryEntry } from "./types";
import { ensureLab } from "./PersistenceEngine";
import { assetById } from "./EquityEngine";
import { bondMarketValue } from "./FixedIncomeEngine";
import { event } from "./EventEngine";
export function diaryObservation(s:Simulation,e:DiaryEntry){const l=ensureLab(s),p=e.positionId?s.positions.find(p=>p.id===e.positionId):null;if(p){const final=s.transactions.findLast(t=>t.positionId===p.id&&["redeem","maturity"].includes(t.type));return{price:p.status==="active"?bondMarketValue(s,p):p.status==="defaulted"?"0":final?.amount??p.balance,currency:"BRL",label:p.status==="active"?"Valor de mercado atual":"Valor líquido no encerramento",inspect:p.id};}if(e.assetId==="USD"||e.assetId==="EUR")return{price:e.assetId==="USD"?l.usd:l.eur,currency:"BRL",label:"Câmbio à vista atual (futuro inclui carregamento)",inspect:"macro"};const a=assetById(s,e.assetId);return{price:a.price,currency:a.currency,label:"Cotação local atual do ativo-objeto",inspect:a.id};}
export function reviewThesis(s:Simulation,id:string,note:string){if(note.trim().length<12)throw new Error("Registre uma frase sobre o resultado, a hipótese e os riscos.");const e=ensureLab(s).diary.find(e=>e.id===id);if(!e)throw new Error("Tese não encontrada.");e.reviews??=[];e.reviews.push({date:s.date,note:note.trim(),price:diaryObservation(s,e).price});event(s,"diary","Tese revisada","A hipótese original foi preservada; a revisão registra as informações disponíveis nesta data.",undefined,e.assetId);}
