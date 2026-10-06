"use client";
import { explainConcepts } from "@/components/investlab/concept-text";
import { BondLab } from "@/components/investlab/bond-lab";
import { CalculationValue } from "@/components/investlab/calculation-value";
import { exposures } from "@/lib/lab/PortfolioEngine";
import { CLASS_LABELS } from "@/lib/lab/catalog";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlaskConical, LayoutDashboard, Wallet, History, BookOpen, ArrowLeftRight, Settings2, Plus, CalendarDays, Clock3, Sparkles, CircleHelp, TrendingUp, ChevronRight, Download, RotateCcw, ShieldCheck, CircleDollarSign, Layers3, Lightbulb, Check, LockKeyhole, SlidersHorizontal, Globe2, PieChart, Newspaper, NotebookPen, GraduationCap, Orbit, ShieldAlert, LibraryBig, Trophy } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { EquityChart } from "@/components/investlab/chart";
import { ProductDialog } from "@/components/investlab/product-dialog";
import { useSimulation } from "@/hooks/use-simulation";
import { createSimulation, activePositions, totals, advance, invest, redeem, netPosition, project } from "@/lib/simulation/engine";
import { formatMoney, displayNumber, sum } from "@/lib/simulation/money";
import { PRODUCTS, getProduct, annualRate, rateLabel } from "@/lib/simulation/products";
import { addMonths, daysBetween, formatDate, START_DATE } from "@/lib/simulation/clock";
import { LESSONS } from "@/lib/education";
import { LabWorkspace, LabStatus } from "@/components/investlab/lab-workspace";
import { ensureLab } from "@/lib/lab/PersistenceEngine";
import { bondTax, bondMarketValue, canRedeem } from "@/lib/lab/FixedIncomeEngine";
import { formatMoney as nominalMoney } from "@/lib/simulation/money";
import { realValue } from "@/lib/simulation/engine";
import type { Simulation, Position, Transaction } from "@/lib/simulation/types";
type View = "dashboard" | "investments" | "compare" | "history" | "learn" | "market" | "portfolio" | "economy" | "calendar" | "journal" | "universes" | "advanced" | "glossary" | "challenges";
const NAV = [{ id: "market", label: "Mercados", icon: Globe2 }, { id: "portfolio", label: "Analisador", icon: PieChart }, { id: "economy", label: "Economia", icon: Newspaper }, { id: "calendar", label: "Calendário", icon: CalendarDays }, { id: "journal", label: "Diário", icon: NotebookPen }, { id: "universes", label: "Universos", icon: Orbit }, { id: "advanced", label: "Avançado", icon: ShieldAlert }, { id: "glossary", label: "Glossário", icon: LibraryBig }, { id: "challenges", label: "Desafios", icon: Trophy }, { id: "dashboard", label: "Visão geral", icon: LayoutDashboard }, { id: "investments", label: "Investimentos", icon: Wallet }, { id: "compare", label: "Comparar", icon: ArrowLeftRight }, { id: "history", label: "Histórico", icon: History }, { id: "learn", label: "Aprender", icon: BookOpen }].sort((a, b) => ["dashboard", "investments", "market", "portfolio", "compare", "history", "economy", "calendar", "journal", "learn", "glossary", "challenges", "universes", "advanced"].indexOf(a.id) - ["dashboard", "investments", "market", "portfolio", "compare", "history", "economy", "calendar", "journal", "learn", "glossary", "challenges", "universes", "advanced"].indexOf(b.id)) as {
    id: View;
    label: string;
    icon: typeof Wallet;
}[];
const pct = (v: number) => `${(v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
function Navigation({ view, setView, settings }: {
    view: View;
    setView: (v: View) => void;
    settings: () => void;
}) {
    const { setOpenMobile } = useSidebar();
    return explainConcepts(<Sidebar className="lab-sidebar"><SidebarHeader className="brand"><span className="brand-icon"><FlaskConical size={23}/></span><span>invest<span className="brand-lab">lab</span><small>LABORATÓRIO FINANCEIRO</small></span></SidebarHeader>
    <SidebarContent><div className="nav-label">SEU LABORATÓRIO</div><nav aria-label="Navegação principal">{NAV.map(n => <button key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} aria-current={view === n.id ? "page" : undefined} onClick={() => { setView(n.id); setOpenMobile(false); }}><n.icon size={19}/>{n.label}{n.id === "learn" && <span className="nav-tag">ABC</span>}</button>)}</nav>
    <div className="sidebar-note"><div><FlaskConical size={20}/><span>Liberdade para experimentar</span></div><p>Aqui, todo o dinheiro é fictício. O aprendizado é real.</p><span className="simulation-label"><ShieldCheck size={13}/>Ambiente simulado</span></div></SidebarContent>
    <SidebarFooter className="sidebar-footer"><button className="nav-item" onClick={() => { settings(); setOpenMobile(false); }}><Settings2 size={19}/>Meu cenário</button><div className="user-row"><span className="avatar">EX</span><div>Explorador<small>Seu primeiro laboratório</small></div><span className="version-tag">v2.0</span></div></SidebarFooter>
  </Sidebar>);
}
export default function Home() {
    const { simulation: s, ready, update, universes, switchUniverse, saveUniverse } = useSimulation();
    const formatMoney = (v: string) => nominalMoney(ensureLab(s).viewReal ? realValue(v, s.economy.inflationFactor) : v);
    const [view, setView] = useState<View>("dashboard"), [learning, setLearning] = useState(true), [product, setProduct] = useState<string | null>(null), [lesson, setLesson] = useState<string | null>(null);
    const [customTime, setCustomTime] = useState(false), [customDays, setCustomDays] = useState("30"), [selectedDays, setSelectedDays] = useState("month"), [busy, setBusy] = useState(false), [settings, setSettings] = useState(false), [resetOpen, setResetOpen] = useState(false), [seed, setSeed] = useState("42719");
    const [redemption, setRedemption] = useState<Position | null>(null), [inspect, setInspect] = useState<string | null>(null), [lastAdvance, setLastAdvance] = useState<{
        days: number;
        gain: string;
        nominal: string;
    } | null>(null);
    const current = useRef(s);
    current.current = s;
    useEffect(() => { try {
        const saved = localStorage.getItem("investlab.learning");
        if (saved)
            setLearning(saved === "true");
    }
    catch { } }, []);
    const t = useMemo(() => totals(s), [s]), positions = activePositions(s);
    const title = { market: "Analise, registre sua tese e experimente.", portfolio: "Entenda o patrimônio, os fluxos e as fontes de risco.", economy: "Uma economia fictícia, conectada e reproduzível.", calendar: "Fluxos, compromissos e divulgações no relógio virtual.", journal: "Decisões documentadas antes de conhecer o futuro.", universes: "Estratégias diferentes sob as mesmas condições.", advanced: "Exposição, margem e perdas assimétricas.", glossary: "Conceitos, fórmulas, exemplos e limitações.", challenges: "Aprenda a decidir sem uma solução automática.", dashboard: "Seu dinheiro, sob uma nova perspectiva.", investments: "Escolha seu próximo experimento.", compare: "Duas estratégias. Diferentes possibilidades.", history: "Cada decisão tem uma história.", learn: "Entenda hoje. Experimente no seu ritmo." }[view];
    const help = (key: string) => learning ? <button className="help" aria-label={`Entender ${LESSONS[key]?.title}`} onClick={() => setLesson(key)}><CircleHelp size={14}/></button> : null;
    function perform(action: (old: Simulation) => Simulation, message: string) { try {
        update(action);
        toast.success(message);
    }
    catch (e) {
        toast.error((e as Error).message);
    } }
    function runTime(days: number) {
        if (!ready || busy)
            return;
        if (!Number.isInteger(days) || days < 1 || days > 3650) {
            toast.error("Escolha de 1 a 3.650 dias.");
            return;
        }
        setBusy(true);
        setTimeout(() => {
            try {
                const before = current.current, next = update(old => advance(old, days, true));
                const tx = next.transactions.slice(before.transactions.length);
                const gain = sum(tx.filter(tx => tx.type === "yield").map(tx => tx.amount ?? "0"));
                setLastAdvance({ days: daysBetween(before.date, next.date), gain, nominal: (BigInt(totals(next).netEquity) - BigInt(totals(before).netEquity)).toString() });
                toast.success(`${days} ${days === 1 ? "dia avançado" : "dias avançados"}. Seu cenário foi atualizado.`);
                setCustomTime(false);
            }
            catch (e) {
                toast.error((e as Error).message);
            }
            finally {
                setBusy(false);
            }
        }, 40);
    }
    const timeOptions = [{ id: "day", label: "+1 dia", days: 1 }, { id: "week", label: "+7 dias", days: 7 }, { id: "month", label: "+1 mês", days: daysBetween(s.date, addMonths(s.date, 1)) }, { id: "half", label: "+6 meses", days: daysBetween(s.date, addMonths(s.date, 6)) }, { id: "year", label: "+1 ano", days: daysBetween(s.date, addMonths(s.date, 12)) }];
    const previewTax = redemption ? bondTax(s, redemption) : null;
    function exportScenario() { const url = URL.createObjectURL(new Blob([JSON.stringify(s, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = `investlab-${s.date}.json`; a.click(); URL.revokeObjectURL(url); toast.success("Cenário exportado com histórico completo."); }
    useEffect(() => {
        const doc = document as Document & {
            modelContext?: {
                registerTool: (tool: object, options: {
                    signal: AbortSignal;
                }) => void | Promise<void>;
            };
        };
        if (!ready || !doc.modelContext?.registerTool)
            return;
        const controller = new AbortController();
        const tool = { name: "read_investlab_simulation", title: "Consultar laboratório financeiro", description: "Consulta a data, o patrimônio e as aplicações do laboratório fictício, sem alterar dados.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: (input: unknown) => { if (!input || typeof input !== "object" || Object.keys(input).length)
                throw new Error("Use um objeto vazio."); const state = current.current; return { date: state.date, totals: totals(state), positions: activePositions(state), seed: state.seed }; } };
        try {
            Promise.resolve(doc.modelContext.registerTool(tool, { signal: controller.signal })).catch(() => { });
        }
        catch { }
        return () => controller.abort();
    }, [ready]);
    return explainConcepts(<SidebarProvider style={{ "--sidebar-width": "238px" } as React.CSSProperties}><Navigation view={view} setView={setView} settings={() => { setSeed(String(s.seed)); setSettings(true); }}/><div className="app-main">
    <header className="topbar"><div className="breadcrumb"><SidebarTrigger className="mobile-menu"/><span>Meu laboratório</span><ChevronRight size={14}/><strong>{NAV.find(n => n.id === view)?.label}</strong></div><div className="header-controls"><label className="learning-toggle"><BookOpen size={16}/><span>Aprendendo</span><Switch aria-label="Modo Aprendendo" checked={learning} onCheckedChange={v => { setLearning(v); try {
        localStorage.setItem("investlab.learning", String(v));
    }
    catch { } }}/></label><span className="header-simulated"><span />Simulação</span></div></header>
    <main className="workspace" aria-busy={!ready || busy} inert={!ready}><LabStatus s={s} update={update} onNavigate={v => setView(v as View)}/><div className="page-heading"><div><div className="eyebrow">{view === "dashboard" ? "VAMOS EXPERIMENTAR?" : "INVESTLAB / " + NAV.find(n => n.id === view)?.label.toUpperCase()}</div><h1>{view === "dashboard" ? "Visão geral" : NAV.find(n => n.id === view)?.label}</h1><p>{title}</p></div><button className="button primary" onClick={() => { setView("investments"); }}><Plus size={18}/>Novo investimento</button></div>
    {view === "dashboard" && <>
      <div className="dashboard-top"><section className="wealth-card"><div className="wealth-top"><span>Patrimônio total{help("tax")}</span><span className="subtle-chip">Dinheiro fictício</span></div><div className="wealth-value"><CalculationValue simulation={s}>{formatMoney(t.netEquity)}</CalculationValue></div><div className={`wealth-profit ${t.nominal < 0 ? "negative" : ""}`}><TrendingUp size={15}/><strong>{t.nominal > 0 ? "+" : ""}{pct(t.nominal)}</strong><span>desde o início · após impostos</span></div><div className="wealth-breakdown"><div><span><i className="dot lime"/>Saldo disponível</span><CalculationValue simulation={s}>{formatMoney(s.cash)}</CalculationValue></div><div><span><i className="dot purple"/>Valor investido bruto</span><CalculationValue simulation={s}>{formatMoney(t.invested)}</CalculationValue></div></div></section>
      <section className="panel time-machine"><div className="time-title"><span className="time-icon"><Clock3 size={21}/></span><div><h2>Máquina do tempo</h2><p>Veja o tempo trabalhar para você.</p></div><span className="lab-badge">LAB</span></div><div className="virtual-date"><span>DATA SIMULADA ATUAL</span><strong><CalendarDays size={17}/>{formatDate(s.date)}</strong></div><div className="time-options">{timeOptions.map(o => <button key={o.id} className={selectedDays === o.id ? "selected" : ""} onClick={() => setSelectedDays(o.id)}>{o.label}</button>)}</div><div className="time-actions"><button className="button time-button" disabled={!ready || busy} onClick={() => runTime(timeOptions.find(o => o.id === selectedDays)!.days)}><Sparkles size={16}/>{busy ? "Avançando…" : "Avançar o tempo"}</button><button className="custom-period" onClick={() => setCustomTime(true)} aria-label="Escolher período personalizado"><SlidersHorizontal size={18}/></button></div></section></div>
      <div className="metrics-grid"><div className="metric"><span>Lucro / prejuízo líquido{help("tax")}</span><CalculationValue simulation={s}><strong className={BigInt(t.profit) < 0n ? "negative" : "lime-text"}>{formatMoney(t.profit)}</strong></CalculationValue><small>Rendimento após impostos estimados</small></div><div className="metric"><span>Rentabilidade nominal{help("compound")}</span><CalculationValue simulation={s}>{pct(t.nominal)}</CalculationValue><small>Quanto seu patrimônio cresceu</small></div><div className="metric"><span>Rentabilidade real{help("inflation")}</span><CalculationValue simulation={s}><strong className={t.real < 0 ? "negative" : ""}>{pct(t.real)}</strong></CalculationValue><small>Crescimento em poder de compra</small></div><div className="metric"><span>Inflação acumulada{help("inflation")}</span><CalculationValue simulation={s}>{pct(t.inflation)}</CalculationValue><small>Desde {formatDate(START_DATE, true)}</small></div></div>
      <div className="dashboard-middle"><EquityChart simulation={s} onInspect={setInspect}/><section className="panel allocation"><div className="panel-heading"><div><h2>Sua distribuição</h2><p>Cada parte do seu patrimônio</p></div><Layers3 size={18}/></div><Allocation simulation={s}/></section></div>
      {lastAdvance && <section className="advance-result"><Sparkles size={19}/><div><strong>O que aconteceu em {lastAdvance.days} dias?</strong><p>Suas aplicações renderam {formatMoney(lastAdvance.gain)} brutos. O patrimônio líquido mudou {formatMoney(lastAdvance.nominal)}. Juros acumulados, impostos e vencimentos estão registrados no histórico.</p></div><button onClick={() => setView("history")}>Ver histórico<ChevronRight size={16}/></button></section>}
      <div className="dashboard-bottom"><section className="panel positions-panel"><div className="panel-heading"><div><h2>Seus investimentos</h2><p>{positions.length ? `${positions.length} ${positions.length === 1 ? "experimento em andamento" : "experimentos em andamento"}` : "Seu primeiro experimento começa aqui"}</p></div><button className="text-button" onClick={() => setView("investments")}>Explorar<ChevronRight size={15}/></button></div>{positions.length ? <PositionList simulation={s} onRedeem={setRedemption} compact/> : <div className="empty-investments"><span className="empty-icon"><FlaskConical size={24}/></span><div><strong>Seu dinheiro está pronto para começar.</strong><p>Escolha um CDB, aplique um valor fictício e avance o tempo.</p></div><button className="button secondary" onClick={() => setProduct("cdi")}>Fazer uma aplicação</button></div>}</section><section className="learning-card"><div className="learning-kicker"><Lightbulb size={17}/>UM CONCEITO POR VEZ</div><h2>O tempo também<br />faz seu dinheiro render.</h2><p>Conheça os juros que passam a render sobre os próprios juros.</p><button onClick={() => setLesson("compound")}>Entender juros compostos<ChevronRight size={16}/></button></section></div>
      <div className="economy-strip"><span>ECONOMIA SIMULADA</span><div>Selic <strong>{pct(s.economy.selicBps / 10000)} a.a.</strong>{help("selic")}</div><div>CDI <strong>{pct(s.economy.cdiBps / 10000)} a.a.</strong>{help("cdi")}</div><div>IPCA <strong>{pct(s.economy.ipcaBps / 10000)} a.a.</strong>{help("inflation")}</div><button onClick={() => setView("history")}>Acompanhar cenário<ChevronRight size={14}/></button></div>
    </>}
    {view === "investments" && <><BondLab simulation={s}/><div className="section-intro"><FlaskConical size={18}/><p>Aplique, observe e aprenda. Todos os produtos e valores são fictícios.</p></div><div className="product-grid">{PRODUCTS.map(p => <section className="panel product-card" key={p.id}><div className="product-card-top"><span className="product-symbol" style={{ color: p.color }}><FlaskConical size={24}/></span><span className="subtle-chip">Renda fixa</span></div><h2>{p.name}</h2><div className="product-rate" style={{ color: p.color }}>{rateLabel(p)}{help(p.kind === "cdi" ? "cdi" : "fixed")}</div><p>{p.description}</p><dl><div><dt>Investimento mínimo</dt><dd>R$ 100,00</dd></div><div><dt>Liquidez{help("liquidity")}</dt><dd>{p.liquidity === "market" ? "Venda a preço de mercado" : p.graceDays ? `Após ${p.graceDays} dias de carência` : p.liquidity === "daily" ? "Diária" : "No vencimento"}</dd></div><div><dt>Vencimento</dt><dd>{p.months} meses</dd></div><div><dt>Emissor</dt><dd>{p.issuer}</dd></div><div><dt>Proteção simulada</dt><dd>{p.fgc ? "FGC limitado por emissor" : "Sem FGC"}</dd></div><div><dt>Tributação do perfil</dt><dd>{p.exempt ? "Isento" : "IR/IOF sobre ganho"}</dd></div><div><dt>Risco</dt><dd>{p.risk}</dd></div></dl><button className="button secondary full" onClick={() => setProduct(p.id)}>Simular e investir</button></section>)}</div><section className="panel section-panel"><div className="panel-heading"><div><h2>Minha carteira</h2><p>Aplicações e valores atualizados em {formatDate(s.date, true)}</p></div></div><PositionList simulation={s} onRedeem={setRedemption}/></section></>}
    {view === "compare" && <Comparison simulation={s} onLesson={setLesson}/>}
    {view === "history" && <HistoryView simulation={s} onInspect={setInspect} onExport={exportScenario}/>}
    {["market", "portfolio", "economy", "calendar", "journal", "learn", "glossary", "universes", "advanced", "challenges"].includes(view) && <LabWorkspace s={s} update={update} view={view} universes={universes} switchUniverse={switchUniverse} saveUniverse={saveUniverse} onNavigate={v => setView(v as View)}/>}
    <footer className="workspace-footer"><span><ShieldCheck size={14}/>InvestLab · Aprenda com dinheiro fictício.</span><span>Seu progresso fica salvo neste navegador.</span></footer></main>
  </div><Toaster theme="dark" position="bottom-right" richColors/>
  <ProductDialog key={product ?? "closed"} id={product} onClose={() => setProduct(null)} simulation={s} onInvest={(id, amount, note) => { update(old => invest(old, id, amount, note)); toast.success("Aplicação fictícia realizada. Avance o tempo para ver o rendimento."); }}/>
  <Dialog open={!!lesson} onOpenChange={v => { if (!v)
        setLesson(null); }}><DialogContent className="lab-dialog education-dialog">{lesson && LESSONS[lesson] && <><span className="education-icon"><Lightbulb size={24}/></span><DialogTitle>{LESSONS[lesson].title}</DialogTitle><DialogDescription className="dialog-description">{LESSONS[lesson].text}</DialogDescription><div className="math-example">{LESSONS[lesson].example}</div>{LESSONS[lesson].note && <p className="dialog-footnote">{LESSONS[lesson].note}</p>}<button className="button primary" onClick={() => setLesson(null)}><Check size={17}/>Entendi</button></>}</DialogContent></Dialog>
  <Dialog open={customTime} onOpenChange={setCustomTime}><DialogContent className="lab-dialog"><DialogTitle>Quanto tempo quer avançar?</DialogTitle><DialogDescription className="dialog-description">Todos os investimentos e indicadores do cenário avançam juntos.</DialogDescription><form onSubmit={e => { e.preventDefault(); runTime(Number(customDays)); }}><label className="field-label" htmlFor="custom-days">Número de dias (1 a 3.650)</label><input className="standard-input" id="custom-days" type="number" min="1" max="3650" step="1" value={customDays} onChange={e => setCustomDays(e.target.value)} required/><button className="button primary full" disabled={busy} type="submit">{busy ? "Avançando…" : "Avançar o tempo"}</button></form></DialogContent></Dialog>
  <Dialog open={!!redemption} onOpenChange={v => { if (!v)
        setRedemption(null); }}><DialogContent className="lab-dialog"><DialogTitle>Resgatar aplicação</DialogTitle><DialogDescription className="dialog-description">O valor líquido volta para seu saldo fictício e esta aplicação deixa de render.</DialogDescription>{redemption && previewTax && <><div className="redemption-summary"><div><span>Valor aplicado</span><strong>{formatMoney(redemption.principal)}</strong></div><div><span>Saldo bruto</span><strong>{formatMoney(redemption.balance)}</strong></div><div><span>IR estimado</span><strong>{formatMoney(previewTax.ir)}</strong></div><div><span>IOF estimado</span><strong>{formatMoney(previewTax.iof)}</strong></div><div className="net-row"><span>Você recebe</span><strong>{formatMoney(previewTax.net)}</strong></div></div><button className="button primary full" onClick={() => { perform(old => redeem(old, redemption.id), "Resgate realizado. Valor líquido disponível no saldo."); setRedemption(null); }}>Confirmar resgate fictício</button></>}</DialogContent></Dialog>
  <Dialog open={inspect !== null} onOpenChange={v => { if (!v)
        setInspect(null); }}><DialogContent className="lab-dialog"><DialogTitle>Seu patrimônio em outra data</DialogTitle><DialogDescription className="dialog-description">Consulte o fechamento de qualquer dia já simulado. A consulta não altera o relógio.</DialogDescription><label className="field-label" htmlFor="history-date">Data do histórico</label><input className="standard-input" id="history-date" type="date" min={ensureLab(s).startDate} max={s.date} value={inspect ?? s.date} onChange={e => setInspect(e.target.value)}/>{(() => { const snap = s.snapshots.find(p => p.date === inspect); return snap ? <div className="redemption-summary"><div><span>Patrimônio líquido estimado</span><strong>{formatMoney(snap.netEquity)}</strong></div><div><span>Saldo disponível</span><strong>{formatMoney(snap.cash)}</strong></div><div><span>Investido bruto</span><strong>{formatMoney(snap.invested)}</strong></div><div><span>CDI do cenário</span><strong>{pct(snap.cdiBps / 10000)} a.a.</strong></div></div> : <p>Escolha uma data dentro do período simulado.</p>; })()}</DialogContent></Dialog>
  <Dialog open={settings} onOpenChange={setSettings}><DialogContent className="lab-dialog"><DialogTitle>Meu cenário</DialogTitle><DialogDescription className="dialog-description">O progresso é salvo neste navegador. Exporte uma cópia para guardar o histórico fora dele.</DialogDescription><div className="scenario-facts"><span>Início: {formatDate(START_DATE, true)}</span><span>Seed atual: {s.seed}</span><span>{s.snapshots.length} dias registrados · {s.transactions.length} movimentos</span></div><button className="button secondary full" onClick={exportScenario}><Download size={17}/>Exportar cenário completo</button><label className="field-label" htmlFor="scenario-seed">Seed para um novo cenário</label><input className="standard-input" id="scenario-seed" type="number" min="1" max="4294967295" value={seed} onChange={e => setSeed(e.target.value)}/><p className="field-hint">A mesma seed e as mesmas decisões reproduzem a mesma economia.</p><button className="button reset-button" onClick={() => { try {
        createSimulation(Number(seed));
        setResetOpen(true);
    }
    catch (e) {
        toast.error((e as Error).message);
    } }}><RotateCcw size={16}/>Reiniciar com R$ 10.000</button></DialogContent></Dialog>
  <AlertDialog open={resetOpen} onOpenChange={setResetOpen}><AlertDialogContent className="lab-dialog"><AlertDialogTitle>Começar um novo experimento?</AlertDialogTitle><AlertDialogDescription>O saldo, as aplicações e o histórico deste navegador serão substituídos. Exporte seu cenário antes se quiser guardar uma cópia.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Continuar neste cenário</AlertDialogCancel><AlertDialogAction onClick={() => { perform(() => createSimulation(Number(seed)), "Novo laboratório iniciado."); setSettings(false); setLastAdvance(null); setInspect(null); setView("dashboard"); }}>Reiniciar simulação</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </SidebarProvider>);
}
function Allocation({ simulation: s }: {
    simulation: Simulation;
}) {
    const colors = ["#65756a", "#bded86", "#aa8fd8", "#78b3dd", "#e2b36c", "#80bbb2", "#e1898b"];
    const groups = exposures(s, "class").filter(g => BigInt(g.value) > 0n).map((g, i) => ({ label: CLASS_LABELS[g.name as keyof typeof CLASS_LABELS] ?? (g.name === "cash" ? "Caixa" : g.name === "fixed" ? "Renda fixa" : g.name), color: colors[i % colors.length], amount: g.value }));
    const total = Math.max(.01, groups.reduce((v, g) => v + displayNumber(g.amount), 0));
    let start = 0;
    const stops = groups.map(g => { const end = start + displayNumber(g.amount) / total * 100; const result = `${g.color} ${start}% ${end}%`; start = end; return result; });
    return explainConcepts(<><div className="donut" role="img" aria-label={groups.map(g => `${g.label}: ${formatMoney(g.amount)}`).join(", ")} style={{ background: `conic-gradient(${stops.join(",")})` }}><div><span>{activePositions(s).length}</span><small>{activePositions(s).length === 1 ? "aplicação" : "aplicações"}</small></div></div><div className="allocation-legend">{groups.map(g => <div key={g.label}><span><i className="dot" style={{ background: g.color }}/>{g.label}</span><strong>{pct(displayNumber(g.amount) / total)}</strong></div>)}</div></>);
}
function PositionList({ simulation: s, onRedeem, compact = false }: {
    simulation: Simulation;
    onRedeem: (p: Position) => void;
    compact?: boolean;
}) {
    const formatMoney = (v: string) => nominalMoney(ensureLab(s).viewReal ? realValue(v, s.economy.inflationFactor) : v);
    const positions = activePositions(s);
    if (!positions.length)
        return explainConcepts(<div className="empty-state"><Wallet size={28}/><h3>Sua carteira ainda está vazia</h3><p>Escolha um dos produtos acima para começar.</p></div>);
    return explainConcepts(<div className="positions-list">{positions.map(p => { const product = getProduct(p.productId), tax = bondTax(s, p), locked = !canRedeem(s, p); return <article className="position" key={p.id}><div className="position-main"><span className="position-icon" style={{ color: product.color }}><CircleDollarSign size={21}/></span><div><h3>{product.name}</h3><p>{rateLabel(product)} · {product.liquidity === "market" ? "Preço de mercado" : locked ? "Carência / vencimento" : "Liquidez diária"}</p></div><div className="position-value"><CalculationValue simulation={s} id={p.id}>{formatMoney(tax.net)}</CalculationValue><span>Líquido estimado</span></div></div>{!compact && <><div className="position-details"><div><span>Aplicado</span><CalculationValue simulation={s} id={p.id}>{formatMoney(p.principal)}</CalculationValue></div><div><span>Rendimento bruto</span><CalculationValue simulation={s} id={p.id}>{formatMoney((BigInt(p.balance) - BigInt(p.principal)).toString())}</CalculationValue></div><div><span>Impostos provisionados</span><CalculationValue simulation={s} id={p.id}>{formatMoney(tax.total)}</CalculationValue></div><div><span>Rendimento líquido</span><CalculationValue simulation={s} id={p.id}>{formatMoney((BigInt(tax.net) - BigInt(p.principal)).toString())}</CalculationValue></div><div><span>Vencimento</span><strong>{formatDate(p.maturity, true)}</strong></div><div><span>Saldo bruto</span><CalculationValue simulation={s} id={p.id}>{formatMoney(bondMarketValue(s, p))}</CalculationValue></div></div><p className="position-risk">Indexador: {product.benchmark ?? product.kind} · Risco: {product.risk}</p></>}<div className="position-actions"><span>{locked ? <><LockKeyhole size={13}/>Resgate sujeito a carência / prazo</> : <>Aplicado em {formatDate(p.opened, true)}</>}</span><button className="text-button" disabled={locked} onClick={() => onRedeem(p)}>Resgatar</button></div></article>; })}</div>);
}
function Comparison({ simulation: s, onLesson }: {
    simulation: Simulation;
    onLesson: (key: string) => void;
}) {
    const formatMoney = (v: string) => nominalMoney(ensureLab(s).viewReal ? realValue(v, s.economy.inflationFactor) : v);
    const [months, setMonths] = useState("12"), [left, setLeft] = useState("fixed"), [right, setRight] = useState("cdi"), days = daysBetween(ensureLab(s).startDate, s.date), historical = s.snapshots.at(-1)!;
    return explainConcepts(<><div className="section-intro"><ArrowLeftRight size={18}/><p>Compare dois produtos do catálogo. Objetivos diferentes pedem escolhas diferentes.</p></div><div className="comparison-controls"><span>Projeção de R$ 1.000 com as taxas de hoje</span><Tabs value={months} onValueChange={setMonths}><TabsList><TabsTrigger value="6">6 meses</TabsTrigger><TabsTrigger value="12">12 meses</TabsTrigger><TabsTrigger value="24">24 meses</TabsTrigger></TabsList></Tabs></div><div className="compare-pickers"><label>Primeiro investimento<select value={left} onChange={e => setLeft(e.target.value)}>{PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Segundo investimento<select value={right} onChange={e => setRight(e.target.value)}>{PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div><div className="comparison-grid">{[getProduct(left), getProduct(right)].map((p, index) => { const projection = project(p.id, "1000", Number(months), s); const benchmark = p.id === "fixed" ? historical.fixedBenchmark : p.id === "cdi" ? historical.cdiBenchmark : null; return <section className="panel comparison-card" key={`${p.id}-${index}`}><span className="subtle-chip">{p.kind === "fixed" ? "Taxa contratada" : "Acompanha o cenário"}</span><h2>{p.name}</h2><div className="product-rate" style={{ color: p.color }}>{rateLabel(p)}</div><dl><div><dt>Taxa equivalente hoje</dt><dd>{pct(annualRate(p, s.economy) / 10000)} a.a.</dd></div><div><dt>Risco</dt><dd>{p.risk}</dd></div><div><dt>Liquidez</dt><dd>{p.liquidity === "market" ? "Venda a preço de mercado" : p.graceDays ? `Após ${p.graceDays} dias de carência` : p.liquidity === "daily" ? "Diária" : "No vencimento"}</dd></div><div><dt>IR / IOF</dt><dd>{p.exempt ? "Isento no perfil simulado" : "Regressivos, sobre o ganho"}</dd></div><div><dt>Proteção contratual contra inflação</dt><dd>{p.kind === "ipca" ? "IPCA + juros reais" : "Não"}</dd></div></dl><div className="comparison-result"><span>Projeção líquida em {months} meses</span><strong style={{ color: p.color }}>{nominalMoney(s.lab?.viewReal ? projection.netReal : projection.net)}</strong><small>Bruto {nominalMoney(s.lab?.viewReal ? projection.grossReal : projection.gross)} · Impostos {formatMoney(projection.total)}</small></div>{benchmark && <div className="historical-benchmark"><span>Referência histórica · {days} dias</span><strong>{formatMoney(benchmark)}</strong><p>R$ 1.000 desde o início, rendimento bruto teórico contínuo, sem resgates, impostos ou vencimento.</p></div>}{p.liquidity === "maturity" && Number(months) < p.months && <p className="field-hint">O valor projetado fica aplicado até {p.months} meses.</p>}</section>; })}</div><div className="comparison-note"><Lightbulb size={20}/><p>A projeção mantém as taxas atuais constantes. A referência histórica usa as taxas que efetivamente ocorreram no cenário. Ela serve para comparar indexadores e não representa uma aplicação da sua carteira.</p><button className="text-button" onClick={() => onLesson("cdi")}>Entender CDI</button></div></>);
}
function HistoryView({ simulation: s, onInspect, onExport }: {
    simulation: Simulation;
    onInspect: (date: string) => void;
    onExport: () => void;
}) {
    const formatMoney = (v: string) => nominalMoney(ensureLab(s).viewReal ? realValue(v, s.economy.inflationFactor) : v);
    const [filter, setFilter] = useState("movements"), [limit, setLimit] = useState(50);
    const filtered = s.transactions.filter(tx => filter === "all" || filter === "yield" && tx.type === "yield" || filter === "economy" && tx.type === "economy" || filter === "movements" && !["yield", "economy"].includes(tx.type)).toReversed();
    function icon(tx: Transaction) { return tx.type === "economy" ? <Sparkles size={19}/> : tx.type === "yield" ? <TrendingUp size={19}/> : tx.type === "tax" ? <ShieldCheck size={19}/> : tx.type === "invest" ? <Plus size={19}/> : <Wallet size={19}/>; }
    return explainConcepts(<section className="panel history-panel"><div className="panel-heading"><div><h2>Histórico do laboratório</h2><p>Todos os movimentos usam a data simulada.</p></div><button className="button secondary" onClick={onExport}><Download size={16}/>Exportar</button></div><Tabs value={filter} onValueChange={v => { setFilter(v); setLimit(50); }}><TabsList className="history-tabs"><TabsTrigger value="movements">Movimentações</TabsTrigger><TabsTrigger value="yield">Rendimentos</TabsTrigger><TabsTrigger value="economy">Economia</TabsTrigger><TabsTrigger value="all">Tudo</TabsTrigger></TabsList></Tabs><div className="history-list">{filtered.slice(0, limit).map(tx => <article className="transaction" key={tx.id}><span className={`transaction-icon ${tx.type}`}>{icon(tx)}</span><div><h3>{tx.title}</h3><p>{tx.detail}</p><button className="transaction-date" onClick={() => onInspect(tx.date)}>{formatDate(tx.date, true)}</button></div>{tx.amount && <strong className={tx.type === "yield" ? "lime-text" : ""}>{tx.type === "lab" ? "" : tx.type === "invest" || tx.type === "tax" ? "− " : BigInt(tx.amount) < 0n ? "" : "+ "}{formatMoney(tx.amount)}</strong>}</article>)}</div>{!filtered.length && <div className="empty-state"><History size={28}/><h3>Nenhum registro nesta categoria</h3><p>Os registros aparecem conforme você investe e avança o tempo.</p></div>}{filtered.length > limit && <button className="button secondary full" onClick={() => setLimit(v => v + 50)}>Mostrar mais 50 registros ({filtered.length - limit} restantes)</button>}</section>);
}
