import type { Economy } from "./economy";
export type Product = { id: string; name: string; short: string; kind: "fixed" | "cdi"; rateBps: number; minimum: string; months: number; liquidity: "daily" | "maturity"; risk: string; color: string; description: string };
export const PRODUCTS: Product[] = [
  { id: "fixed", name: "CDB Prefixado", short: "Prefixado", kind: "fixed", rateBps: 1000, minimum: "100", months: 24, liquidity: "maturity", risk: "Baixo a moderado", color: "#ad92f3", description: "Uma taxa combinada no início. Você conhece a regra de rendimento e aprende como o tempo multiplica seu dinheiro." },
  { id: "cdi", name: "CDB 110% do CDI", short: "110% CDI", kind: "cdi", rateBps: 11000, minimum: "100", months: 24, liquidity: "daily", risk: "Baixo a moderado", color: "#bded86", description: "Seu rendimento acompanha o CDI simulado. Quando os juros da economia mudam, o ritmo do seu investimento muda junto." },
];
export function getProduct(id: string): Product { const p = PRODUCTS.find(p => p.id === id); if (!p) throw new Error("Investimento não encontrado."); return p; }
/** Educational effective annual rate: annual CDI × participation, then daily compound. */
export function annualRate(p: Product, e: Pick<Economy, "cdiBps">): number { return p.kind === "fixed" ? p.rateBps : e.cdiBps * p.rateBps / 10000; }
export function rateLabel(p: Product): string { return p.kind === "fixed" ? `${(p.rateBps / 100).toLocaleString("pt-BR")}% a.a.` : `${p.rateBps / 100}% do CDI`; }
