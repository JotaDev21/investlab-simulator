import type { Economy } from "./economy";
export type Position = { id: string; productId: string; principal: string; balance: string; opened: string; maturity: string; status: "active" | "redeemed" | "matured" };
export type Transaction = { id: string; date: string; type: "start" | "invest" | "redeem" | "maturity" | "yield" | "tax" | "economy"; title: string; detail: string; amount?: string; positionId?: string };
export type Snapshot = { date: string; cash: string; invested: string; equity: string; netEquity: string; inflationFactor: string; cdiBps: number; selicBps: number; ipcaBps: number; fixedBenchmark: string; cdiBenchmark: string };
export type Simulation = { version: 1; seed: number; date: string; cash: string; initial: string; economy: Economy; positions: Position[]; transactions: Transaction[]; snapshots: Snapshot[]; nextId: number };
