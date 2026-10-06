"use client";
import { explainConcepts } from "./concept-text";
import { useState } from "react";
import type { Simulation } from "@/lib/simulation/types";
import { diaryObservation, reviewThesis } from "@/lib/lab/DiaryEngine";
import { decimal } from "@/lib/lab/decimal";
export function DiaryLab({ s, action, onInspect }: {
    s: Simulation;
    action: (fn: (s: Simulation) => void) => void;
    onInspect: (id: string) => void;
}) { const [reviews, setReviews] = useState<Record<string, string>>({}), entries = s.lab!.diary; return explainConcepts(<section className="panel section-panel"><h2>Diário do investidor</h2><p>Teses anteriores às operações e revisões datadas. O resultado não demonstra, sozinho, que uma hipótese era correta.</p>{entries.length ? entries.toReversed().map(e => { const current = diaryObservation(s, e); return <article className="news-row" key={e.id}><small>{e.date} · {e.operation} · {e.assetId}</small><h3>“{e.note}”</h3><p>Referência na decisão: {current.currency} {decimal(e.price).toFixed(2)} · {current.label}: <button className="numeric-value" onClick={() => onInspect(current.inspect)}>{current.currency} {decimal(current.price).toFixed(2)}</button></p>{e.reviews?.map((r, i) => <p key={i}><strong>{r.date} · revisão:</strong> {r.note} · referência {current.currency} {decimal(r.price).toFixed(2)}</p>)}<label className="field-label">O que aconteceu com minha hipótese, prazo e riscos?<textarea aria-label={`Revisar tese ${e.id}`} className="standard-input" value={reviews[e.id] ?? ""} onChange={ev => setReviews({ ...reviews, [e.id]: ev.target.value })}/></label><button className="button secondary" disabled={(reviews[e.id] ?? "").trim().length < 12} onClick={() => { action(n => reviewThesis(n, e.id, reviews[e.id])); setReviews({ ...reviews, [e.id]: "" }); }}>Registrar revisão da tese</button></article>; }) : <p className="empty-state">Registre “Por que estou comprando isso?” antes de executar uma operação.</p>}</section>); }
