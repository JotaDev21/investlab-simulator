"use client";
import { explainConcepts } from "./concept-text";
import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { displayNumber } from "@/lib/simulation/money";
import { realValue } from "@/lib/simulation/engine";
import { formatDate, daysBetween } from "@/lib/simulation/clock";
import type { Simulation } from "@/lib/simulation/types";
export function EquityChart({ simulation, onInspect }: {
    simulation: Simulation;
    onInspect: (date: string) => void;
}) {
    const [range, setRange] = useState("all");
    const data = useMemo(() => {
        const filtered = simulation.snapshots.filter(p => range === "all" || daysBetween(p.date, simulation.date) <= Number(range));
        // Downsample only display; complete daily history remains in simulation.snapshots.
        const stride = Math.max(1, Math.ceil(filtered.length / 240));
        return filtered.filter((_, i) => i % stride === 0 || i === filtered.length - 1).map(p => ({ date: p.date, capital: displayNumber(p.capital ?? simulation.initial), equity: displayNumber(p.netEquity), real: displayNumber(realValue(p.netEquity, p.inflationFactor)) }));
    }, [simulation, range]);
    return explainConcepts(<section className="panel chart-panel">
    <div className="panel-heading"><div><h2>Evolução patrimonial</h2><p>Seu dinheiro ao longo do tempo</p></div><Tabs value={range} onValueChange={setRange}><TabsList className="range-tabs"><TabsTrigger value="30">1M</TabsTrigger><TabsTrigger value="180">6M</TabsTrigger><TabsTrigger value="365">1A</TabsTrigger><TabsTrigger value="all">Tudo</TabsTrigger></TabsList></Tabs></div>
    <div className="chart-legend"><span><i style={{ background: "#72b4e2" }}/>Capital colocado</span><span><i style={{ background: "#bded86" }}/>Patrimônio líquido</span><span><i style={{ background: "#887fa0" }}/>Poder de compra</span></div>
    <div className="equity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 20, right: 12, bottom: 0, left: -10 }} onClick={e => { if (e?.activeLabel)
        onInspect(String(e.activeLabel)); }}>
      <defs><linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bded86" stopOpacity={0.22}/><stop offset="100%" stopColor="#bded86" stopOpacity={0}/></linearGradient></defs>
      <CartesianGrid vertical={false} stroke="#ffffff0b"/>
      <XAxis dataKey="date" stroke="#84898b" tickLine={false} axisLine={false} minTickGap={45} tick={{ fontSize: 12 }} tickFormatter={v => new Date(v + "T12:00:00Z").toLocaleDateString("pt-BR", { month: "short", day: "2-digit", timeZone: "UTC" })}/>
      <YAxis stroke="#84898b" tickLine={false} axisLine={false} width={70} tick={{ fontSize: 12 }} domain={[(min: number) => Math.floor(min * 0.97 / 100) * 100, (max: number) => Math.ceil(max * 1.03 / 100) * 100]} tickFormatter={v => `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`}/>
      <Tooltip contentStyle={{ background: "#222629", border: "1px solid #3b4143", borderRadius: 12, color: "#f2f4ee" }} labelFormatter={v => formatDate(String(v), true)} formatter={v => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/>
      <Area name="Capital colocado" type="stepAfter" dataKey="capital" stroke="#72b4e2" strokeWidth={2} fill="none" isAnimationActive={false}/><Area name="Poder de compra" type="monotone" dataKey="real" stroke="#887fa0" strokeWidth={2} strokeDasharray="5 5" fill="none" isAnimationActive={false}/>
      <Area name="Patrimônio líquido" type="monotone" dataKey="equity" stroke="#bded86" strokeWidth={2.5} fill="url(#equity-fill)" isAnimationActive={false} dot={data.length === 1 ? { r: 5 } : false}/>
    </AreaChart></ResponsiveContainer></div>
    <div className="chart-footer"><span>{data.length === 1 ? "Aplique e avance o tempo para construir seu gráfico." : "Clique no gráfico para consultar uma data."}</span><span>Valores após impostos estimados</span></div>
  </section>);
}
