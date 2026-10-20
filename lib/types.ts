// StockPilot domain models
export const UNITS = [
  "kg",
  "g",
  "litre",
  "ml",
  "pieces",
  "bottle",
  "can",
  "pack",
  "carton",
  "bag",
  "box",
  "dozen",
] as const;
export type Unit = (typeof UNITS)[number];

export const UNIT_LABELS: Record<Unit, string> = {
  kg: "kg",
  g: "g",
  litre: "litre",
  ml: "ml",
  pieces: "pieces",
  bottle: "bottle",
  can: "can",
  pack: "pack",
  carton: "carton",
  bag: "bag",
  box: "box",
  dozen: "dozen",
};

export const UNIT_ALIASES: Record<string, Unit> = {
  kg: "kg",
  kgs: "kg",
  kilogram: "kg",
  kilogramme: "kg",
  g: "g",
  gram: "g",
  grams: "g",
  l: "litre",
  lt: "litre",
  litre: "litre",
  liters: "litre",
  liter: "litre",
  ml: "ml",
  millilitre: "ml",
  milliliter: "ml",
  pcs: "pieces",
  pc: "pieces",
  piece: "pieces",
  pieces: "pieces",
  nos: "pieces",
  nosP: "pieces",
  bottle: "bottle",
  bottles: "bottle",
  btl: "bottle",
  can: "can",
  cans: "can",
  pack: "pack",
  packs: "pack",
  pkt: "pack",
  carton: "carton",
  cartons: "carton",
  ctn: "carton",
  bag: "bag",
  bags: "bag",
  box: "box",
  boxes: "box",
  dozen: "dozen",
  doz: "dozen",
};

/** Dimensional groups: units convertible to each other. */
const DENSITY_MAPPINGS: Record<Unit, Unit | null> = {
  kg: "g",
  g: "g",
  litre: "ml",
  ml: "ml",
  pieces: null,
  bottle: null,
  can: null,
  pack: null,
  carton: null,
  bag: null,
  box: null,
  dozen: "pieces",
};

/** How many grams in a kilogram, ml in a litre, pieces in a dozen. */
const MASS_FACTORS: Record<string, number> = {
  "kg>g": 1000,
  "g>kg": 0.001,
  "litre>ml": 1000,
  "ml>litre": 0.001,
  "dozen>pieces": 12,
  "pieces>dozen": 1 / 12,
};

/**
 * Convert a quantity between the item's purchase unit and its stock (base) unit.
 * Uses the item's conversion factor for packaging (carton -> bottle etc.) and
 * handles decimal scales (kg <-> g, litre <-> ml, dozen <-> pieces).
 */
export function convertQty(
  qty: number,
  from: Unit,
  to: Unit,
  factor = 1
): number {
  if (from === to) return qty;
  const key = `${from}>${to}`;
  if (MASS_FACTORS[key]) return qty * MASS_FACTORS[key];
  if (from === "dozen" && to === "pieces") return qty * (factor || 12);
  if (to === "dozen" && from === "pieces") return qty / (factor || 12);
  // Packaging conversion: e.g. purchase "carton" of 12 -> stock "bottle"
  const f = factor > 0 ? factor : 1;
  if (to === DENSITY_MAPPINGS[from]) return qty * f;
  if (from === DENSITY_MAPPINGS[to]) return qty / f;
  return qty * f;
}

export type MovementType =
  | "purchase_receipt"
  | "manual_stock_in"
  | "stock_out"
  | "recipe_consumption"
  | "waste"
  | "transfer_in"
  | "transfer_out"
  | "adjustment"
  | "return_to_supplier";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  purchase_receipt: "Purchase Receipt",
  manual_stock_in: "Manual Stock In",
  stock_out: "Stock Out",
  recipe_consumption: "Recipe Consumption",
  waste: "Waste / Spoilage",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  adjustment: "Stock Adjustment",
  return_to_supplier: "Return to Supplier",
};

export const WASTE_REASONS = [
  "Expired",
  "Spoiled",
  "Preparation Waste",
  "Overproduction",
  "Spillage",
  "Damaged Packaging",
  "Staff Consumption",
  "Other",
] as const;
export type WasteReason = (typeof WASTE_REASONS)[number];

export const PO_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
] as const;
export type PoStatus = (typeof PO_STATUSES)[number];

export const TRANSFER_STATUSES = [
  "draft",
  "pending",
  "approved",
  "dispatched",
  "received",
  "cancelled",
] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const INVOICE_STATUSES = ["unpaid", "partially_paid", "paid", "overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const COSTING_METHODS = ["weighted_average", "fifo"] as const;
export type CostingMethod = (typeof COSTING_METHODS)[number];

export const ROLES = [
  "Owner",
  "Admin",
  "Inventory Manager",
  "Purchasing Manager",
  "Outlet Manager",
  "Staff / Viewer",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Owner: ["*"],
  Admin: ["*"],
  "Inventory Manager": [
    "inventory.view", "inventory.edit", "movements.view", "movements.create",
    "counts.view", "counts.create", "waste.view", "waste.create",
    "recipes.view", "recipes.edit", "transfers.view", "transfers.create",
    "reports.view",
  ],
  "Purchasing Manager": [
    "inventory.view", "suppliers.view", "suppliers.edit",
    "po.view", "po.create", "po.approve", "receiving.view", "receiving.create",
    "invoices.view", "invoices.edit", "forecast.view", "reports.view",
  ],
  "Outlet Manager": [
    "inventory.view", "movements.view", "counts.view", "counts.create",
    "waste.view", "waste.create", "transfers.view", "recipes.view", "menu.view",
  ],
  "Staff / Viewer": ["inventory.view", "movements.view", "recipes.view", "menu.view"],
};

export interface Outlet {
  id: string;
  name: string;
  code: string;
  type: "outlet" | "warehouse";
  address: string;
  phone: string;
  manager: string;
  active: boolean;
}

export interface StorageLocation {
  id: string;
  outletId: string;
  name: string;
  zone: "Dry Storage" | "Cold Storage" | "Freezer" | "Bar Storage" | "Packaging" | "Cleaning";
}

export interface Category {
  id: string;
  name: string;
  code: string;
  subcategories: string[];
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  paymentTerms: string;
  leadTimeDays: number;
  categories: string[];
  minOrderValue: number;
  notes: string;
  active: boolean;
  onTimePct: number;
  avgDeliveryDays: number;
}

export interface UnitConversion {
  purchaseUnit: Unit;
  purchaseQty: number;
  baseUnit: Unit;
  /** Unit in which recipe ingredients are entered (defaults to baseUnit). */
  recipeUnit?: Unit;
  /**
   * Recipe quantity needed to consume ONE base unit (defaults to 1).
   * e.g. soda: 1 bottle = 200 ml recipe用量; cheese pack = 10 slices.
   */
  recipeQtyPerBase?: number;
}

export type InventoryType = "food" | "beverage" | "alcohol" | "packaging" | "supply";
export type ItemStatus = "active" | "archived";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryId: string;
  subcategory: string;
  type: InventoryType;
  baseUnit: Unit;
  purchaseUnit: Unit;
  recipeUnit: Unit;
  conversion: UnitConversion;
  minStock: number;
  reorderQty: number;
  preferredSupplierId: string;
  purchasePrice: number;
  avgCost: number;
  taxPct: number;
  storageLocationId: string;
  outletIds: string[];
  perishable: boolean;
  shelfLifeDays: number;
  trackBatch: boolean;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBalance {
  id: string;
  itemId: string;
  outletId: string;
  qty: number;
  avgCost: number;
  updatedAt: string;
}

export interface StockBatch {
  id: string;
  itemId: string;
  outletId: string;
  batchNo: string;
  qty: number;
  expiryDate: string;
  receivedAt: string;
  costPerUnit: number;
}

export interface StockMovement {
  id: string;
  at: string;
  refNo: string;
  type: MovementType;
  itemId: string;
  outletId: string;
  qtyIn: number;
  qtyOut: number;
  unitCost: number;
  balanceAfter: number;
  performedBy: string;
  notes: string;
  relatedId?: string;
}

export type PoLineStatus = "pending" | "received" | "cancelled";

export interface PurchaseOrderLine {
  id: string;
  itemId: string;
  qtyOrdered: number;
  unitCost: number;
  qtyReceived: number;
  discountPct: number;
  taxPct: number;
  status: PoLineStatus;
}

export type PoStatusEvent = { at: string; status: PoStatus; by: string; note?: string };

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  outletId: string;
  orderDate: string;
  expectedDate: string;
  lines: PurchaseOrderLine[];
  status: PoStatus;
  notes: string;
  createdBy: string;
  statusHistory: PoStatusEvent[];
  receiptIds: string[];
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptLine {
  lineId: string;
  itemId: string;
  orderedQty: number;
  receivedQty: number;
  damagedQty: number;
  acceptedQty: number;
  unitCost: number;
  batchNo: string;
  expiryDate: string;
}

export interface GoodsReceipt {
  id: string;
  grnNumber: string;
  poId: string;
  supplierId: string;
  outletId: string;
  receivedAt: string;
  receivedBy: string;
  lines: GoodsReceiptLine[];
  notes: string;
  createdAt: string;
}

export interface StockCountLine {
  itemId: string;
  expected: number;
  counted: number | null;
  variance: number;
  note: string;
}

export interface StockCount {
  id: string;
  countNumber: string;
  outletId: string;
  categoryIds: string[];
  status: "draft" | "finalized";
  createdAt: string;
  createdBy: string;
  finalizedAt?: string;
  finalizedBy?: string;
  lines: StockCountLine[];
}

export interface WasteRecord {
  id: string;
  itemId: string;
  outletId: string;
  qty: number;
  unitCost: number;
  cost: number;
  reason: WasteReason;
  at: string;
  notes: string;
  recordedBy: string;
  batchNo?: string;
}

export interface TransferLine {
  itemId: string;
  qty: number;
  receivedQty?: number;
  damagedQty?: number;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromLocationId: string;
  toLocationId: string;
  fromOutletId: string;
  toOutletId: string;
  lines: TransferLine[];
  status: TransferStatus;
  createdAt: string;
  createdBy: string;
  dispatchedAt?: string;
  receivedAt?: string;
  notes: string;
  cancelReason?: string;
}

export interface RecipeIngredient {
  itemId: string;
  qty: number;
}

export interface Recipe {
  id: string;
  name: string;
  menuItemId?: string;
  ingredients: RecipeIngredient[];
  yieldQty: number;
  yieldUnit: string;
  portionSize: string;
  notes: string;
  sellingPrice: number;
  targetFoodCostPct: number;
  active: boolean;
}

export type MenuItemCategory =
  | "Starters"
  | "Main Course"
  | "Pizza & Pasta"
  | "Burgers & Sandwiches"
  | "Desserts"
  | "Coffee"
  | "Tea"
  | "Mocktails"
  | "Cocktails"
  | "Soft Drinks";

export const MENU_CATEGORIES: MenuItemCategory[] = [
  "Starters",
  "Main Course",
  "Pizza & Pasta",
  "Burgers & Sandwiches",
  "Desserts",
  "Coffee",
  "Tea",
  "Mocktails",
  "Cocktails",
  "Soft Drinks",
];

export interface MenuItem {
  id: string;
  name: string;
  sku: string;
  category: MenuItemCategory;
  sellingPrice: number;
  recipeId?: string;
  available: boolean;
  active: boolean;
}

export interface InvoicePayment {
  id: string;
  at: string;
  amount: number;
  mode: string;
  notes: string;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  poId?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  status: InvoiceStatus;
  notes: string;
  payments: InvoicePayment[];
}

export interface NotificationRec {
  id: string;
  kind:
    | "low_stock"
    | "out_of_stock"
    | "expiring"
    | "po_approval"
    | "invoice_overdue"
    | "transfer_pending";
  title: string;
  body: string;
  link: string;
  at: string;
  read: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  outletIds: string[];
  status: "active" | "invited" | "inactive";
  lastActive: string;
}

export interface BusinessProfile {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  currency: string;
  timezone: string;
}

export interface InventorySettings {
  defaultMinStock: number;
  costingMethod: CostingMethod;
  expiryAlertDays: number;
  lowStockNotifications: boolean;
  defaultBaseUnit: Unit;
}

export interface ProcurementSettings {
  requireApproval: boolean;
  defaultLeadTimeDays: number;
  poPrefix: string;
  poNextNumber: number;
  grnPrefix: string;
  grnNextNumber: number;
}

export interface NotificationSettings {
  lowStock: boolean;
  expiringStock: boolean;
  purchaseApprovals: boolean;
  pendingReceipts: boolean;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
}

export interface AppSettings {
  profile: BusinessProfile;
  inventory: InventorySettings;
  procurement: ProcurementSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}

export interface DBShape {
  v: number;
  seededAt: string;
  updatedAt: string;
  outlets: Outlet[];
  storageLocations: StorageLocation[];
  categories: Category[];
  suppliers: Supplier[];
  items: InventoryItem[];
  balances: InventoryBalance[];
  batches: StockBatch[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  counts: StockCount[];
  waste: WasteRecord[];
  transfers: StockTransfer[];
  recipes: Recipe[];
  menuItems: MenuItem[];
  invoices: SupplierInvoice[];
  notifications: NotificationRec[];
  team: TeamMember[];
  settings: AppSettings;
}
