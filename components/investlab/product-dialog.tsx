"use client";
import { useState } from "react";
import { FlaskConical, ShieldCheck, Clock3, Wallet, Info } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getProduct, rateLabel } from "@/lib/simulation/products";
import { formatMoney, money } from "@/lib/simulation/money";
import { project } from "@/lib/simulation/engine";
import { addMonths, formatDate } from "@/lib/simulation/clock";
import type { Simulation } from "@/lib/simulation/types";
export function ProductDialog({ id, onClose, simulation, onInvest }: { id: string | null; onClose: () => void; simulation: Simulation; onInvest: (id: string, amount: string) => void }) {
  const [amount, setAmount] = useState("1000"), [months, setMonths] = useState("12"), [error, setError] = useState("");
  const product = id ? getProduct(id) : null; let projection: ReturnType<typeof project> | null = null;
  try { if (id && amount) projection = project(id, amount.replace(",", "."), Number(months), simulation); } catch { /* Inline validation on submission. */ }
  return <Dialog open={!!id} onOpenChange={open => { if (!open) { setError(""); onClose(); } }}><DialogContent className="lab-dialog product-dialog">
    {product && <><div className="product-symbol" style={{ color: product.color }}><FlaskConical size={24}/></div><DialogTitle>{product.name}</DialogTitle><DialogDescription className="dialog-description">{product.description}</DialogDescription>
      <div className="product-rate" style={{ color: product.color }}>{rateLabel(product)}</div>
      <div className="product-facts"><span><Wallet size={16}/>Mínimo {formatMoney(money(product.minimum))}</span><span><Clock3 size={16}/>{product.liquidity === "daily" ? "Liquidez diária" : "Resgate no vencimento"}</span><span><ShieldCheck size={16}/>{product.risk}</span><span>Vence em {formatDate(addMonths(simulation.date, product.months), true)}</span></div>
      <form onSubmit={e => { e.preventDefault(); try { onInvest(product.id, amount.replace(",", ".")); setError(""); onClose(); } catch (e) { setError((e as Error).message); } }}>
        <label className="field-label" htmlFor="investment-amount">Quanto você quer experimentar?</label><div className="money-input"><span>R$</span><input id="investment-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} required aria-describedby="amount-help" /></div>
        <p id="amount-help" className="field-hint">Disponível: {formatMoney(simulation.cash)}</p>
        <div className="projection-top"><label id="projection-period">Projeção para</label><Select value={months} onValueChange={setMonths}><SelectTrigger aria-labelledby="projection-period"><SelectValue/></SelectTrigger><SelectContent>{[1,6,12,24].map(v => <SelectItem key={v} value={String(v)}>{v} {v === 1 ? "mês" : "meses"}</SelectItem>)}</SelectContent></Select></div>
        <div className="projection-box"><span>Você poderia ter, após impostos</span><strong>{projection ? formatMoney(projection.net) : "Informe um valor válido"}</strong>{projection && <small>Bruto: {formatMoney(projection.gross)} · Impostos: {formatMoney(projection.total)}</small>}<p><Info size={14}/>Projeção com as taxas de hoje constantes. O cenário pode mudar. {product.liquidity === "maturity" && Number(months) < 24 ? "O prefixado só pode ser resgatado em 24 meses." : ""}</p></div>
        {error && <p className="form-error" role="alert">{error}</p>}<button className="button primary full" type="submit">Investir dinheiro fictício</button>
      </form><p className="dialog-footnote">100% simulado. Nenhum dinheiro real é movimentado.</p></>}
  </DialogContent></Dialog>;
}
