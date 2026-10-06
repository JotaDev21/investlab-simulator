import type { Simulation } from "../simulation/types";
import { ensureLab } from "./PersistenceEngine";
/** News only reports existing engine events. It never writes a price. */
export function publishNews(s:Simulation,title:string,detail:string){ensureLab(s).news.push({id:`news-${s.nextId++}`,date:s.date,title,detail});}
