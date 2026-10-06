import { D } from "./decimal";
import { TAX_POLICIES,registerTaxRules } from "./TaxEngine";
import { createAssets } from "./catalog";
import type { Lab } from "./types";
import type { Simulation } from "../simulation/types";
import { money,accrue } from "../simulation/money";
export function ensureLab(s: Simulation): Lab {
  if(s.lab) {if(s.lab.taxRules)registerTaxRules(s.lab.taxRules);s.lab.futures??=[];s.lab.pendingRedemptions??=[];return s.lab;}
  const startDate=s.snapshots[0]?.date ?? s.date;
  s.lab={schema:2,universeId:`u-${s.seed}-${startDate}`,name:"Meu universo",startDate,marketStart:s.date,difficulty:"normal",settings:{initial:s.initial,seed:s.seed,startDate,inflationBps:s.snapshots[0]?.ipcaBps??s.economy.ipcaBps,interestBps:s.snapshots[0]?.selicBps??s.economy.selicBps,difficulty:"normal"},assets:createAssets(s.seed),holdings:[],orders:[],receipts:[],shorts:[],options:[],futures:[],pendingRedemptions:[],audit:[],diary:[],schedules:[],contributions:"0",withdrawn:"0",income:"0",taxPaid:"0",realized:"0",debt:"0",usd:money("5.20"),eur:money("5.65"),macroRng:(s.seed ^ 0x75f838)>>>0||1,sentiment:0,unemployment:7.5,gdpGrowth:2,gdp:money("1000000000000"),riskPremium:200,phase:"recovery",curve:[{years:.25,bps:s.economy.selicBps},{years:1,bps:s.economy.selicBps+25},{years:3,bps:s.economy.selicBps+50},{years:5,bps:s.economy.selicBps+75},{years:10,bps:s.economy.selicBps+100}],news:[],events:[],subscriptionRights:[],taxPolicy:"lab-2026-v1",fgcClaims:[],failedIssuers:[],bondCoupons:{},target:{fixed:40,stock:30,etf:20,fii:10},rebalanceEvery:0,lastRebalance:s.date,pauses:[],viewReal:false,challenges:[]}; return s.lab;
}
export function migrate(s: Simulation): Simulation { const next=structuredClone(s);ensureLab(next);let reference=money("1000");for(let i=0;i<next.snapshots.length;i++){if(i>0)reference=accrue(reference,next.snapshots[i-1].cdiBps);next.snapshots[i].trueCdiBenchmark??=reference;}return next; }
export function validateLab(l: Lab) {
  if(l.taxRules){registerTaxRules(l.taxRules);if(l.taxRules.id!==l.taxPolicy)throw new Error("Versão tributária inconsistente.");}
  if(l.schema!==2 || !Array.isArray(l.assets)||!Array.isArray(l.holdings)||!Array.isArray(l.orders)||!Array.isArray(l.audit)||!Array.isArray(l.shorts)||!Array.isArray(l.options)||!Array.isArray(l.receipts)) throw new Error("Universo inválido.");
  for(const n of [l.usd,l.eur,l.contributions,l.withdrawn,l.debt]) if(!/^\d{1,50}$/.test(n)) throw new Error("Valor inválido no universo.");
  for(const a of l.assets) if(!/^\d{1,50}$/.test(a.price)||!a.id||!Number.isFinite(a.volatility)) throw new Error("Ativo inválido.");
  for(const h of l.holdings) if(!/^\d+(\.\d+)?$/.test(h.qty)||!/^\d{1,50}$/.test(h.cost)||!l.assets.some(a=>a.id===h.assetId)) throw new Error("Posição inválida.");
  const arrays=[l.news,l.events,l.schedules,l.diary,l.subscriptionRights,l.failedIssuers,l.fgcClaims,l.challenges,l.pauses];if(arrays.some(v=>!Array.isArray(v))||!l.settings||!l.target||!l.bondCoupons||!Array.isArray(l.curve)||!l.curve.length||!l.universeId||!TAX_POLICIES[l.taxPolicy])throw new Error("Metadados do universo inválidos.");
  const amount=(v:unknown)=>typeof v==="string"&&/^\d{1,50}$/.test(v),signed=(v:unknown)=>typeof v==="string"&&/^-?\d{1,50}$/.test(v),qty=(v:unknown)=>typeof v==="string"&&/^\d+(\.\d{1,24})?$/.test(v)&&Number.isFinite(Number(v));
  for(const v of [l.income,l.taxPaid,l.gdp])if(!amount(v))throw new Error("Saldo inválido.");if(!signed(l.realized))throw new Error("Resultado inválido.");
  for(const h of l.holdings)if(!qty(h.qty)||![h.localCost,h.income,h.comeCotasPaid].every(amount)||!signed(h.realized))throw new Error("Custos da posição inválidos.");
  for(const a of l.audit)if(![a.before,a.after,a.delta].every(signed)||BigInt(a.before)+BigInt(a.delta)!==BigInt(a.after))throw new Error("Auditoria de caixa inconsistente.");
  for(const r of l.receipts)if(!amount(r.amount)||!/^\d{4}-\d{2}-\d{2}$/.test(r.due))throw new Error("Recebível inválido.");
  for(const a of l.assets)if(!amount(a.initialPrice)||!amount(a.feesPaid)||!Number.isFinite(a.rng)||!Number.isFinite(a.annualDividend)||!Number.isFinite(a.adminBps)||!Number.isFinite(a.momentum))throw new Error("Características do ativo inválidas.");
  for(const o of [...l.shorts,...l.options])if(!qty(o.qty)||Number(o.qty)<=0||!l.assets.some(a=>a.id===o.assetId))throw new Error("Contrato inválido.");
  for(const f of l.futures??[])if(!qty(f.qty)||Number(f.qty)<=0||!qty(f.multiplier)||Number(f.multiplier)<=0||![f.entryPrice,f.lastPrice,f.collateral].every(amount)||!signed(f.pnl)||(!["USD","EUR"].includes(f.assetId)&&!l.assets.some(a=>a.id===f.assetId)))throw new Error("Contrato futuro inválido.");
  const validDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
  if(l.futures&&!Array.isArray(l.futures)||l.pendingRedemptions&&!Array.isArray(l.pendingRedemptions))throw new Error("Contratos ou resgates inválidos.");
  for(const f of l.futures??[])if(!validDate(f.expires)||!validDate(f.opened)||!["long","short"].includes(f.side))throw new Error("Prazo de futuro inválido.");
  for(const r of l.pendingRedemptions??[])if(!qty(r.qty)||Number(r.qty)<=0||!validDate(r.requested)||!validDate(r.quoteDate)||!l.assets.some(a=>a.id===r.assetId&&a.class==="fund"))throw new Error("Resgate pendente inválido.");
  for(const h of l.holdings){const reserved=(l.pendingRedemptions??[]).filter(r=>r.assetId===h.assetId).reduce((v,r)=>v.plus(r.qty),new D(0));if(reserved.gt(h.qty))throw new Error("Cotas reservadas excedem a posição.");if(h.pensionLots){if(!Array.isArray(h.pensionLots)||h.pensionLots.some(t=>!qty(t.qty)||Number(t.qty)<=0||!amount(t.cost)||!amount(t.localCost)||!validDate(t.date)))throw new Error("Lote previdenciário inválido.");if(h.pensionLots.reduce((v,t)=>v.plus(t.qty),new D(0)).minus(h.qty).abs().gt("1e-16")||h.pensionLots.reduce((v,t)=>v+BigInt(t.cost),0n)!==BigInt(h.cost))throw new Error("Lotes não reconciliam a posição.");}}
  for(const a of l.assets){if(a.history&&(!Array.isArray(a.history)||a.history.length>3651||a.history.some((v,i)=>!validDate(v.date)||!amount(v.price)||!Number.isFinite(v.totalIndex)||v.totalIndex<0||i>0&&v.date<=a.history![i-1].date)))throw new Error("Histórico de ativo inválido.");if(a.circulatingSupply&&!qty(a.circulatingSupply))throw new Error("Oferta circulante inválida.");}
  if(new Set(l.assets.map(a=>a.id)).size!==l.assets.length)throw new Error("Ativos duplicados.");
}
