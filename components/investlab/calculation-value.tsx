"use client";
import { explainConcepts } from "./concept-text";
import { useState } from "react";
import { Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { inspectCalculation } from "@/lib/lab/CalculationEngine";
import type { Simulation } from "@/lib/simulation/types";
export function CalculationValue({ simulation, id = "portfolio", children }: {
    simulation: Simulation;
    id?: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false), c = open ? inspectCalculation(simulation, id) : null;
    return explainConcepts(<><button className="numeric-value" onClick={() => setOpen(true)} title="Como isso foi calculado?">{children}<Calculator size={13}/></button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="lab-dialog"><DialogTitle>{c?.title}</DialogTitle><DialogDescription className="dialog-description">Fórmula, período e valores utilizados neste universo.</DialogDescription>{c && <><div className="math-example">{c.formula}</div><dl>{c.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="dialog-footnote">{c.note}</p></>}</DialogContent></Dialog></>);
}
