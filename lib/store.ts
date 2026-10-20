"use client";

import * as React from "react";
import type {
  AppSettings,
  Category,
  DBShape,
  GoodsReceipt,
  InventoryBalance,
  InventoryItem,
  MenuItem,
  NotificationRec,
  Outlet,
  PurchaseOrder,
  Recipe,
  StockBatch,
  StockCount,
  StockMovement,
  StockTransfer,
  StorageLocation,
  Supplier,
  SupplierInvoice,
  TeamMember,
  WasteRecord,
} from "./types";
import { buildSeed } from "./seed-data";
import { backComputeBalances } from "./ops";

const DB_KEY = "stockpilot.db";
const DB_VERSION = 2;

type Listener = (db: DBShape) => void;

let dbCache: DBShape | null = null;
const listeners = new Set<Listener>();

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function validateShape(candidate: unknown): DBShape | null {
  if (!candidate || typeof candidate !== "object") return null;
  const c = candidate as Partial<DBShape>;
  if (c.v !== DB_VERSION) return null;
  const requiredArrays: (keyof DBShape)[] = [
    "outlets", "storageLocations", "categories", "suppliers", "items", "balances",
    "movements", "purchaseOrders", "receipts", "counts", "waste", "transfers",
    "recipes", "menuItems", "invoices", "notifications", "team", "batches",
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray(c[key])) return null;
  }
  if (!c.settings?.profile) return null;
  return c as DBShape;
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(patch) ? (patch as T) : base);
  if (base && typeof base === "object") {
    if (patch && typeof patch === "object" && !Array.isArray(patch)) {
      const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
      for (const k of Object.keys(base as Record<string, unknown>)) {
        out[k] = deepMerge((base as Record<string, unknown>)[k], (patch as Record<string, unknown>)[k]);
      }
      return out as T;
    }
    return base;
  }
  return (patch === undefined || patch === null ? base : (patch as T));
}

export function loadDB(): DBShape {
  if (typeof window === "undefined") return buildSeed();
  if (dbCache) return dbCache;
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    const parsed = safeParse(raw);
    const valid = validateShape(parsed);
    if (valid) {
      // forward-compat: merge any missing fields from a fresh seed
      dbCache = deepMerge(buildSeed(), valid);
      return dbCache;
    }
    if (raw) {
      // corrupted / outdated schema -> back it up then reseed
      window.localStorage.setItem(`${DB_KEY}.backup.${Date.now()}`, raw);
    }
    const seed = backComputeBalances(buildSeed());
    persist(seed);
    dbCache = seed;
    return seed;
  } catch {
    const seed = backComputeBalances(buildSeed());
    dbCache = seed;
    return seed;
  }
}

function persist(db: DBShape) {
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify({ ...db, updatedAt: new Date().toISOString() }));
  } catch {
    // storage may be full or blocked; app continues in memory
  }
}

export function saveDB(db: DBShape) {
  dbCache = db;
  persist(db);
  listeners.forEach((l) => l(db));
}

export function resetDB(): DBShape {
  const seed = backComputeBalances(buildSeed());
  saveDB(seed);
  return seed;
}

function emit(db: DBShape) {
  dbCache = db;
  persist(db);
  listeners.forEach((l) => l(db));
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export interface StoreApi {
  db: DBShape;
  update: (fn: (draft: DBShape) => DBShape) => void;
  reset: () => void;
}

export const StoreContext = React.createContext<StoreApi | null>(null);

export function useStore(): StoreApi {
  const [db, setDb] = React.useState<DBShape>(() => buildSeed());

  // SSR/client hydration: localStorage isn't readable during SSR, so hydrate once on mount.
  React.useEffect(() => {
    setDb(loadDB());
  }, []);

  React.useEffect(() => {
    const unsub = subscribe(setDb);
    // sync across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === DB_KEY) {
        dbCache = null;
        setDb(loadDB());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = React.useCallback((fn: (draft: DBShape) => DBShape) => {
    const next = fn(loadDB());
    emit(next);
  }, []);

  const reset = React.useCallback(() => {
    setDb(resetDB());
  }, []);

  return React.useMemo(() => ({ db, update, reset }), [db, update, reset]);
}

/* ----------------------- entity selectors ----------------------- */

export const sel = {
  outlet: (db: DBShape, id: string): Outlet | undefined => db.outlets.find((o) => o.id === id),
  outletName: (db: DBShape, id: string): string => db.outlets.find((o) => o.id === id)?.name ?? "—",
  location: (db: DBShape, id: string): StorageLocation | undefined => db.storageLocations.find((l) => l.id === id),
  locationName: (db: DBShape, id: string): string => db.storageLocations.find((l) => l.id === id)?.name ?? "—",
  item: (db: DBShape, id: string): InventoryItem | undefined => db.items.find((i) => i.id === id),
  itemName: (db: DBShape, id: string): string => db.items.find((i) => i.id === id)?.name ?? "Unknown item",
  category: (db: DBShape, id: string): Category | undefined => db.categories.find((c) => c.id === id),
  categoryName: (db: DBShape, id: string): string => db.categories.find((c) => c.id === id)?.name ?? "—",
  supplier: (db: DBShape, id: string): Supplier | undefined => db.suppliers.find((s) => s.id === id),
  supplierName: (db: DBShape, id: string): string => db.suppliers.find((s) => s.id === id)?.name ?? "—",
  recipe: (db: DBShape, id: string): Recipe | undefined => db.recipes.find((r) => r.id === id),
  menuItem: (db: DBShape, id: string): MenuItem | undefined => db.menuItems.find((m) => m.id === id),
  po: (db: DBShape, id: string): PurchaseOrder | undefined => db.purchaseOrders.find((p) => p.id === id),
  balance: (db: DBShape, itemId: string, outletId: string): InventoryBalance | undefined =>
    db.balances.find((b) => b.itemId === itemId && b.outletId === outletId),
  teamMember: (db: DBShape, id: string): TeamMember | undefined => db.team.find((t) => t.id === id),
};

/* ----------------------- typed collection helpers ----------------------- */

export function upsert<T extends { id: string }>(list: T[], rec: T): T[] {
  const idx = list.findIndex((x) => x.id === rec.id);
  if (idx === -1) return [rec, ...list];
  const copy = [...list];
  copy[idx] = rec;
  return copy;
}

export type {
  AppSettings, Category, DBShape, GoodsReceipt, InventoryBalance, InventoryItem, MenuItem,
  NotificationRec, Outlet, PurchaseOrder, Recipe, StockBatch, StockCount, StockMovement,
  StockTransfer, StorageLocation, Supplier, SupplierInvoice, TeamMember, WasteRecord,
};
