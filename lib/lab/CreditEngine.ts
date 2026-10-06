import { PRODUCTS } from "../simulation/products";
import type { Simulation } from "../simulation/types";
import { ensureLab } from "./PersistenceEngine";
import { defaultIssuer } from "./FixedIncomeEngine";
import { random } from "../simulation/economy";
export function issuerProfile(issuer:string){const products=PRODUCTS.filter(p=>p.issuer===issuer),government=issuer==="Tesouro fictício",bank=products.some(p=>p.fgc),vertex=issuer==="Financeira Vértice";return{issuer,rating:government?"Soberano fictício":vertex?"BB simulado":bank?"A simulado":"BBB simulado",quarterlyDefault:government?0:vertex?.008:bank?.0008:.002,spreadBps:government?0:vertex?240:bank?90:180,guaranteed:products.some(p=>p.fgc)};}
export function stepCredit(s:Simulation,elapsed:number){if(elapsed<=0||elapsed%90!==0)return;const l=ensureLab(s);for(const issuer of [...new Set(PRODUCTS.map(p=>p.issuer??""))].filter(Boolean).sort()){const profile=issuerProfile(issuer);let draw;[draw,l.macroRng]=random(l.macroRng);const probability=profile.quarterlyDefault*(l.phase==="recession"?3:1)*(l.difficulty==="stress"?2:l.difficulty==="calm"?.4:1);if(draw<probability)defaultIssuer(s,issuer);}}
