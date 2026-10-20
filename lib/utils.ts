import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Unit } from "./types";
import { UNIT_ALIASES } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUnit(u: string): Unit {
  return UNIT_ALIASES[u.toLowerCase().trim()] ?? "pieces";
}

let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
};

export function formatMoney(amount: number, currency = "INR"): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  const n = Number.isFinite(amount) ? amount : 0;
  const sign = n < 0 ? "-" : "";
  return `${sign}${symbol}${Math.abs(n).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

export function formatMoneyShort(amount: number, currency = "INR"): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  const n = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}${symbol}${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}${symbol}${(abs / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}${symbol}${(abs / 1000).toFixed(1)}k`;
  return `${sign}${symbol}${abs.toFixed(0)}`;
}

export function formatQty(qty: number, unit?: Unit): string {
  const r = Number.isFinite(qty) ? qty : 0;
  const rounded = Math.abs(r) >= 100 ? Math.round(r) : Math.round(r * 100) / 100;
  return unit ? `${rounded.toLocaleString("en-IN")} ${unit}` : rounded.toLocaleString("en-IN");
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}, ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const a = from instanceof Date ? from : new Date(from);
  const b = to instanceof Date ? to : new Date(to);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function daysUntil(iso: string): number {
  return daysBetween(new Date(), iso);
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = toCsv(headers, rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function titleCase(s: string): string {
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function inDateRange(iso: string, from?: string, to?: string): boolean {
  const t = new Date(iso).getTime();
  if (from) {
    const f = new Date(from).getTime();
    if (t < f) return false;
  }
  if (to) {
    const l = new Date(to).getTime();
    if (t > l + 86_399_999) return false;
  }
  return true;
}

export function sumBy<T>(arr: T[], fn: (x: T) => number): number {
  return arr.reduce((acc, x) => acc + fn(x), 0);
}

export function groupBy<T, K extends string>(arr: T[], key: (x: T) => K): Record<K, T[]> {
  return arr.reduce((acc, x) => {
    const k = key(x);
    (acc[k] ??= []).push(x);
    return acc;
  }, {} as Record<K, T[]>);
}

export function nextSeq(prefix: string, existing: string[], pad = 4): string {
  let max = 0;
  for (const e of existing) {
    const m = e.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(pad, "0")}`;
}
