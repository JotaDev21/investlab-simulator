export { addDays,addMonths,daysBetween,formatDate } from "../simulation/clock";
export const CONVENTIONS={year:365,days:"Actual/365, dias corridos",businessDays:"segunda a sexta, sem feriados no modelo",rounding:"half-up aos centavos na liquidação",equivalent:"(1 + taxa anual)^(dias / 365) − 1"};
export function businessDay(date:string){const d=new Date(date+"T12:00:00Z").getUTCDay();return d!==0&&d!==6;}
