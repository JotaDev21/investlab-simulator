import type { Simulation } from "../simulation/types";
import { COURSE,LearningProgress,experimentDone } from "./LearningEngine";
import { GLOSSARY } from "./Glossary";
export const LEVEL_TOPICS=[
 ["percentage","interest","inflation","compound"],
 ["risk","liquidity","term","compound"],
 ["selic","cdi","ipca","cdb","treasury","lci","private-credit","fgc","tax"],
 ["share","market-cap","order","dividend","split","volatility"],
 ["balance-sheet","income-statement","receita","profit","ebitda","margin","ebitda-margin","net-debt","leverage","equity","roe","roic","pe","pb","ev","dy","payout","growth","cashflow","fcf"],
 ["fiis","vacancy","index","tracking","fund-nav","fund-redemption","come","pension"],
 ["diversification","correlation","rebalance","goals","reinvest"],
 ["inflation","selic","currency","cycle","gdp","unemployment","risk-premium"],
 ["volatility","drawdown","sharpe","beta","alpha","twr"],
 ["mtm","duration","convexity","yield-curve"],
 ["option","option-parts","greeks","future","hedge","short","leverage-risk"],
 ["replay","decision","blockchain","custody","crypto-risk"],
];
export function lessonsFor(level:number){const base=COURSE[level];return[{...base,id:`${level}:intro`,topic:null as string|null},...LEVEL_TOPICS[level].map((topic,index)=>{const d=GLOSSARY[topic];if(!d)throw new Error(`Aula sem definição: ${topic}`);const correct=(index+level)%3,answers=["O preço unitário sozinho mede o risco e garante o retorno.","A rentabilidade equivale à soma de aportes e saldo inicial."];answers.splice(correct,0,d.formula);return{level,id:`${level}:${topic}`,topic,title:d.title,concepts:d.title,text:`${d.meaning} ${d.purpose} ${d.limits}`,example:d.example,question:`Qual relação ajuda a interpretar ${d.title.toLowerCase()}?`,answers,correct,reason:`${d.formula}. ${d.limits}`,experiment:level===4?"Avance um dia e inspecione o indicador nas demonstrações de uma empresa; compare os números ao exemplo.":level===10?"Abra ou encerre uma operação avançada e observe prêmio, ajustes ou margem na carteira.":level===11?"Crie um replay, registre uma tese e compare as decisões sob a mesma seed.":`Avance pelo menos um dia no laboratório e consulte ${d.title.toLowerCase()} na aba indicada. Registre na revisão o efeito observado.`,event:level===10?"order":level===11?"diary":"observation"};})];}
export type DetailedProgress=LearningProgress&{lessonCompleted?:string[];lessonPending?:Record<string,{since:string;transaction:number;universeId:string}>;reviews?:Record<string,string>};
export function lessonExperimentDone(s:Simulation,lesson:ReturnType<typeof lessonsFor>[number],p:DetailedProgress){const pending=p.lessonPending?.[lesson.id];if(!pending)return false;if(lesson.level===11)return !!s.lab?.parentUniverseId&&!!s.lab.diary.length;if(pending.universeId!==s.lab?.universeId)return false;const transactions=s.transactions.slice(pending.transaction);if(lesson.level===10)return transactions.some(t=>/opção|futuro|short/i.test(t.title));if(lesson.topic===null&&[3,5].includes(lesson.level))return transactions.some(t=>{const a=s.lab?.assets.find(a=>a.id===t.positionId);return a&&(lesson.level===3?a.class==="stock"&&s.lab?.diary.some(d=>d.assetId===a.id&&d.date>=pending.since):["fii","etf","fund"].includes(a.class));});if(lesson.topic===null)return experimentDone(s,lesson.level,pending.since,pending.transaction);return s.date>pending.since;}

export function completeLesson(p:DetailedProgress,id:string,review:string){if(review.trim().length<12)throw new Error("Registre pelo menos uma frase sobre o que observou.");const done=[...new Set([...(p.lessonCompleted??[]),id])],level=Number(id.split(":")[0]),all=lessonsFor(level).every(l=>done.includes(l.id));return{...p,lessonCompleted:done,reviews:{...p.reviews,[id]:review.trim()},completed:all?[...new Set([...p.completed,level])]:p.completed};}
