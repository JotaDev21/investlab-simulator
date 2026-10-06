import { decimal } from "./decimal";
import type { Simulation } from "../simulation/types";
import { createSimulation,refreshSnapshot } from "../simulation/engine";
import { money } from "../simulation/money";
import { ensureLab } from "./PersistenceEngine";
import type { Lab } from "./types";
export function createUniverse(input:{name:string;initial:string;seed:number;startDate:string;inflationBps:number;interestBps:number;difficulty:Lab["difficulty"]}):Simulation{
 const s=createSimulation(input.seed);if(BigInt(money(input.initial))<=0n)throw new Error("Saldo inicial positivo obrigatório.");if(!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)||!Number.isFinite(Date.parse(input.startDate))||new Date(input.startDate+"T00:00:00Z").toISOString().slice(0,10)!==input.startDate||input.startDate<"1900-01-01"||input.startDate>"2099-12-31")throw new Error("Use uma data válida entre 1900 e 2099.");for(const n of [input.inflationBps,input.interestBps])if(!Number.isInteger(n)||n<0||n>4000)throw new Error("Taxas iniciais entre 0% e 40%.");
 s.date=input.startDate;s.cash=money(input.initial);s.initial=s.cash;s.economy.selicBps=input.interestBps;s.economy.cdiBps=Math.max(0,input.interestBps-10);s.economy.ipcaBps=input.inflationBps;s.snapshots=[];s.transactions=s.transactions.map(t=>({...t,date:s.date,amount:s.initial,detail:"Dinheiro fictício inicial do universo personalizado."}));delete s.lab;const l=ensureLab(s);l.startDate=s.date;l.marketStart=s.date;l.settings={initial:s.initial,seed:s.seed,startDate:s.date,inflationBps:input.inflationBps,interestBps:input.interestBps,difficulty:input.difficulty};l.universeId=`u-${s.seed}-${s.date}-${input.name}`;l.name=input.name.trim()||"Novo universo";l.difficulty=input.difficulty;refreshSnapshot(s);return s;
}
export function replayUniverse(old:Simulation){const l=ensureLab(old),settings=l.settings;const replay=createUniverse({name:`${l.name} · replay`,initial:decimal(settings.initial).toFixed(2),seed:settings.seed,startDate:settings.startDate,inflationBps:settings.inflationBps,interestBps:settings.interestBps,difficulty:settings.difficulty});ensureLab(replay).parentUniverseId=l.universeId;return replay;}
