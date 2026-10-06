"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { createSimulation } from "@/lib/simulation/engine";
import { STORAGE_KEY, parseSimulation } from "@/lib/simulation/storage";
import type { Simulation } from "@/lib/simulation/types";
import { migrate,ensureLab } from "@/lib/lab/PersistenceEngine";
import { readBackup,saveBackup } from "@/lib/lab/BrowserStorage";
export function useSimulation() {
  const [simulation, setSimulation] = useState(createSimulation), [ready, setReady] = useState(false);
  const latest = useRef(simulation);
  const archive=useRef<Record<string,Simulation>>({});const [universes,setUniverses]=useState<Simulation[]>([]);const stamp=useRef(0);
  useEffect(() => {
    let cancelled=false;
    (async()=>{let backup=null;try{backup=await readBackup();}catch{}if(cancelled)return;
      try{const localStamp=Number(localStorage.getItem("investlab.saved-at")??0);stamp.current=Math.max(localStamp,backup?.timestamp??0);const useBackup=backup&&backup.timestamp>localStamp;
        const raw=useBackup&&backup?JSON.stringify(backup.universes[backup.currentId]):localStorage.getItem(STORAGE_KEY);if(raw){latest.current=migrate(parseSimulation(raw));setSimulation(latest.current);}
        let others:unknown=useBackup&&backup?backup.universes:null;if(!useBackup){try{const value=localStorage.getItem("investlab.universes.v2");others=value?JSON.parse(value):null;}catch{toast.warning("Uma cópia de universos não pôde ser lida. Seu cenário atual foi preservado.");}}
        if(others&&typeof others==="object")for(const rawState of Object.values(others)){try{const valid=migrate(parseSimulation(JSON.stringify(rawState)));archive.current[ensureLab(valid).universeId]=valid;}catch{}}
        archive.current[ensureLab(latest.current).universeId]=latest.current;setUniverses(Object.values(archive.current));
      }catch{try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)localStorage.setItem(STORAGE_KEY+".recovery",raw);}catch{}toast.error("Os dados salvos não passaram na validação. Uma cópia de recuperação foi preservada quando possível.");}
      setReady(true);
    })();return()=>{cancelled=true;};
  }, []);
  const update = useCallback((action: (s: Simulation) => Simulation) => {
    const next = action(latest.current); latest.current = next; setSimulation(next);
    archive.current[ensureLab(next).universeId]=next;setUniverses(Object.values(archive.current));
    stamp.current=Math.max(Date.now(),stamp.current+1);let localSaved=false;
    try { localStorage.setItem("investlab.universes.v2",JSON.stringify(archive.current));localStorage.setItem(STORAGE_KEY, JSON.stringify(next));localStorage.setItem("investlab.saved-at",String(stamp.current));localSaved=true; }catch{}
    void saveBackup({timestamp:stamp.current,currentId:ensureLab(next).universeId,universes:archive.current}).catch(()=>{if(!localSaved)toast.warning("O navegador não conseguiu salvar este avanço. Exporte uma cópia antes de fechar o HTML.");});
    return next;
  }, []);
  const switchUniverse=useCallback((id:string)=>{const next=archive.current[id];if(!next)throw new Error("Universo salvo não encontrado.");return update(()=>next);},[update]);
  const saveUniverse=useCallback((next:Simulation)=>update(()=>migrate(next)),[update]);
  return { simulation, ready, update,universes,switchUniverse,saveUniverse };
}
