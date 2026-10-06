import { z } from "zod";
import { START_DATE, daysBetween } from "./clock";
import type { Simulation } from "./types";
const positive = z.string().regex(/^\d{1,50}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d => !Number.isNaN(Date.parse(d)));
const rate = z.number().int().min(0).max(10000);
const schema = z.object({
  version: z.literal(1), seed: z.number().int().min(1).max(4294967295), date, cash: positive, initial: positive.refine(n => BigInt(n) > 0n), nextId: z.number().int().positive(),
  economy: z.object({ selicBps: rate, cdiBps: rate, ipcaBps: rate, inflationFactor: positive.refine(n => BigInt(n) > 0n), rng: z.number().int().min(0).max(4294967295), regime: z.enum(["stable", "expansion", "contraction"]) }),
  positions: z.array(z.object({ id: z.string(), productId: z.enum(["fixed", "cdi"]), principal: positive, balance: positive, opened: date, maturity: date, status: z.enum(["active", "redeemed", "matured"]) })),
  transactions: z.array(z.object({ id: z.string(), date, type: z.enum(["start", "invest", "redeem", "maturity", "yield", "tax", "economy"]), title: z.string(), detail: z.string(), amount: positive.optional(), positionId: z.string().optional() })),
  snapshots: z.array(z.object({ date, cash: positive, invested: positive, equity: positive, netEquity: positive, inflationFactor: positive.refine(n => BigInt(n) > 0n), cdiBps: rate, selicBps: rate, ipcaBps: rate, fixedBenchmark: positive, cdiBenchmark: positive })).min(1),
}).refine(s => daysBetween(START_DATE, s.date) >= 0 && daysBetween(START_DATE, s.date) <= 36500 && s.snapshots.at(-1)?.date === s.date);
export function parseSimulation(raw: string): Simulation { if (raw.length > 50000000) throw new Error("Arquivo muito grande."); return schema.parse(JSON.parse(raw)); }
export const STORAGE_KEY = "investlab.simulation.v1";
