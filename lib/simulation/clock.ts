export const START_DATE = "2026-10-06";
const DAY = 86400000;
export function addDays(date: string, days: number): string { return new Date(Date.parse(date + "T12:00:00Z") + days * DAY).toISOString().slice(0, 10); }
export function daysBetween(from: string, to: string): number { return Math.round((Date.parse(to + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) / DAY); }
export function addMonths(date: string, months: number): string {
  const d = new Date(date + "T12:00:00Z"), day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last)); return d.toISOString().slice(0, 10);
}
export function formatDate(date: string, short = false): string { return new Date(date + "T12:00:00Z").toLocaleDateString("pt-BR", { day: "2-digit", month: short ? "short" : "long", year: "numeric", timeZone: "UTC" }); }
