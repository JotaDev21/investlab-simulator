import { addDays } from "../simulation/clock";
import type { Simulation } from "../simulation/types";
import { ensureLab } from "./PersistenceEngine";
import { random } from "../simulation/economy";
import { decimal, units, equivalentRate } from "./decimal";
import { publishNews } from "./NewsEngine";
import { event } from "./EventEngine";
export function stepIntegratedEconomy(s:Simulation,days:number){
 const l=ensureLab(s);let draw;[draw,l.macroRng]=random(l.macroRng);
 if(l.shock&&l.shock.until<s.date)delete l.shock;
 if(days>0&&days%30===0){let shockDraw;[shockDraw,l.macroRng]=random(l.macroRng);if(!l.shock&&shockDraw<(l.difficulty==="stress"?.06:.018)){const kinds=["financial-crisis","inflation-shock","commodity-shock","euphoria","recovery"] as const,kind=kinds[Math.min(4,Math.floor(shockDraw/(l.difficulty==="stress"?.06:.018)*5))];applyMacroShock(s,kind);}}
 const stress=l.difficulty==="stress"?1.8:l.difficulty==="calm"?.55:1;
 l.sentiment=l.sentiment*.96+(draw-.5)*.035*stress;
 if(days%30===0){
  const phases=["expansion","slowdown","recession","recovery"] as const;
  if(draw<.28*stress){const i=phases.indexOf(l.phase);l.phase=phases[(i+(draw<.07?3:1))%4];}
  const target={expansion:3.7,slowdown:1,recession:-2,recovery:2.2}[l.phase];
  l.gdpGrowth=l.gdpGrowth*.8+target*.2+(draw-.5)*stress;
  l.unemployment=Math.max(3,Math.min(18,l.unemployment-l.gdpGrowth*.05+(draw-.5)*.1));
  l.riskPremium=Math.max(80,Math.min(950,Math.round(l.riskPremium*.9+(l.phase==="recession"?450:150)*.1)));
  if(l.phase==="recession"&&draw<.1){l.sentiment-=.12;event(s,"macro","Choque de confiança","Recessão e crédito mais caro reduziram expectativas de lucro. Diferentes ativos podem reagir de formas distintas.");publishNews(s,"Confiança recua no universo fictício","O cenário de crédito e atividade deteriorou-se; os preços reagirão também a fundamentos e expectativas.");}
 }
 const fxChange=(l.riskPremium-200)/10000000+(draw-.5)*.002*stress+l.sentiment*-.002;
 l.usd=units(decimal(l.usd).mul(1+fxChange));l.eur=units(decimal(l.eur).mul(1+fxChange*.8+(draw-.5)*.0006));
 l.gdp=units(decimal(l.gdp).mul(equivalentRate(Math.max(-.1,l.gdpGrowth/100),1).plus(1)));
 l.curve=[.25,1,3,5,10].map(years=>({years,bps:Math.round(s.economy.selicBps+(years-.25)*(l.phase==="recession"?-15:15)+l.riskPremium*years/30)}));
}
export function yieldAt(s:Simulation,years:number){const curve=ensureLab(s).curve;const upper=curve.find(x=>x.years>=years)??curve.at(-1)!;const lower=curve.filter(x=>x.years<=years).at(-1)??curve[0];return lower.years===upper.years?lower.bps:lower.bps+(upper.bps-lower.bps)*(years-lower.years)/(upper.years-lower.years);}

export function applyMacroShock(s:Simulation,kind:NonNullable<import("./types").Lab["shock"]>["kind"]){const l=ensureLab(s);l.shock={kind,started:s.date,until:addDays(s.date,60),strength:1};const descriptions={"financial-crisis":["Crise financeira fictícia","Crédito contraiu, prêmio de risco aumentou e atividade caiu; preços reagem ao custo de capital e à liquidez."],"inflation-shock":["Inflação inesperada","Pressão de preços elevou o IPCA e as expectativas de juros; títulos e resultados reagem de maneiras diferentes."],"commodity-shock":["Choque de commodities","Preços de commodities subiram: produtores e consumidores recebem impulsos diferentes nas margens."],euphoria:["Euforia fictícia","Sentimento e prêmio de risco mudaram sem eliminar incerteza; cotação e fundamentos podem divergir."],recovery:["Recuperação econômica","Crédito e expectativas melhoraram após atividade fraca; a recuperação permanece incerta."]};if(kind==="financial-crisis"){l.phase="recession";l.riskPremium=Math.min(950,l.riskPremium+220);l.gdpGrowth-=1.5;l.sentiment-=.12;}if(kind==="inflation-shock"){s.economy.ipcaBps=Math.min(4000,s.economy.ipcaBps+200);l.riskPremium=Math.min(950,l.riskPremium+80);}if(kind==="euphoria"){l.sentiment+=.15;l.riskPremium=Math.max(80,l.riskPremium-60);}if(kind==="recovery"){l.phase="recovery";l.gdpGrowth+=1;l.sentiment+=.06;}const [title,detail]=descriptions[kind];event(s,"macro",title,detail);publishNews(s,title,detail);}
