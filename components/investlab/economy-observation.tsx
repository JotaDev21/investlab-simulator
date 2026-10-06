"use client";
import { explainConcepts } from "./concept-text";
import type { Simulation } from "@/lib/simulation/types";
import { ensureLab } from "@/lib/lab/PersistenceEngine";
import { monetaryObservation } from "@/lib/lab/AnalysisEngine";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BondLab } from "./bond-lab";
import { ConceptText } from "./concept-text";
export function MonetaryObservation({ s, onInspect }: {
    s: Simulation;
    onInspect: (id: string) => void;
}) { const observation = monetaryObservation(s), decision = observation?.decision, before = observation?.before, after = observation?.after; return explainConcepts(<section className="panel section-panel"><h2>Banco Central fictício · observar depois da decisão</h2>{decision && before && after ? <><p><ConceptText text={decision.detail}/></p><p>{decision.date} · Selic {before.selicBps / 100}% → {after.selicBps / 100}% · CDI {before.cdiBps / 100}% → {after.cdiBps / 100}%.</p><p>Agora observe o que aconteceu com diferentes partes da carteira. Variações simultâneas não provam uma relação causal isolada.</p><div className="fundamental-grid">{observation?.reactions.map(a => <button key={a.id} onClick={() => onInspect(a.id)}><span>{a.id} · reação no dia</span><strong>{a.return === null ? "Sem observações alinhadas" : (a.return * 100).toFixed(4) + "%"}</strong></button>)}</div><button className="text-button" onClick={() => onInspect("macro")}>Inspecionar variáveis e curva</button></> : <p>A próxima decisão periódica está no calendário. Avance até ela e compare títulos, ações, FIIs e câmbio.</p>}</section>); }
export function AdvancedCurve({ s }: {
    s: Simulation;
}) { const l = ensureLab(s); return explainConcepts(<section className="panel section-panel"><h2>Curva de juros · módulo avançado</h2><p><ConceptText text="Vértices curtos e longos refletem política monetária, expectativas e prêmio de risco. Uma curva invertida não garante recessão; sua inclinação é uma observação do modelo."/></p><div className="lab-chart"><ResponsiveContainer><LineChart data={l.curve}><CartesianGrid stroke="#ffffff0c"/><XAxis dataKey="years" unit=" anos"/><YAxis tickFormatter={v => `${v / 100}%`}/><Tooltip formatter={v => `${Number(v) / 100}% a.a.`}/><Line isAnimationActive={false} dataKey="bps" name="Taxa por prazo" stroke="#ad92f3"/></LineChart></ResponsiveContainer></div><BondLab simulation={s}/></section>); }
