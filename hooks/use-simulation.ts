"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { createSimulation } from "@/lib/simulation/engine";
import { STORAGE_KEY, parseSimulation } from "@/lib/simulation/storage";
import type { Simulation } from "@/lib/simulation/types";
export function useSimulation() {
  const [simulation, setSimulation] = useState(createSimulation), [ready, setReady] = useState(false);
  const latest = useRef(simulation);
  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const saved = parseSimulation(raw); latest.current = saved; setSimulation(saved); } }
    catch { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) localStorage.setItem(STORAGE_KEY + ".recovery", raw); } catch {} toast.error("O progresso salvo está inválido. Abrimos um novo laboratório e tentamos preservar uma cópia dos dados anteriores."); }
    setReady(true);
  }, []);
  const update = useCallback((action: (s: Simulation) => Simulation) => {
    const next = action(latest.current); latest.current = next; setSimulation(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { toast.warning("Seu cenário está aberto, mas o navegador não conseguiu salvá-lo. Use Exportar cenário para guardar seu progresso."); }
    return next;
  }, []);
  return { simulation, ready, update };
}
