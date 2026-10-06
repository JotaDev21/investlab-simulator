import type { Economy } from "./economy";
export type Product = { id: string; name: string; short: string; kind: "fixed" | "cdi" | "ipca" | "selic"; rateBps: number; minimum: string; months: number; liquidity: "daily" | "maturity" | "market"; risk: string; color: string; description: string; issuer?:string; graceDays?:number; exempt?:boolean; fgc?:boolean; couponMonths?:number; benchmark?:string };
export const PRODUCTS: Product[] = [
  { id: "fixed", name: "CDB Prefixado", short: "Prefixado", kind: "fixed", rateBps: 1000, minimum: "100", months: 24, liquidity: "maturity", risk: "Baixo a moderado", color: "#ad92f3", description: "Uma taxa combinada no início. Você conhece a regra de rendimento e aprende como o tempo multiplica seu dinheiro." },
  { id: "cdi", name: "CDB 110% do CDI", short: "110% CDI", kind: "cdi", rateBps: 11000, minimum: "100", months: 24, liquidity: "daily", risk: "Baixo a moderado", color: "#bded86", description: "Seu rendimento acompanha o CDI simulado. Quando os juros da economia mudam, o ritmo do seu investimento muda junto." },
];
const fixedProducts:Product[]=[
 {id:"t-selic",name:"Tesouro Selic Lab",kind:"selic",rateBps:0,months:36,liquidity:"market",issuer:"Tesouro fictício",benchmark:"Selic"},
 {id:"t-fixed",name:"Tesouro Prefixado Lab",kind:"fixed",rateBps:1050,months:48,liquidity:"market",issuer:"Tesouro fictício",benchmark:"CDI"},
 {id:"t-fixed-coupon",name:"Tesouro Prefixado · semestral",kind:"fixed",rateBps:1000,months:48,liquidity:"market",couponMonths:6,issuer:"Tesouro fictício",benchmark:"CDI"},
 {id:"t-ipca",name:"Tesouro IPCA+ Lab",kind:"ipca",rateBps:600,months:60,liquidity:"market",issuer:"Tesouro fictício",benchmark:"IPCA"},
 {id:"t-ipca-coupon",name:"Tesouro IPCA+ · semestral",kind:"ipca",rateBps:600,months:60,liquidity:"market",couponMonths:6,issuer:"Tesouro fictício",benchmark:"IPCA"},
 {id:"cdb-ipca",name:"CDB IPCA+",kind:"ipca",rateBps:550,months:36,liquidity:"maturity",issuer:"Banco Aurora",fgc:true,benchmark:"IPCA"},
 {id:"lci",name:"LCI Horizonte",kind:"cdi",rateBps:9500,months:24,liquidity:"daily",graceDays:270,issuer:"Banco Horizonte",fgc:true,exempt:true,benchmark:"CDI"},
 {id:"lca",name:"LCA Campo",kind:"cdi",rateBps:9700,months:24,liquidity:"daily",graceDays:270,issuer:"Banco Horizonte",fgc:true,exempt:true,benchmark:"CDI"},
 {id:"lc",name:"LC Vértice",kind:"fixed",rateBps:1350,months:36,liquidity:"maturity",issuer:"Financeira Vértice",fgc:true,benchmark:"CDI"},
 {id:"debenture",name:"Debênture Forja",kind:"fixed",rateBps:1250,months:48,liquidity:"market",couponMonths:6,issuer:"Forja Indústria",benchmark:"CDI"},
 {id:"debenture-incent",name:"Debênture incentivada Atlas",kind:"ipca",rateBps:650,months:60,liquidity:"market",couponMonths:6,issuer:"Atlas Energia",exempt:true,benchmark:"IPCA"},
 {id:"cri",name:"CRI Urbano",kind:"ipca",rateBps:750,months:48,liquidity:"market",couponMonths:6,issuer:"Securitizadora Urbana",exempt:true,benchmark:"IPCA"},
 {id:"cra",name:"CRA Campo",kind:"cdi",rateBps:12000,months:36,liquidity:"maturity",issuer:"Securitizadora Campo",exempt:true,benchmark:"CDI"},
].map(p=>({...p,short:p.name,minimum:"100",risk:p.issuer==="Tesouro fictício"?"Soberano simulado":p.fgc?"Risco do emissor + garantia limitada":"Crédito privado sem FGC",color:p.kind==="ipca"?"#e5b975":p.kind==="fixed"?"#ad92f3":"#bded86",description:p.kind==="ipca"?"Correção pela inflação simulada mais juros reais contratados.":p.couponMonths?"Juros periódicos entram no caixa; vender antes do vencimento envolve preço de mercado.":p.fgc?"Rendimento contratado com risco de crédito do emissor. A proteção simulada tem limites.":"O preço de venda pode mudar com a curva de juros e com o risco de crédito."} as Product));
PRODUCTS[0].issuer="Banco Aurora";PRODUCTS[0].fgc=true;PRODUCTS[0].benchmark="CDI";PRODUCTS[1].issuer="Banco Aurora";PRODUCTS[1].fgc=true;PRODUCTS[1].benchmark="CDI";
PRODUCTS.push(...fixedProducts);
export function getProduct(id: string): Product { const p = PRODUCTS.find(p => p.id === id); if (!p) throw new Error("Investimento não encontrado."); return p; }
/** Educational effective annual rate: annual CDI × participation, then daily compound. */
export function annualRate(p: Product, e: Pick<Economy, "cdiBps"> & Partial<Economy>): number { return p.kind === "fixed" ? p.rateBps : p.kind === "selic" ? e.selicBps ?? e.cdiBps : p.kind === "ipca" ? ((1+(e.ipcaBps??450)/10000)*(1+p.rateBps/10000)-1)*10000 : e.cdiBps * p.rateBps / 10000; }
export function rateLabel(p: Product): string { return p.kind === "fixed" ? `${(p.rateBps / 100).toLocaleString("pt-BR")}% a.a.` : p.kind==="ipca"?`IPCA + ${(p.rateBps/100).toLocaleString("pt-BR")}%`:p.kind==="selic"?"Selic simulada":`${p.rateBps / 100}% do CDI`; }
