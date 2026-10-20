import {
  applyWeightedAverage,
  calculateRecipeCost,
  computeLineTotals,
  computePOGrandTotals,
  generateReorderSuggestions,
  getStockStatus,
} from "./calculations";
import { loadDB, saveDB, type StoreApi, upsert } from "./store";
import type {
  DBShape,
  GoodsReceipt,
  InventoryItem,
  MovementType,
  PurchaseOrder,
  PurchaseOrderLine,
  Recipe,
  StockMovement,
  StockTransfer,
  SupplierInvoice,
  Unit,
  WasteRecord,
} from "./types";
import { nextSeq, round2, round3, uid } from "./utils";
import { convertQty } from "./types";

export class OpsError extends Error {}

function nowISO() {
  return new Date().toISOString();
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function notify(db: DBShape, rec: Omit<DBShape["notifications"][number], "id" | "at" | "read">): DBShape {
  return {
    ...db,
    notifications: [{ ...rec, id: uid("ntf"), at: nowISO(), read: false }, ...db.notifications],
  };
}

/* ------------------------- stock core ------------------------- */

export function getBalanceQty(db: DBShape, itemId: string, outletId: string): number {
  return db.balances.find((b) => b.itemId === itemId && b.outletId === outletId)?.qty ?? 0;
}

export function getBalanceCost(db: DBShape, itemId: string, outletId: string): number {
  const bal = db.balances.find((b) => b.itemId === itemId && b.outletId === outletId);
  const item = db.items.find((i) => i.id === itemId);
  return bal?.avgCost || item?.avgCost || 0;
}

/**
 * Rough back-computed current balances from the movement ledger.
 * Only used to FILL SEED balances (seed movements are illustrative history with
 * balanceAfter = 0), never for live stock — live stock lives in db.balances.
 */
export function backComputeBalances(db: DBShape): DBShape {
  const net = new Map<string, number>();
  const key = (itemId: string, outletId: string) => `${itemId}|${outletId}`;
  for (const m of db.movements) {
    const k = key(m.itemId, m.outletId);
    net.set(k, (net.get(k) ?? 0) + m.qtyIn - m.qtyOut);
  }
  const balances = db.balances.map((b) => {
    const delta = net.get(key(b.itemId, b.outletId));
    if (!delta) return b;
    return { ...b, qty: round3(Math.max(0, b.qty + delta)), updatedAt: db.updatedAt };
  });
  return { ...db, balances };
}

export interface ApplyStockArgs {
  db: DBShape;
  itemId: string;
  outletId: string;
  /** quantity in item's BASE unit */
  qtyDelta: number;
  /** cost per base unit (for receipts / valuation) */
  unitCost?: number;
  type: MovementType;
  refNo: string;
  performedBy: string;
  notes?: string;
  relatedId?: string;
  /** allow negative balance (adjustments/finalized counts) */
  allowNegative?: boolean;
}

/** Core primitive: mutates balance + appends an audit movement. NEVER overwrites history. */
export function applyStock(args: ApplyStockArgs): { db: DBShape; balanceAfter: number } {
  const { db, itemId, outletId, qtyDelta, type, refNo } = args;
  const item = db.items.find((i) => i.id === itemId);
  if (!item) throw new OpsError("Item not found");

  const existing = db.balances.find((b) => b.itemId === itemId && b.outletId === outletId);
  const prevQty = existing?.qty ?? 0;
  const prevCost = existing?.avgCost || item.avgCost;
  const nextQty = round3(prevQty + qtyDelta);

  if (nextQty < -0.0001 && !args.allowNegative) {
    throw new OpsError(
      `Insufficient stock for ${item.name}: available ${prevQty} ${item.baseUnit}, requested ${Math.abs(qtyDelta)} ${item.baseUnit}`
    );
  }

  const avgCost =
    qtyDelta > 0 && args.unitCost !== undefined
      ? round2(applyWeightedAverage(prevQty, prevCost, qtyDelta, args.unitCost))
      : prevCost;

  const balances = existing
    ? db.balances.map((b) =>
        b.itemId === itemId && b.outletId === outletId
          ? { ...b, qty: Math.max(0, nextQty), avgCost, updatedAt: nowISO() }
          : b
      )
    : [
        ...db.balances,
        { id: uid("bal"), itemId, outletId, qty: Math.max(0, nextQty), avgCost, updatedAt: nowISO() },
      ];

  const movement: StockMovement = {
    id: uid("mov"),
    at: nowISO(),
    refNo,
    type,
    itemId,
    outletId,
    qtyIn: qtyDelta > 0 ? round3(qtyDelta) : 0,
    qtyOut: qtyDelta < 0 ? round3(Math.abs(qtyDelta)) : 0,
    unitCost: round2(args.unitCost ?? prevCost),
    balanceAfter: Math.max(0, nextQty),
    performedBy: args.performedBy,
    notes: args.notes ?? "",
    relatedId: args.relatedId,
  };

  return {
    db: { ...db, balances, movements: [movement, ...db.movements] },
    balanceAfter: Math.max(0, nextQty),
  };
}

export function recordManualStockIn(
  store: StoreApi,
  args: { itemId: string; outletId: string; qty: number; unitCost?: number; notes?: string }
): void {
  const db = loadDB();
  const item = db.items.find((i) => i.id === args.itemId);
  if (!item) throw new OpsError("Select an item");
  if (!(args.qty > 0)) throw new OpsError("Quantity must be greater than zero");
  const ref = nextSeq("SIN", uniqueRefs(db.movements));
  const { db: next } = applyStock({
    db,
    itemId: args.itemId,
    outletId: args.outletId,
    qtyDelta: args.qty,
    unitCost: args.unitCost ?? item.purchasePrice / Math.max(1, item.conversion.purchaseQty),
    type: "manual_stock_in",
    refNo: ref,
    performedBy: "Demo User",
    notes: args.notes ?? "Manual stock in",
  });
  saveDB(next);
}

function uniqueRefs(movements: StockMovement[]): string[] {
  return Array.from(new Set(movements.map((m) => m.refNo)));
}

export function recordManualStockOut(
  store: StoreApi,
  args: { itemId: string; outletId: string; qty: number; reason?: string }
): void {
  const db = loadDB();
  if (!(args.qty > 0)) throw new OpsError("Quantity must be greater than zero");
  const ref = nextSeq("SOUT", uniqueRefs(db.movements));
  const { db: next } = applyStock({
    db,
    itemId: args.itemId,
    outletId: args.outletId,
    qtyDelta: -args.qty,
    type: "stock_out",
    refNo: ref,
    performedBy: "Demo User",
    notes: args.reason ?? "Manual stock out",
  });
  saveDB(next);
}

/* ------------------------- items ------------------------- */

export function createInventoryItem(
  store: StoreApi,
  input: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "avgCost"> & { openingStock?: number }
): InventoryItem {
  const db = loadDB();
  const { openingStock = 0, ...rest } = input;
  if (!rest.name.trim()) throw new OpsError("Item name is required");
  if (db.items.some((i) => i.sku.toLowerCase() === rest.sku.toLowerCase())) {
    throw new OpsError(`SKU ${rest.sku} already exists`);
  }
  if (openingStock < 0) throw new OpsError("Opening stock cannot be negative");
  const factor = rest.conversion?.purchaseQty > 0 ? rest.conversion.purchaseQty : 1;
  const avgCost = round2(rest.purchasePrice / factor);
  const item: InventoryItem = {
    ...rest,
    id: uid("itm"),
    avgCost,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  let next: DBShape = { ...db, items: [item, ...db.items] };
  if (openingStock > 0) {
    const outletId = item.outletIds[0] ?? db.outlets[0].id;
    const { db: d2 } = applyStock({
      db: next,
      itemId: item.id,
      outletId,
      qtyDelta: openingStock,
      unitCost: avgCost,
      type: "manual_stock_in",
      refNo: nextSeq("SIN", uniqueRefs(db.movements)),
      performedBy: "Demo User",
      notes: "Opening stock on item creation",
    });
    next = d2;
  }
  saveDB(next);
  return item;
}

export function updateInventoryItem(store: StoreApi, id: string, patch: Partial<InventoryItem>): void {
  const db = loadDB();
  const item = db.items.find((i) => i.id === id);
  if (!item) throw new OpsError("Item not found");
  const newSku = patch.sku;
  if (newSku && db.items.some((i) => i.id !== id && i.sku.toLowerCase() === newSku.toLowerCase())) {
    throw new OpsError(`SKU ${newSku} already used by another item`);
  }
  const merged: InventoryItem = { ...item, ...patch, id, updatedAt: nowISO() };
  const factor = merged.conversion?.purchaseQty > 0 ? merged.conversion.purchaseQty : 1;
  merged.avgCost = round2(merged.purchasePrice / factor);
  saveDB({ ...db, items: upsert(db.items, merged) });
}

export function archiveInventoryItem(store: StoreApi, id: string): void {
  const db = loadDB();
  const item = db.items.find((i) => i.id === id);
  if (!item) throw new OpsError("Item not found");
  saveDB({
    ...db,
    items: upsert(db.items, { ...item, status: "archived", updatedAt: nowISO() }),
  });
}

/* ------------------------- waste ------------------------- */

export function recordWaste(
  store: StoreApi,
  args: { itemId: string; outletId: string; qty: number; reason: WasteRecord["reason"]; notes?: string; at?: string; batchNo?: string }
): WasteRecord {
  const db = loadDB();
  const item = db.items.find((i) => i.id === args.itemId);
  if (!item) throw new OpsError("Select an item");
  if (!(args.qty > 0)) throw new OpsError("Quantity must be greater than zero");
  const available = getBalanceQty(db, args.itemId, args.outletId);
  if (args.qty > available + 0.0001) {
    throw new OpsError(`Only ${available} ${item.baseUnit} available at this outlet — cannot waste ${args.qty} ${item.baseUnit}`);
  }
  const unitCost = getBalanceCost(db, args.itemId, args.outletId);
  const rec: WasteRecord = {
    id: uid("wst"),
    itemId: args.itemId,
    outletId: args.outletId,
    qty: round3(args.qty),
    unitCost: round2(unitCost),
    cost: round2(args.qty * unitCost),
    reason: args.reason,
    at: args.at ?? nowISO(),
    notes: args.notes ?? "",
    recordedBy: "Demo User",
    batchNo: args.batchNo,
  };
  const { db: next } = applyStock({
    db: { ...db, waste: [rec, ...db.waste] },
    itemId: args.itemId,
    outletId: args.outletId,
    qtyDelta: -args.qty,
    unitCost,
    type: "waste",
    refNo: `WST-${nextSeq("", uniqueRefs(db.movements).filter((r) => r.startsWith("WST-")).map((r) => r.slice(4)))}`,
    performedBy: "Demo User",
    notes: `${args.reason}${args.notes ? ` — ${args.notes}` : ""}`,
    relatedId: rec.id,
  });
  saveDB(next);
  return rec;
}

/* ------------------------- purchase orders ------------------------- */

export function createPurchaseOrder(
  store: StoreApi,
  args: {
    supplierId: string;
    outletId: string;
    expectedDate: string;
    notes?: string;
    lines: { itemId: string; qty: number; unitCost: number; discountPct?: number; taxPct?: number }[];
    status?: PurchaseOrder["status"];
  }
): PurchaseOrder {
  const db = loadDB();
  if (!args.supplierId) throw new OpsError("Select a supplier");
  if (!args.outletId) throw new OpsError("Select a delivery outlet");
  if (args.lines.length === 0) throw new OpsError("Add at least one line item");
  for (const l of args.lines) {
    if (!(l.qty > 0)) throw new OpsError("All line quantities must be greater than zero");
    if (l.unitCost < 0) throw new OpsError("Unit cost cannot be negative");
  }
  const poNumber = nextSeq(db.settings.procurement.poPrefix, db.purchaseOrders.map((p) => p.poNumber));
  const lines: PurchaseOrderLine[] = args.lines.map((l) => ({
    id: uid("ln"),
    itemId: l.itemId,
    qtyOrdered: l.qty,
    unitCost: l.unitCost,
    qtyReceived: 0,
    discountPct: l.discountPct ?? 0,
    taxPct: l.taxPct ?? 5,
    status: "pending",
  }));
  const initial: PurchaseOrder["status"] =
    args.status ?? (db.settings.procurement.requireApproval ? "pending_approval" : "approved");
  const po: PurchaseOrder = {
    id: uid("po"),
    poNumber,
    supplierId: args.supplierId,
    outletId: args.outletId,
    orderDate: todayISO(),
    expectedDate: args.expectedDate || todayISO(),
    lines,
    status: initial,
    notes: args.notes ?? "",
    createdBy: "Demo User",
    statusHistory: [{ at: nowISO(), status: initial, by: "Demo User", note: "PO created" }],
    receiptIds: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  let next: DBShape = { ...db, purchaseOrders: [po, ...db.purchaseOrders] };
  if (initial === "pending_approval") {
    next = notify(next, {
      kind: "po_approval",
      title: `${poNumber} awaiting approval`,
      body: `New purchase order for ${db.suppliers.find((s) => s.id === args.supplierId)?.name ?? "supplier"} needs approval.`,
      link: `/purchase-orders/${po.id}`,
    });
  }
  saveDB(next);
  return po;
}

const PO_TRANSITIONS: Record<string, PurchaseOrder["status"][]> = {
  draft: ["pending_approval", "approved", "cancelled"],
  pending_approval: ["approved", "draft", "cancelled"],
  approved: ["ordered", "cancelled", "draft"],
  ordered: ["partially_received", "received", "cancelled"],
  partially_received: ["received", "cancelled"],
  received: [],
  cancelled: [],
};

export function updatePurchaseOrderStatus(
  store: StoreApi,
  poId: string,
  status: PurchaseOrder["status"],
  note?: string,
  cancelReason?: string
): void {
  const db = loadDB();
  const po = db.purchaseOrders.find((p) => p.id === poId);
  if (!po) throw new OpsError("Purchase order not found");
  const allowed = PO_TRANSITIONS[po.status] ?? [];
  if (!allowed.includes(status)) {
    throw new OpsError(`Cannot move ${po.status} → ${status}`);
  }
  if (status === "cancelled" && !cancelReason?.trim()) {
    throw new OpsError("A cancellation reason is required");
  }
  const updated: PurchaseOrder = {
    ...po,
    status,
    cancelReason: status === "cancelled" ? cancelReason : po.cancelReason,
    statusHistory: [...po.statusHistory, { at: nowISO(), status, by: "Demo User", note }],
    updatedAt: nowISO(),
  };
  saveDB({ ...db, purchaseOrders: upsert(db.purchaseOrders, updated) });
}

/* ------------------------- goods receiving ------------------------- */

export interface ReceiveLineInput {
  lineId: string;
  receivedQty: number;
  damagedQty: number;
  unitCost?: number;
  batchNo?: string;
  expiryDate?: string;
}

export function receivePurchaseOrder(
  store: StoreApi,
  poId: string,
  lines: ReceiveLineInput[],
  notes?: string
): GoodsReceipt {
  const db = loadDB();
  const po = db.purchaseOrders.find((p) => p.id === poId);
  if (!po) throw new OpsError("Purchase order not found");
  if (!["ordered", "partially_received"].includes(po.status)) {
    throw new OpsError("Goods can only be received against an ordered purchase order");
  }
  if (lines.length === 0) throw new OpsError("Enter received quantities for at least one line");
  const refCheck = (lineId: string) =>
    (po.receiptIds ?? []).some((rid) => {
      const grn = db.receipts.find((r) => r.id === rid);
      return grn?.lines.some((l) => l.lineId === lineId);
    });
  for (const l of lines) {
    if (refCheck(l.lineId)) throw new OpsError("One or more lines were already received on this order");
  }

  let next: DBShape = db;
  const receiptLines: GoodsReceipt["lines"] = [];
  const grnNumber = nextSeq(db.settings.procurement.grnPrefix, db.receipts.map((r) => r.grnNumber));

  for (const l of lines) {
    const poLine = po.lines.find((pl) => pl.id === l.lineId);
    if (!poLine) throw new OpsError("Invalid purchase order line");
    const remaining = poLine.qtyOrdered - poLine.qtyReceived;
    if (l.receivedQty < 0 || l.damagedQty < 0) throw new OpsError("Quantities cannot be negative");
    if (l.receivedQty + l.damagedQty > remaining + 0.0001) {
      const item = db.items.find((i) => i.id === poLine.itemId);
      throw new OpsError(
        `${item?.name ?? "Line"}: received + damaged exceeds remaining quantity (${round3(remaining)})`
      );
    }
    const accepted = round3(l.receivedQty);
    if (accepted <= 0) continue;
    const item = db.items.find((i) => i.id === poLine.itemId);
    if (!item) throw new OpsError("Item missing for PO line");
    // unit cost on PO is per PURCHASE unit → convert to base unit for stock
    const costPerBaseUnit =
      l.unitCost !== undefined
        ? l.unitCost / (item.conversion.purchaseQty || 1)
        : poLine.unitCost / (item.conversion.purchaseQty || 1);

    // convert accepted qty from purchase unit to base unit for stock
    const acceptedBase = convertQty(accepted, item.purchaseUnit, item.baseUnit, item.conversion.purchaseQty);

    receiptLines.push({
      lineId: l.lineId,
      itemId: poLine.itemId,
      orderedQty: poLine.qtyOrdered,
      receivedQty: round3(l.receivedQty),
      damagedQty: round3(l.damagedQty),
      acceptedQty: accepted,
      unitCost: round2(costPerBaseUnit),
      batchNo: l.batchNo ?? "",
      expiryDate: l.expiryDate ?? "",
    });

    const res = applyStock({
      db: next,
      itemId: poLine.itemId,
      outletId: po.outletId,
      qtyDelta: acceptedBase,
      unitCost: costPerBaseUnit,
      type: "purchase_receipt",
      refNo: grnNumber,
      performedBy: "Demo User",
      notes: `Receipt against ${po.poNumber}${l.batchNo ? ` · batch ${l.batchNo}` : ""}`,
      relatedId: poId,
    });
    next = res.db;

    if (l.batchNo && item.trackBatch && acceptedBase > 0) {
      next = {
        ...next,
        batches: [
          {
            id: uid("bat"),
            itemId: poLine.itemId,
            outletId: po.outletId,
            batchNo: l.batchNo,
            qty: acceptedBase,
            expiryDate: l.expiryDate || todayISO(),
            receivedAt: nowISO(),
            costPerUnit: round2(costPerBaseUnit),
          },
          ...next.batches,
        ],
      };
    }
  }

  if (receiptLines.length === 0) throw new OpsError("No accepted quantities to record");

  const receipt: GoodsReceipt = {
    id: uid("grn"),
    grnNumber,
    poId,
    supplierId: po.supplierId,
    outletId: po.outletId,
    receivedAt: nowISO(),
    receivedBy: "Demo User",
    lines: receiptLines,
    notes: notes ?? "",
    createdAt: nowISO(),
  };

  const updatedLines = po.lines.map((pl) => {
    const r = receiptLines.find((x) => x.lineId === pl.id);
    if (!r) return pl;
    return { ...pl, qtyReceived: round3(pl.qtyReceived + r.acceptedQty) };
  });
  const fullyReceived = updatedLines.every((pl) => pl.qtyReceived >= pl.qtyOrdered - 0.0001);
  const anyReceived = updatedLines.some((pl) => pl.qtyReceived > 0);
  const newStatus: PurchaseOrder["status"] = fullyReceived ? "received" : anyReceived ? "partially_received" : po.status;

  const updatedPO: PurchaseOrder = {
    ...po,
    lines: updatedLines,
    status: newStatus,
    receiptIds: [receipt.id, ...(po.receiptIds ?? [])],
    statusHistory: [
      ...po.statusHistory,
      { at: nowISO(), status: newStatus, by: "Demo User", note: `${receipt.grnNumber} recorded` },
    ],
    updatedAt: nowISO(),
  };

  next = {
    ...next,
    receipts: [receipt, ...next.receipts],
    purchaseOrders: upsert(next.purchaseOrders, updatedPO),
  };
  saveDB(next);
  return receipt;
}

/* ------------------------- stock counts ------------------------- */

export function finalizeStockCount(store: StoreApi, countId: string): void {
  const db = loadDB();
  const count = db.counts.find((c) => c.id === countId);
  if (!count) throw new OpsError("Stock count not found");
  if (count.status === "finalized") throw new OpsError("This count is already finalized and locked");
  const missing = count.lines.filter((l) => l.counted === null);
  if (missing.length > 0) throw new OpsError("Enter counted quantities for all lines before finalizing");

  let next: DBShape = db;
  const refNo = count.countNumber;
  for (const line of count.lines) {
    const variance = round3((line.counted ?? 0) - line.expected);
    if (Math.abs(variance) < 0.0001) continue;
    const res = applyStock({
      db: next,
      itemId: line.itemId,
      outletId: count.outletId,
      qtyDelta: variance,
      type: "adjustment",
      refNo,
      performedBy: "Demo User",
      notes: `Stock count adjustment${line.note ? ` — ${line.note}` : ""}`,
      relatedId: count.id,
      allowNegative: false,
    });
    next = res.db;
  }

  const finalized = {
    ...count,
    status: "finalized" as const,
    finalizedAt: nowISO(),
    finalizedBy: "Demo User",
    lines: count.lines.map((l) => ({ ...l, variance: round3((l.counted ?? 0) - l.expected) })),
  };
  next = { ...next, counts: upsert(next.counts, finalized) };
  saveDB(next);
}

/* ------------------------- transfers ------------------------- */

export function createStockTransfer(
  store: StoreApi,
  args: {
    fromLocationId: string;
    toLocationId: string;
    lines: { itemId: string; qty: number }[];
    notes?: string;
    status?: StockTransfer["status"];
  }
): StockTransfer {
  const db = loadDB();
  const fromLoc = db.storageLocations.find((l) => l.id === args.fromLocationId);
  const toLoc = db.storageLocations.find((l) => l.id === args.toLocationId);
  if (!fromLoc || !toLoc) throw new OpsError("Select source and destination locations");
  if (fromLoc.id === toLoc.id) throw new OpsError("Source and destination must be different");
  if (args.lines.length === 0) throw new OpsError("Add at least one item");
  for (const l of args.lines) {
    if (!(l.qty > 0)) throw new OpsError("Quantities must be greater than zero");
    const item = db.items.find((i) => i.id === l.itemId);
    if (!item) throw new OpsError("Invalid item");
    const available = getBalanceQty(db, l.itemId, fromLoc.outletId);
    if (l.qty > available + 0.0001) {
      throw new OpsError(`${item.name}: only ${available} ${item.baseUnit} available at source`);
    }
  }
  const transferNumber = nextSeq("TRF", db.transfers.map((t) => t.transferNumber));
  const transfer: StockTransfer = {
    id: uid("trf"),
    transferNumber,
    fromLocationId: fromLoc.id,
    toLocationId: toLoc.id,
    fromOutletId: fromLoc.outletId,
    toOutletId: toLoc.outletId,
    lines: args.lines.map((l) => ({ itemId: l.itemId, qty: round3(l.qty) })),
    status: args.status ?? "pending",
    createdAt: nowISO(),
    createdBy: "Demo User",
    notes: args.notes ?? "",
  };
  let next: DBShape = { ...db, transfers: [transfer, ...db.transfers] };
  if (transfer.status === "pending") {
    next = notify(next, {
      kind: "transfer_pending",
      title: `${transferNumber} awaiting approval`,
      body: `Stock transfer request from ${db.storageLocations.find((l) => l.id === fromLoc.id)?.name}.`,
      link: "/transfers",
    });
  }
  saveDB(next);
  return transfer;
}

/** Deducts stock at source and records the movement. Called at the dispatch stage. */
export function dispatchStockTransfer(store: StoreApi, transferId: string): void {
  const db = loadDB();
  const tr = db.transfers.find((t) => t.id === transferId);
  if (!tr) throw new OpsError("Transfer not found");
  if (!["approved", "pending"].includes(tr.status)) {
    throw new OpsError("Transfer must be approved before dispatch");
  }
  let next: DBShape = db;
  for (const line of tr.lines) {
    const item = db.items.find((i) => i.id === line.itemId);
    if (!item) throw new OpsError("Invalid item on transfer");
    const available = getBalanceQty(next, line.itemId, tr.fromOutletId);
    if (line.qty > available + 0.0001) {
      throw new OpsError(`${item.name}: only ${available} ${item.baseUnit} left at source`);
    }
    const cost = getBalanceCost(next, line.itemId, tr.fromOutletId);
    const res = applyStock({
      db: next,
      itemId: line.itemId,
      outletId: tr.fromOutletId,
      qtyDelta: -line.qty,
      unitCost: cost,
      type: "transfer_out",
      refNo: tr.transferNumber,
      performedBy: "Demo User",
      notes: `Dispatched to ${db.outlets.find((o) => o.id === tr.toOutletId)?.name ?? "destination"}`,
      relatedId: tr.id,
    });
    next = res.db;
  }
  next = {
    ...next,
    transfers: upsert(next.transfers, { ...tr, status: "dispatched", dispatchedAt: nowISO() }),
  };
  saveDB(next);
}

/** Adds stock at destination (received - damaged). Stock is NEVER duplicated: dispatch already deducted. */
export function receiveStockTransfer(
  store: StoreApi,
  transferId: string,
  received: { itemId: string; receivedQty: number; damagedQty: number }[]
): void {
  const db = loadDB();
  const tr = db.transfers.find((t) => t.id === transferId);
  if (!tr) throw new OpsError("Transfer not found");
  if (tr.status !== "dispatched") throw new OpsError("Transfer must be dispatched before it can be received");
  let next: DBShape = db;
  for (const line of tr.lines) {
    const r = received.find((x) => x.itemId === line.itemId);
    if (!r) throw new OpsError("Enter received quantities for all lines");
    if (r.receivedQty < 0 || r.damagedQty < 0) throw new OpsError("Quantities cannot be negative");
    if (r.receivedQty + r.damagedQty > line.qty + 0.0001) {
      throw new OpsError("Received + damaged cannot exceed dispatched quantity");
    }
    const item = db.items.find((i) => i.id === line.itemId);
    if (!item) throw new OpsError("Invalid item");
    if (r.receivedQty > 0) {
      const res = applyStock({
        db: next,
        itemId: line.itemId,
        outletId: tr.toOutletId,
        qtyDelta: r.receivedQty,
        unitCost: item.avgCost,
        type: "transfer_in",
        refNo: tr.transferNumber,
        performedBy: "Demo User",
        notes: `Received from ${db.outlets.find((o) => o.id === tr.fromOutletId)?.name ?? "source"}${r.damagedQty > 0 ? ` (${r.damagedQty} damaged)` : ""}`,
        relatedId: tr.id,
      });
      next = res.db;
    }
  }
  next = {
    ...next,
    transfers: upsert(next.transfers, {
      ...tr,
      status: "received",
      receivedAt: nowISO(),
      lines: tr.lines.map((l) => {
        const r = received.find((x) => x.itemId === l.itemId);
        return r ? { ...l, receivedQty: r.receivedQty, damagedQty: r.damagedQty } : l;
      }),
    }),
  };
  saveDB(next);
}

/* ------------------------- invoices ------------------------- */

export function recordInvoicePayment(
  store: StoreApi,
  invoiceId: string,
  amount: number,
  mode: string,
  notes?: string
): SupplierInvoice {
  const db = loadDB();
  const inv = db.invoices.find((i) => i.id === invoiceId);
  if (!inv) throw new OpsError("Invoice not found");
  if (!(amount > 0)) throw new OpsError("Payment amount must be greater than zero");
  if (amount > inv.total - inv.paid + 0.01) throw new OpsError("Payment exceeds outstanding balance");
  const paid = round2(inv.paid + amount);
  const status = paid >= inv.total - 0.01 ? "paid" : "partially_paid";
  const updated: SupplierInvoice = {
    ...inv,
    paid,
    status,
    payments: [...inv.payments, { id: uid("pay"), at: nowISO(), amount: round2(amount), mode, notes: notes ?? "" }],
  };
  saveDB({ ...db, invoices: upsert(db.invoices, updated) });
  return updated;
}

/* ------------------------- recipe costing helpers ------------------------- */

export function recipeCost(recipe: Recipe, db: DBShape) {
  return calculateRecipeCost(recipe, db.items, db.balances);
}

export function reorderSuggestions(db: DBShape) {
  return generateReorderSuggestions(db.items, db.balances, db.movements, db.suppliers);
}

export { getStockStatus, computeLineTotals, computePOGrandTotals, convertQty, round2, round3 };
export type { Unit };
