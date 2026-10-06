"use client";
import { explainConcepts } from "./concept-text";
import type { Simulation } from "@/lib/simulation/types";
import { CHALLENGES } from "@/lib/lab/LearningEngine";
import { startChallenge, challengeFeedback } from "@/lib/lab/ChallengeEngine";
import { ensureLab } from "@/lib/lab/PersistenceEngine";
export function ChallengeLab({ s, saveUniverse, onNavigate, fmt }: {
    s: Simulation;
    saveUniverse: (s: Simulation) => Simulation;
    onNavigate: (v: string) => void;
    fmt: (v: string) => string;
}) { return explainConcepts(<><p>Iniciar cria um universo separado e preserva sua carteira atual. Os desafios de inflação e casa começam com R$ 50 mil fictícios.</p><div className="lessons-grid">{CHALLENGES.map(c => { const started = ensureLab(s).challenges.some(x => x.id === c.id), f = started ? challengeFeedback(s, c.id) : null; return <section className="panel lesson-card" key={c.id}><span className="lesson-number">DESAFIO EDUCACIONAL</span><h2>{c.name}</h2><p>{c.text}</p><button className="button secondary" onClick={() => { saveUniverse(startChallenge(s, c.id)); onNavigate("challenges"); }}>{started ? "Recomeçar em outro universo" : "Iniciar desafio"}</button>{f && <div className="challenge-feedback"><p>{f.elapsed} dias observados · horizonte: {f.deadline}</p><p>Disponível hoje: {fmt(f.available)} · patrimônio em poder de compra inicial: {fmt(f.real)} · recebíveis futuros: {fmt(f.pending)}.</p><p>{f.classes} classes investidas · concentração setorial máxima {(f.maxSector * 100).toFixed(1)}% · queda máxima {(f.drawdown * 100).toFixed(1)}% · {f.restricted} títulos com restrição ou prazo posterior.</p>{f.checks.map(([label, done]) => <p key={label} className={done ? "lime-text" : "field-hint"}>{done ? "✓" : "○"} {label}</p>)}<p>{f.notes}</p></div>}</section>; })}</div></>); }
