"use client";
import { explainConcepts } from "./concept-text";
import { AdvancedCurve } from "./economy-observation";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Simulation } from "@/lib/simulation/types";
import { ensureLab } from "@/lib/lab/PersistenceEngine";
import { LearningProgress, advancedUnlocked } from "@/lib/lab/LearningEngine";
import { buyOption, closeOption, openShort, closeShort, currentOptionQuote, optionValue, optionPayoffPoints } from "@/lib/lab/DerivativeEngine";
import { impliedVolatility } from "@/lib/lab/OptionPricingEngine";
import { openFuture, closeFuture, futureQuote, futureUnsettled, hedgeScenarios } from "@/lib/lab/FuturesEngine";
import { assetById, assetBRL } from "@/lib/lab/EquityEngine";
import { money } from "@/lib/simulation/money";
import { addDays } from "@/lib/simulation/clock";
type Props = {
    s: Simulation;
    action: (fn: (s: Simulation) => void) => void;
    progress: LearningProgress;
    save: (p: LearningProgress) => void;
    onNavigate: (v: string) => void;
    onTerm: (id: string) => void;
    fmt: (v: string) => string;
    onInspect: (id: string) => void;
};
export function AdvancedLab({ s, action, progress, save, onNavigate, onTerm, fmt, onInspect }: Props) {
    const l = ensureLab(s), [id, setId] = useState("AURA3"), [kind, setKind] = useState<"call" | "put">("call"), [strike, setStrike] = useState("20"), [qty, setQty] = useState("1"), [days, setDays] = useState("30"), [marketPremium, setMarketPremium] = useState("1"), [futureAsset, setFutureAsset] = useState("USD"), [futureSide, setFutureSide] = useState<"long" | "short">("short"), [multiplier, setMultiplier] = useState("1"), [note, setNote] = useState("");
    let quote: ReturnType<typeof currentOptionQuote> | null = null, iv: string = "", futurePrice: string | null = null, hedge: ReturnType<typeof hedgeScenarios> = [];
    try {
        quote = currentOptionQuote(s, id, money(strike.replace(",", ".")), kind, Number(days));
    }
    catch { }
    try {
        iv = (impliedVolatility(assetBRL(s, assetById(s, id)), money(strike.replace(",", ".")), kind, Number(days), money(marketPremium.replace(",", ".")), s.economy.selicBps / 10000, assetById(s, id).annualDividend) * 100).toFixed(2) + "%";
    }
    catch (e) {
        iv = (e as Error).message;
    }
    try {
        futurePrice = futureQuote(s, futureAsset, addDays(s.date, Number(days)));
        const held = l.holdings.find(h => h.assetId === futureAsset);
        hedge = hedgeScenarios(futurePrice, held?.qty ?? "0", qty, multiplier);
    }
    catch { }
    let payoff: ReturnType<typeof optionPayoffPoints> = [];
    try {
        if (quote)
            payoff = optionPayoffPoints(money(strike.replace(",", ".")), qty, kind, quote.premium);
    }
    catch { }
    const field = (label: string, value: string, set: (v: string) => void) => <div><label className="field-label">{label}<input aria-label={label} className="standard-input" value={value} onChange={e => set(e.target.value)}/></label></div>;
    if (!advancedUnlocked(progress))
        return explainConcepts(<section className="panel advanced-lock"><LockKeyhole size={40}/><h2>Módulo avançado protegido</h2><p>Conclua os níveis 0 a 9 do curso. Opções compradas podem perder todo o prêmio; short e futuros podem gerar dívida.</p><button className="button primary" onClick={() => onNavigate("learn")}>Continuar trilha de aprendizado</button>{Array.from({ length: 10 }, (_, i) => i).every(i => progress.completed.includes(i)) && <button className="button secondary" onClick={() => save({ ...progress, riskAccepted: true })}>Li os riscos: opções podem perder o prêmio e short pode superar a margem</button>}</section>);
    return explainConcepts(<><AdvancedCurve s={s}/><div className="risk-banner">Operações fictícias. Garantias não limitam perdas. Modelos e parâmetros são visíveis nos cálculos.</div>
 <section className="panel section-panel"><h2>Opções compradas · calls e puts</h2><p>Black–Scholes para opções europeias, dividendos contínuos, taxa anual efetiva convertida em contínua e dias corridos / 365. Venda antecipada permitida; exercício financeiro no vencimento.</p><div className="form-grid"><div><label className="field-label">Ativo-objeto<select aria-label="Ativo-objeto" className="standard-input" value={id} onChange={e => setId(e.target.value)}>{l.assets.filter(a => a.class === "stock" && !a.bankrupt).map(a => <option key={a.id} value={a.id}>{a.id} · {a.name}</option>)}</select></label></div><div><label className="field-label">Tipo de opção<select aria-label="Tipo de opção" className="standard-input" value={kind} onChange={e => setKind(e.target.value as typeof kind)}><option value="call">Call</option><option value="put">Put</option></select></label></div>{field("Strike BRL", strike, setStrike)}{field("Quantidade", qty, setQty)}{field("Dias até vencer", days, setDays)}</div>
 {quote && <><p>Intrínseco: {fmt(quote.intrinsic)} · extrínseco: {fmt(quote.extrinsic)} · prêmio por unidade: {fmt(quote.premium)}</p><div className="fundamental-grid">{[["Delta", quote.delta, "por R$ 1 do ativo"], ["Gamma", quote.gamma, "variação do delta por R$ 1"], ["Theta", quote.theta, "BRL por dia"], ["Vega", quote.vega, "BRL por 1 pp de volatilidade"], ["Rho", quote.rho, "BRL por 1 pp de taxa contínua"]].map(([name, value, unit]) => <button key={String(name)} onClick={() => onTerm("greeks")}><span>{name}</span><strong>{Number(value).toFixed(5)}</strong><small>{unit}</small></button>)}</div><details><summary>Como o prêmio e as gregas foram calculados?</summary><p>Call = S × e^(−qT) × Φ(d1) − K × e^(−rT) × Φ(d2). Put = K × e^(−rT) × Φ(−d2) − S × e^(−qT) × Φ(−d1).</p><p>d1 = [ln(S/K) + (r − q + σ²/2)T] / (σ√T); d2 = d1 − σ√T.</p><p>S: {fmt(assetBRL(s, assetById(s, id)))} · K: {strike} · dias: {days} · σ: {(quote.volatility * 100).toFixed(2)}% · taxa efetiva: {(quote.rate * 100).toFixed(2)}% · dividendos: {(quote.dividend * 100).toFixed(2)}% · d1: {quote.d1.toFixed(8)} · d2: {quote.d2.toFixed(8)}.</p><p>Delta = e^(−qT)Φ(d1) para call; gamma = e^(−qT)φ(d1)/(Sσ√T); vega = Se^(−qT)φ(d1)√T/100. Theta é a derivada por tempo, dividida por 365. Sensibilidades locais; o modelo não prevê cotação.</p></details></>}
 <label className="field-label">Tese ou exposição que quero proteger<textarea className="standard-input" value={note} onChange={e => setNote(e.target.value)}/></label><button className="button primary" onClick={() => action(n => { buyOption(n, id, kind, qty, money(strike.replace(",", ".")), Number(days)); if (note.trim())
        ensureLab(n).diary.push({ id: `diary-${n.nextId++}`, date: n.date, assetId: id, note, price: assetById(n, id).price, operation: "option" }); })}>Comprar opção fictícia</button>
 <div className="lab-chart"><ResponsiveContainer><AreaChart data={payoff}><CartesianGrid stroke="#ffffff0c"/><XAxis dataKey="spot"/><YAxis /><Tooltip /><Area isAnimationActive={false} dataKey="payoff" name="Resultado no vencimento" fill="#ad92f317" stroke="#ad92f3"/></AreaChart></ResponsiveContainer></div><button className="text-button" onClick={() => onTerm("greeks")}>Delta, gamma, theta, vega e volatilidade implícita</button>{field("Prêmio observado por unidade para calcular IV", marketPremium, setMarketPremium)}<p>Volatilidade implícita: {iv}. Inversão por bisseção; não é previsão de volatilidade futura.</p>
 {l.options.map(o => <article className="news-row" key={o.id}><h3>{o.kind.toUpperCase()} {o.assetId} · {o.qty} unidades</h3><p>Strike {fmt(o.strike)} · vence {o.expires} · prêmio pago {fmt(o.premium)} · valor atual {fmt(optionValue(s, o))}</p><button className="text-button" onClick={() => onInspect(o.id)}>Inspecionar posição</button><button className="button secondary" onClick={() => action(n => closeOption(n, o.id))}>Vender opção e encerrar</button></article>)}</section>
 <section className="panel section-panel"><h2>Venda a descoberto e margem</h2><p>Margem inicial 150%, manutenção 30% da recompra; aluguel 3% a.a. proporcional aos dias corridos. Gaps podem criar dívida.</p><button className="button secondary" onClick={() => action(n => openShort(n, id, qty))}>Abrir short fictício do ativo selecionado</button>{l.shorts.map(sh => <article className="news-row" key={sh.id}><h3>{sh.assetId} · {sh.qty} unidades</h3><p>Margem {fmt(sh.collateral)} · preço de venda {fmt(sh.entryPrice)} · aluguel acumulado {fmt(sh.borrowFees ?? "0")}</p><button className="text-button" onClick={() => onInspect(sh.id)}>Inspecionar margem</button><button className="button secondary" onClick={() => action(n => closeShort(n, sh.id))}>Recomprar e encerrar</button></article>)}<p>Dívida registrada: {fmt(l.debt)}</p></section>
 <section className="panel section-panel"><h2>Laboratório de futuros e hedge</h2><p>Contratos entram na carteira. Margem inicial 15% do nocional, manutenção 8%, ajustes diários no caixa. Preço teórico = spot × e^[(ln(1 + Selic) − dividendos) × dias/365].</p><div className="form-grid"><div><label className="field-label">Referência do futuro<select aria-label="Referência do futuro" className="standard-input" value={futureAsset} onChange={e => setFutureAsset(e.target.value)}><option value="USD">USD / BRL</option><option value="EUR">EUR / BRL</option>{l.assets.filter(a => ["stock", "etf"].includes(a.class) && !a.bankrupt).map(a => <option key={a.id} value={a.id}>{a.id}</option>)}</select></label></div><div><label className="field-label">Direção<select aria-label="Direção do futuro" className="standard-input" value={futureSide} onChange={e => setFutureSide(e.target.value as typeof futureSide)}><option value="long">Comprado (long)</option><option value="short">Vendido (short)</option></select></label></div>{field("Multiplicador do contrato", multiplier, setMultiplier)}</div><p>Quantidade {qty} · vencimento em {days} dias · preço teórico {futurePrice ? fmt(futurePrice) : "Parâmetros inválidos"}. Ajuste = (preço atual − anterior) × quantidade × multiplicador × direção.</p><button className="button primary" onClick={() => action(n => openFuture(n, futureAsset, futureSide, qty, Number(days), multiplier, note))}>Abrir contrato futuro fictício</button>
 {l.futures!.map(f => <article className="news-row" key={f.id}><h3>{f.side} {f.assetId} · {f.qty} × {f.multiplier}</h3><p>Vence {f.expires} · margem {fmt(f.collateral)} · ajustes acumulados {fmt(f.pnl)} · ajuste ainda não liquidado {fmt(futureUnsettled(s, f))}</p><button className="text-button" onClick={() => onInspect(f.id)}>Inspecionar ajustes</button><button className="button secondary" onClick={() => action(n => closeFuture(n, f.id))}>Encerrar contrato futuro</button></article>)}
 <h3>Experimento de hedge vendido da posição selecionada</h3><p>Compara sua posição à vista, um futuro vendido e a combinação sob choques de preço. Exposição cambial indireta, custo de carregamento e risco de base podem manter perdas. Este gráfico não abre operações.</p><div className="lab-chart"><ResponsiveContainer><LineChart data={hedge}><CartesianGrid stroke="#ffffff0c"/><XAxis dataKey="change" unit="%"/><YAxis /><Tooltip /><Line isAnimationActive={false} dataKey="unhedged" name="Sem hedge" stroke="#e5b975"/><Line isAnimationActive={false} dataKey="future" name="Futuro vendido" stroke="#ad92f3"/><Line isAnimationActive={false} dataKey="hedged" name="Combinado" stroke="#bded86"/></LineChart></ResponsiveContainer></div></section></>);
}
