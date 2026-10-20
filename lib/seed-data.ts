import { addDays, formatISO } from "date-fns";
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
  Unit,
  WasteRecord,
} from "./types";

const now = new Date();
const iso = (d: Date) => d.toISOString();
const dAgo = (n: number) => iso(addDays(now, -n));
const dAhead = (n: number) => iso(addDays(now, n));
const day = (n: number) => formatISO(addDays(now, -n)).slice(0, 10);
const dayAhead = (n: number) => formatISO(addDays(now, n)).slice(0, 10);

const OUTLET_IDS = {
  cafe: "out_cafe",
  resto: "out_resto",
  bar: "out_bar",
  wh: "out_wh",
} as const;

const CAT_IDS = {
  veg: "cat_veg",
  dairy: "cat_dairy",
  meat: "cat_meat",
  seafood: "cat_seafood",
  dry: "cat_dry",
  bakery: "cat_bakery",
  coffee: "cat_coffee",
  soft: "cat_soft",
  alcohol: "cat_alcohol",
  frozen: "cat_frozen",
  packaging: "cat_packaging",
  cleaning: "cat_cleaning",
  general: "cat_general",
} as const;

const outlets: Outlet[] = [
  {
    id: OUTLET_IDS.cafe,
    name: "Downtown Cafe",
    code: "DTC",
    type: "outlet",
    address: "14 MG Road, Bengaluru, KA 560001",
    phone: "+91 98450 11223",
    manager: "Ananya Rao",
    active: true,
  },
  {
    id: OUTLET_IDS.resto,
    name: "Riverside Restaurant",
    code: "RSR",
    type: "outlet",
    address: "3 Riverside Drive, Bengaluru, KA 560038",
    phone: "+91 98450 44556",
    manager: "Vikram Shah",
    active: true,
  },
  {
    id: OUTLET_IDS.bar,
    name: "The Oak Bar",
    code: "OAK",
    type: "outlet",
    address: "22 Oak Street, Bengaluru, KA 560001",
    phone: "+91 99001 77889",
    manager: "Meera Kapoor",
    active: true,
  },
  {
    id: OUTLET_IDS.wh,
    name: "Central Warehouse",
    code: "WH1",
    type: "warehouse",
    address: "Plot 7, Industrial Layout, Bengaluru, KA 560103",
    phone: "+91 80888 12121",
    manager: "Rahul Menon",
    active: true,
  },
];

const locations: StorageLocation[] = [
  { id: "loc_wh_dry", outletId: OUTLET_IDS.wh, name: "Dry Store", zone: "Dry Storage" },
  { id: "loc_wh_cold", outletId: OUTLET_IDS.wh, name: "Cold Room", zone: "Cold Storage" },
  { id: "loc_wh_freezer", outletId: OUTLET_IDS.wh, name: "Freezer Room", zone: "Freezer" },
  { id: "loc_wh_bar", outletId: OUTLET_IDS.wh, name: "Bar Cage", zone: "Bar Storage" },
  { id: "loc_wh_pack", outletId: OUTLET_IDS.wh, name: "Packaging Bay", zone: "Packaging" },
  { id: "loc_wh_clean", outletId: OUTLET_IDS.wh, name: "Cleaning Store", zone: "Cleaning" },
  { id: "loc_cafe_dry", outletId: OUTLET_IDS.cafe, name: "Cafe Dry Shelf", zone: "Dry Storage" },
  { id: "loc_cafe_cold", outletId: OUTLET_IDS.cafe, name: "Cafe Fridge", zone: "Cold Storage" },
  { id: "loc_cafe_bar", outletId: OUTLET_IDS.cafe, name: "Cafe Coffee Counter", zone: "Bar Storage" },
  { id: "loc_resto_dry", outletId: OUTLET_IDS.resto, name: "Kitchen Dry Store", zone: "Dry Storage" },
  { id: "loc_resto_cold", outletId: OUTLET_IDS.resto, name: "Walk-in Fridge", zone: "Cold Storage" },
  { id: "loc_resto_freezer", outletId: OUTLET_IDS.resto, name: "Walk-in Freezer", zone: "Freezer" },
  { id: "loc_bar_bar", outletId: OUTLET_IDS.bar, name: "Back Bar", zone: "Bar Storage" },
  { id: "loc_bar_cold", outletId: OUTLET_IDS.bar, name: "Bar Fridge", zone: "Cold Storage" },
];

const categories: Category[] = [
  { id: CAT_IDS.veg, name: "Vegetables & Fruits", code: "VEG", subcategories: ["Vegetables", "Fruits", "Herbs"] },
  { id: CAT_IDS.dairy, name: "Dairy & Eggs", code: "DRY", subcategories: ["Milk", "Cheese", "Butter", "Eggs"] },
  { id: CAT_IDS.meat, name: "Meat & Poultry", code: "MTP", subcategories: ["Chicken", "Mutton", "Processed Meat"] },
  { id: CAT_IDS.seafood, name: "Seafood", code: "SEA", subcategories: ["Fish", "Prawns"] },
  { id: CAT_IDS.dry, name: "Dry Goods & Grains", code: "DRG", subcategories: ["Flour", "Rice & Pasta", "Oil", "Spices", "Sugar"] },
  { id: CAT_IDS.bakery, name: "Bakery", code: "BKY", subcategories: ["Bread", "Buns", "Desserts"] },
  { id: CAT_IDS.coffee, name: "Coffee & Tea", code: "CFT", subcategories: ["Coffee Beans", "Tea Leaves", "Powders"] },
  { id: CAT_IDS.soft, name: "Soft Drinks", code: "SFD", subcategories: ["Soda", "Juices", "Water"] },
  { id: CAT_IDS.alcohol, name: "Alcohol & Bar Supplies", code: "ALC", subcategories: ["Spirits", "Beer", "Mixers", "Syrups"] },
  { id: CAT_IDS.frozen, name: "Frozen Foods", code: "FZD", subcategories: ["Fries", "Frozen Snacks"] },
  { id: CAT_IDS.packaging, name: "Packaging", code: "PKG", subcategories: ["Cups", "Containers", "Cutlery"] },
  { id: CAT_IDS.cleaning, name: "Cleaning & Hygiene", code: "CLN", subcategories: ["Detergents", "Sanitisers"] },
  { id: CAT_IDS.general, name: "General Supplies", code: "GEN", subcategories: ["Misc"] },
];

const suppliers: Supplier[] = [
  { id: "sup_fresh", name: "FreshCart Produce", code: "SUP-001", contactPerson: "Suresh Iyer", phone: "+91 98800 10101", email: "orders@freshcart.in", address: "APMC Yard, Yeshwanthpur, Bengaluru", gstin: "29AABCS1429B1Z6", paymentTerms: "Net 15", leadTimeDays: 1, categories: ["Vegetables & Fruits", "Herbs"], minOrderValue: 1500, notes: "Daily 5 AM delivery. Sunday closed.", active: true, onTimePct: 96, avgDeliveryDays: 1 },
  { id: "sup_dairy", name: "Nandini Dairy Depot", code: "SUP-002", contactPerson: "Lakshmi N", phone: "+91 98450 20202", email: "depot.blr@nandini.example", address: "KMF Complex, Dr Rajkumar Road, Bengaluru", gstin: "29AAACK9876C1Z2", paymentTerms: "Net 7", leadTimeDays: 1, categories: ["Dairy & Eggs"], minOrderValue: 2000, notes: "Cold chain vehicle only.", active: true, onTimePct: 98, avgDeliveryDays: 1 },
  { id: "sup_meat", name: "Highland Poultry & Meat", code: "SUP-003", contactPerson: "Imran Qureshi", phone: "+91 90080 30303", email: "sales@highlandmeat.in", address: "Shivajinagar Meat Market, Bengaluru", gstin: "29AAFFH1122D1ZQ", paymentTerms: "Net 15", leadTimeDays: 2, categories: ["Meat & Poultry"], minOrderValue: 3000, notes: "Halal certified. FSSAI 10018042001.", active: true, onTimePct: 92, avgDeliveryDays: 2 },
  { id: "sup_sea", name: "Coastal Catch Seafoods", code: "SUP-004", contactPerson: "Deepa Shetty", phone: "+91 99450 40404", email: "orders@coastalcatch.in", address: "Malpe Port Road, Udupi", gstin: "29AABCC5566E1Z4", paymentTerms: "Net 7", leadTimeDays: 2, categories: ["Seafood"], minOrderValue: 4000, notes: "Flash-frozen on boat. Insist on ice slurry.", active: true, onTimePct: 88, avgDeliveryDays: 2 },
  { id: "sup_dry", name: "Sigma Wholesale Traders", code: "SUP-005", contactPerson: "Ganesh Patil", phone: "+91 97400 50505", email: "bulk@sigmawholesale.in", address: "Kempegowda Market, Bengaluru", gstin: "29AACCS7788F1Z9", paymentTerms: "Net 30", leadTimeDays: 3, categories: ["Dry Goods & Grains", "Spices"], minOrderValue: 5000, notes: "Free delivery above ₹10,000.", active: true, onTimePct: 94, avgDeliveryDays: 3 },
  { id: "sup_bakery", name: "Golden Crumb Bakery", code: "SUP-006", contactPerson: "Nisha Verma", phone: "+91 97300 60606", email: "hello@goldencrumb.in", address: "Indiranagar 100ft Road, Bengaluru", gstin: "29AAJCG9900G1Z3", paymentTerms: "Net 7", leadTimeDays: 1, categories: ["Bakery"], minOrderValue: 1000, notes: "Fresh batch every morning 6 AM.", active: true, onTimePct: 97, avgDeliveryDays: 1 },
  { id: "sup_bev", name: "BlueWave Beverages", code: "SUP-007", contactPerson: "Arjun Rao", phone: "+91 98860 70707", email: "keyaccounts@bluewave.in", address: "Peenya Industrial Area, Bengaluru", gstin: "29AADCB1212H1Z5", paymentTerms: "Net 30", leadTimeDays: 2, categories: ["Soft Drinks", "Coffee & Tea"], minOrderValue: 3000, notes: "Returnable crates; ₹30 deposit per crate.", active: true, onTimePct: 95, avgDeliveryDays: 2 },
  { id: "sup_liquor", name: "Heritage Spirits Distributors", code: "SUP-008", contactPerson: "Frank D'Souza", phone: "+91 98452 80808", email: "orders@heritagespirits.in", address: "Liquor Depot, Hoskote, Bengaluru", gstin: "29AADCH3344J1Z7", paymentTerms: "Advance", leadTimeDays: 4, categories: ["Alcohol & Bar Supplies"], minOrderValue: 8000, notes: "Liquor licence copy required with every PO.", active: true, onTimePct: 90, avgDeliveryDays: 4 },
  { id: "sup_pack", name: "EcoServe Packaging", code: "SUP-009", contactPerson: "Pooja Gupta", phone: "+91 99720 90909", email: "sales@ecoservepack.in", address: "Jigani Industrial Area, Bengaluru", gstin: "29AAHCE5566K1Z1", paymentTerms: "Net 30", leadTimeDays: 3, categories: ["Packaging"], minOrderValue: 4000, notes: "Compostable cups; MOQ 1000 pcs.", active: true, onTimePct: 93, avgDeliveryDays: 3 },
  { id: "sup_clean", name: "HygienePro Supplies", code: "SUP-010", contactPerson: "Ravi Kumar", phone: "+91 96320 10109", email: "support@hygienepro.in", address: "Rajajinagar Industrial Estate, Bengaluru", gstin: "29AACCH7788L1Z8", paymentTerms: "Net 15", leadTimeDays: 3, categories: ["Cleaning & Hygiene"], minOrderValue: 2000, notes: "Monthly deep-clean chemical kit available.", active: true, onTimePct: 91, avgDeliveryDays: 3 },
];

type ItemSeed = {
  id: string; name: string; sku: string; cat: string; sub: string; type: InventoryItem["type"];
  baseUnit: Unit; purchaseUnit: Unit; factor: number; purchasePrice: number; minStock: number; reorderQty: number;
  supplier: string; outlets: string[]; loc: string; perishable: boolean; shelf: number; trackBatch: boolean;
  barcode?: string; desc?: string; taxPct?: number; recipeUnit?: Unit; recipeQtyPerBase?: number;
};

const itemSeeds: ItemSeed[] = [
  { id: "itm_onion", name: "Onion (Red)", sku: "VEG-001", barcode: "8901234000011", cat: CAT_IDS.veg, sub: "Vegetables", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 32, minStock: 20, reorderQty: 50, supplier: "sup_fresh", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_dry", perishable: true, shelf: 21, trackBatch: true, desc: "Nashik red onion, medium grade" },
  { id: "itm_tomato", name: "Tomato", sku: "VEG-002", barcode: "8901234000028", cat: CAT_IDS.veg, sub: "Vegetables", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 28, minStock: 15, reorderQty: 40, supplier: "sup_fresh", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_dry", perishable: true, shelf: 7, trackBatch: true },
  { id: "itm_potato", name: "Potato", sku: "VEG-003", barcode: "8901234000035", cat: CAT_IDS.veg, sub: "Vegetables", type: "food", baseUnit: "kg", purchaseUnit: "bag", factor: 25, purchasePrice: 650, minStock: 25, reorderQty: 4, supplier: "sup_fresh", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.bar], loc: "loc_wh_dry", perishable: true, shelf: 30, trackBatch: false, desc: "25 kg sack, potato grade A" },
  { id: "itm_capsicum", name: "Green Capsicum", sku: "VEG-004", cat: CAT_IDS.veg, sub: "Vegetables", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 48, minStock: 8, reorderQty: 15, supplier: "sup_fresh", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 10, trackBatch: true },
  { id: "itm_lettuce", name: "Iceberg Lettuce", sku: "VEG-005", cat: CAT_IDS.veg, sub: "Vegetables", type: "food", baseUnit: "kg", purchaseUnit: "pieces", factor: 1, purchasePrice: 45, minStock: 6, reorderQty: 12, supplier: "sup_fresh", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_cold", perishable: true, shelf: 5, trackBatch: true },
  { id: "itm_lemon", name: "Lemon", sku: "VEG-006", cat: CAT_IDS.veg, sub: "Fruits", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 38, minStock: 10, reorderQty: 20, supplier: "sup_fresh", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar, OUTLET_IDS.cafe], loc: "loc_wh_cold", perishable: true, shelf: 12, trackBatch: true },
  { id: "itm_coriander", name: "Coriander Leaves", sku: "VEG-007", cat: CAT_IDS.veg, sub: "Herbs", type: "food", baseUnit: "kg", purchaseUnit: "pack", factor: 0.25, purchasePrice: 30, minStock: 2, reorderQty: 8, supplier: "sup_fresh", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_cold", perishable: true, shelf: 3, trackBatch: false },
  { id: "itm_milk", name: "Full Cream Milk", sku: "DRY-001", barcode: "8901030100019", cat: CAT_IDS.dairy, sub: "Milk", type: "food", baseUnit: "litre", purchaseUnit: "pack", factor: 1, purchasePrice: 68, minStock: 40, reorderQty: 100, supplier: "sup_dairy", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe, OUTLET_IDS.resto, OUTLET_IDS.bar], loc: "loc_wh_cold", perishable: true, shelf: 5, trackBatch: true, recipeUnit: "ml" },
  { id: "itm_butter", name: "Salted Butter", sku: "DRY-002", cat: CAT_IDS.dairy, sub: "Butter", type: "food", baseUnit: "kg", purchaseUnit: "pack", factor: 0.5, purchasePrice: 285, minStock: 8, reorderQty: 20, supplier: "sup_dairy", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe, OUTLET_IDS.resto], loc: "loc_wh_cold", perishable: true, shelf: 60, trackBatch: true },
  { id: "itm_cheese_mo", name: "Mozzarella Cheese", sku: "DRY-003", cat: CAT_IDS.dairy, sub: "Cheese", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 480, minStock: 10, reorderQty: 15, supplier: "sup_dairy", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_cold", perishable: true, shelf: 45, trackBatch: true },
  { id: "itm_cheese_proc", name: "Processed Cheese Slices", sku: "DRY-004", cat: CAT_IDS.dairy, sub: "Cheese", type: "food", baseUnit: "pack", purchaseUnit: "pack", factor: 1, purchasePrice: 220, minStock: 6, reorderQty: 12, supplier: "sup_dairy", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe], loc: "loc_wh_cold", perishable: true, shelf: 60, trackBatch: true, recipeUnit: "pieces", recipeQtyPerBase: 10 },
  { id: "itm_cream", name: "Fresh Cooking Cream", sku: "DRY-005", cat: CAT_IDS.dairy, sub: "Milk", type: "food", baseUnit: "litre", purchaseUnit: "pack", factor: 1, purchasePrice: 210, minStock: 10, reorderQty: 24, supplier: "sup_dairy", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_cold", perishable: true, shelf: 30, trackBatch: true },
  { id: "itm_egg", name: "Eggs (Large)", sku: "DRY-006", cat: CAT_IDS.dairy, sub: "Eggs", type: "food", baseUnit: "pieces", purchaseUnit: "dozen", factor: 12, purchasePrice: 84, minStock: 60, reorderQty: 100, supplier: "sup_dairy", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_cold", perishable: true, shelf: 21, trackBatch: true },
  { id: "itm_paneer", name: "Paneer (Fresh)", sku: "DRY-007", cat: CAT_IDS.dairy, sub: "Cheese", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 340, minStock: 8, reorderQty: 10, supplier: "sup_dairy", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_cold", perishable: true, shelf: 7, trackBatch: true },
  { id: "itm_yogurt", name: "Curd / Yogurt", sku: "DRY-008", cat: CAT_IDS.dairy, sub: "Milk", type: "food", baseUnit: "kg", purchaseUnit: "pack", factor: 0.4, purchasePrice: 40, minStock: 6, reorderQty: 10, supplier: "sup_dairy", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_cold", perishable: true, shelf: 10, trackBatch: true },
  { id: "itm_chicken_leg", name: "Chicken Legs", sku: "MTP-001", cat: CAT_IDS.meat, sub: "Chicken", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 190, minStock: 15, reorderQty: 20, supplier: "sup_meat", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_cold", perishable: true, shelf: 3, trackBatch: true },
  { id: "itm_chicken_breast", name: "Chicken Breast", sku: "MTP-002", cat: CAT_IDS.meat, sub: "Chicken", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 240, minStock: 10, reorderQty: 15, supplier: "sup_meat", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_cold", perishable: true, shelf: 3, trackBatch: true },
  { id: "itm_mutton", name: "Mutton Curry Cut", sku: "MTP-003", cat: CAT_IDS.meat, sub: "Mutton", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 720, minStock: 6, reorderQty: 10, supplier: "sup_meat", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_cold", perishable: true, shelf: 3, trackBatch: true },
  { id: "itm_bacon", name: "Chicken Sausages", sku: "MTP-004", cat: CAT_IDS.meat, sub: "Processed Meat", type: "food", baseUnit: "pack", purchaseUnit: "pack", factor: 1, purchasePrice: 260, minStock: 6, reorderQty: 12, supplier: "sup_meat", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe, OUTLET_IDS.bar], loc: "loc_wh_freezer", perishable: true, shelf: 120, trackBatch: true },
  { id: "itm_prawns", name: "Cleaned Prawns", sku: "SEA-001", cat: CAT_IDS.seafood, sub: "Prawns", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 430, minStock: 6, reorderQty: 10, supplier: "sup_sea", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_freezer", perishable: true, shelf: 90, trackBatch: true },
  { id: "itm_fish", name: "Basa Fillet", sku: "SEA-002", cat: CAT_IDS.seafood, sub: "Fish", type: "food", baseUnit: "kg", purchaseUnit: "kg", factor: 1, purchasePrice: 320, minStock: 6, reorderQty: 10, supplier: "sup_sea", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_freezer", perishable: true, shelf: 90, trackBatch: true },
  { id: "itm_maida", name: "Refined Flour (Maida)", sku: "DRG-001", cat: CAT_IDS.dry, sub: "Flour", type: "food", baseUnit: "kg", purchaseUnit: "bag", factor: 50, purchasePrice: 2250, minStock: 40, reorderQty: 2, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_dry", perishable: true, shelf: 180, trackBatch: true },
  { id: "itm_wheat", name: "Whole Wheat Atta", sku: "DRG-002", cat: CAT_IDS.dry, sub: "Flour", type: "food", baseUnit: "kg", purchaseUnit: "bag", factor: 50, purchasePrice: 2350, minStock: 30, reorderQty: 2, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 180, trackBatch: true },
  { id: "itm_rice", name: "Basmati Rice", sku: "DRG-003", cat: CAT_IDS.dry, sub: "Rice & Pasta", type: "food", baseUnit: "kg", purchaseUnit: "bag", factor: 25, purchasePrice: 2600, minStock: 30, reorderQty: 2, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 365, trackBatch: true },
  { id: "itm_pasta", name: "Penne Pasta", sku: "DRG-004", cat: CAT_IDS.dry, sub: "Rice & Pasta", type: "food", baseUnit: "kg", purchaseUnit: "pack", factor: 1, purchasePrice: 145, minStock: 10, reorderQty: 20, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 365, trackBatch: false },
  { id: "itm_sugar", name: "Sugar", sku: "DRG-005", cat: CAT_IDS.dry, sub: "Sugar", type: "food", baseUnit: "kg", purchaseUnit: "bag", factor: 50, purchasePrice: 2400, minStock: 25, reorderQty: 2, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe, OUTLET_IDS.bar], loc: "loc_wh_dry", perishable: true, shelf: 365, trackBatch: false, recipeUnit: "g" },
  { id: "itm_oil", name: "Sunflower Oil", sku: "DRG-006", cat: CAT_IDS.dry, sub: "Oil", type: "food", baseUnit: "litre", purchaseUnit: "can", factor: 15, purchasePrice: 2450, minStock: 30, reorderQty: 2, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.bar], loc: "loc_wh_dry", perishable: true, shelf: 240, trackBatch: true },
  { id: "itm_soya", name: "Soya Sauce", sku: "DRG-007", cat: CAT_IDS.dry, sub: "Spices", type: "food", baseUnit: "litre", purchaseUnit: "bottle", factor: 1, purchasePrice: 180, minStock: 5, reorderQty: 12, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 365, trackBatch: false },
  { id: "itm_salt", name: "Iodized Salt", sku: "DRG-008", cat: CAT_IDS.dry, sub: "Spices", type: "food", baseUnit: "kg", purchaseUnit: "bag", factor: 25, purchasePrice: 450, minStock: 10, reorderQty: 2, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_dry", perishable: true, shelf: 730, trackBatch: false, recipeUnit: "g" },
  { id: "itm_italian_seasoning", name: "Italian Seasoning", sku: "DRG-009", cat: CAT_IDS.dry, sub: "Spices", type: "food", baseUnit: "g", purchaseUnit: "pack", factor: 100, purchasePrice: 190, minStock: 200, reorderQty: 500, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 540, trackBatch: false, desc: "100 g pack; stock tracked in grams" },
  { id: "itm_cocoa", name: "Cocoa Powder", sku: "DRG-010", cat: CAT_IDS.dry, sub: "Spices", type: "food", baseUnit: "kg", purchaseUnit: "pack", factor: 0.5, purchasePrice: 420, minStock: 4, reorderQty: 6, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe], loc: "loc_wh_dry", perishable: true, shelf: 365, trackBatch: false },
  { id: "itm_bread", name: "Burger Buns", sku: "BKY-001", cat: CAT_IDS.bakery, sub: "Buns", type: "food", baseUnit: "pieces", purchaseUnit: "pack", factor: 6, purchasePrice: 60, minStock: 30, reorderQty: 60, supplier: "sup_bakery", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 3, trackBatch: true, recipeUnit: "pieces" },
  { id: "itm_pizza_base", name: "Pizza Base (10 inch)", sku: "BKY-002", cat: CAT_IDS.bakery, sub: "Bread", type: "food", baseUnit: "pieces", purchaseUnit: "pack", factor: 6, purchasePrice: 120, minStock: 24, reorderQty: 40, supplier: "sup_bakery", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 4, trackBatch: true, recipeUnit: "pieces" },
  { id: "itm_brownie", name: "Chocolate Brownie (frozen)", sku: "BKY-003", cat: CAT_IDS.bakery, sub: "Desserts", type: "food", baseUnit: "pieces", purchaseUnit: "box", factor: 12, purchasePrice: 480, minStock: 12, reorderQty: 24, supplier: "sup_bakery", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe, OUTLET_IDS.resto], loc: "loc_wh_freezer", perishable: true, shelf: 60, trackBatch: true, recipeUnit: "pieces" },
  { id: "itm_bread_loaf", name: "Sourdough Loaf", sku: "BKY-004", cat: CAT_IDS.bakery, sub: "Bread", type: "food", baseUnit: "pieces", purchaseUnit: "pieces", factor: 1, purchasePrice: 110, minStock: 10, reorderQty: 20, supplier: "sup_bakery", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe], loc: "loc_wh_dry", perishable: true, shelf: 3, trackBatch: true },
  { id: "itm_coffee_beans", name: "Arabica Coffee Beans", sku: "CFT-001", barcode: "8901234000103", cat: CAT_IDS.coffee, sub: "Coffee Beans", type: "beverage", baseUnit: "kg", purchaseUnit: "bag", factor: 1, purchasePrice: 950, minStock: 10, reorderQty: 20, supplier: "sup_bev", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe, OUTLET_IDS.bar], loc: "loc_wh_dry", perishable: true, shelf: 180, trackBatch: true, recipeUnit: "g" },
  { id: "itm_cocoa_pdr", name: "Chocolate Cocoa Powder", sku: "CFT-002", cat: CAT_IDS.coffee, sub: "Powders", type: "beverage", baseUnit: "kg", purchaseUnit: "pack", factor: 0.5, purchasePrice: 420, minStock: 4, reorderQty: 8, supplier: "sup_bev", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe, OUTLET_IDS.bar], loc: "loc_wh_dry", perishable: true, shelf: 300, trackBatch: false },
  { id: "itm_tea_leaves", name: "Assam Tea Leaves", sku: "CFT-003", cat: CAT_IDS.coffee, sub: "Tea Leaves", type: "beverage", baseUnit: "kg", purchaseUnit: "pack", factor: 0.5, purchasePrice: 260, minStock: 5, reorderQty: 10, supplier: "sup_bev", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 540, trackBatch: false },
  { id: "itm_soda", name: "Club Soda", sku: "SFD-001", cat: CAT_IDS.soft, sub: "Soda", type: "beverage", baseUnit: "bottle", purchaseUnit: "carton", factor: 24, purchasePrice: 192, minStock: 48, reorderQty: 120, supplier: "sup_bev", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar, OUTLET_IDS.cafe], loc: "loc_wh_dry", perishable: true, shelf: 180, trackBatch: true, recipeUnit: "ml", recipeQtyPerBase: 200 },
  { id: "itm_cola", name: "Cola", sku: "SFD-002", cat: CAT_IDS.soft, sub: "Soda", type: "beverage", baseUnit: "bottle", purchaseUnit: "carton", factor: 24, purchasePrice: 216, minStock: 48, reorderQty: 96, supplier: "sup_bev", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar, OUTLET_IDS.cafe, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 180, trackBatch: true, recipeUnit: "ml", recipeQtyPerBase: 200 },
  { id: "itm_water", name: "Packaged Drinking Water", sku: "SFD-003", cat: CAT_IDS.soft, sub: "Water", type: "beverage", baseUnit: "bottle", purchaseUnit: "carton", factor: 24, purchasePrice: 168, minStock: 96, reorderQty: 240, supplier: "sup_bev", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar, OUTLET_IDS.cafe, OUTLET_IDS.resto], loc: "loc_wh_dry", perishable: true, shelf: 365, trackBatch: false },
  { id: "itm_gin", name: "London Dry Gin", sku: "ALC-001", cat: CAT_IDS.alcohol, sub: "Spirits", type: "alcohol", baseUnit: "bottle", purchaseUnit: "bottle", factor: 1, purchasePrice: 1650, minStock: 6, reorderQty: 12, supplier: "sup_liquor", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar], loc: "loc_wh_bar", perishable: false, shelf: 1095, trackBatch: false, recipeUnit: "ml", recipeQtyPerBase: 600 },
  { id: "itm_vodka", name: "Premium Vodka", sku: "ALC-002", cat: CAT_IDS.alcohol, sub: "Spirits", type: "alcohol", baseUnit: "bottle", purchaseUnit: "bottle", factor: 1, purchasePrice: 1450, minStock: 6, reorderQty: 12, supplier: "sup_liquor", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar], loc: "loc_wh_bar", perishable: false, shelf: 1095, trackBatch: false, recipeUnit: "ml", recipeQtyPerBase: 600 },
  { id: "itm_white_rum", name: "White Rum", sku: "ALC-003", cat: CAT_IDS.alcohol, sub: "Spirits", type: "alcohol", baseUnit: "bottle", purchaseUnit: "bottle", factor: 1, purchasePrice: 1250, minStock: 4, reorderQty: 12, supplier: "sup_liquor", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar], loc: "loc_wh_bar", perishable: false, shelf: 1095, trackBatch: false, recipeUnit: "ml", recipeQtyPerBase: 600 },
  { id: "itm_whiskey", name: "Blended Whiskey", sku: "ALC-004", cat: CAT_IDS.alcohol, sub: "Spirits", type: "alcohol", baseUnit: "bottle", purchaseUnit: "bottle", factor: 1, purchasePrice: 1900, minStock: 4, reorderQty: 12, supplier: "sup_liquor", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar], loc: "loc_wh_bar", perishable: false, shelf: 1095, trackBatch: false },
  { id: "itm_beer", name: "Draft Beer", sku: "ALC-005", cat: CAT_IDS.alcohol, sub: "Beer", type: "alcohol", baseUnit: "bottle", purchaseUnit: "carton", factor: 12, purchasePrice: 900, minStock: 48, reorderQty: 120, supplier: "sup_liquor", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar, OUTLET_IDS.resto], loc: "loc_wh_cold", perishable: true, shelf: 180, trackBatch: true },
  { id: "itm_syrup", name: "Flavored Syrup", sku: "ALC-006", cat: CAT_IDS.alcohol, sub: "Syrups", type: "beverage", baseUnit: "litre", purchaseUnit: "bottle", factor: 1, purchasePrice: 320, minStock: 6, reorderQty: 12, supplier: "sup_bev", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar, OUTLET_IDS.cafe], loc: "loc_wh_bar", perishable: true, shelf: 365, trackBatch: false, recipeUnit: "ml" },
  { id: "itm_mint", name: "Mint Leaves", sku: "VEG-008", cat: CAT_IDS.veg, sub: "Herbs", type: "food", baseUnit: "kg", purchaseUnit: "pack", factor: 0.1, purchasePrice: 25, minStock: 2, reorderQty: 10, supplier: "sup_fresh", outlets: [OUTLET_IDS.wh, OUTLET_IDS.bar], loc: "loc_wh_cold", perishable: true, shelf: 4, trackBatch: false },
  { id: "itm_fries", name: "Frozen French Fries", sku: "FZD-001", cat: CAT_IDS.frozen, sub: "Fries", type: "food", baseUnit: "kg", purchaseUnit: "pack", factor: 2.5, purchasePrice: 420, minStock: 12, reorderQty: 20, supplier: "sup_dry", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.bar, OUTLET_IDS.cafe], loc: "loc_wh_freezer", perishable: true, shelf: 180, trackBatch: true },
  { id: "itm_cups", name: "Paper Coffee Cups 8oz", sku: "PKG-001", cat: CAT_IDS.packaging, sub: "Cups", type: "packaging", baseUnit: "pieces", purchaseUnit: "carton", factor: 50, purchasePrice: 1350, minStock: 100, reorderQty: 100, supplier: "sup_pack", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe], loc: "loc_wh_pack", perishable: false, shelf: 1825, trackBatch: false },
  { id: "itm_lids", name: "Cup Lids 8oz", sku: "PKG-002", cat: CAT_IDS.packaging, sub: "Cups", type: "packaging", baseUnit: "pieces", purchaseUnit: "carton", factor: 50, purchasePrice: 900, minStock: 100, reorderQty: 100, supplier: "sup_pack", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe], loc: "loc_wh_pack", perishable: false, shelf: 1825, trackBatch: false },
  { id: "itm_container", name: "Takeaway Food Container", sku: "PKG-003", cat: CAT_IDS.packaging, sub: "Containers", type: "packaging", baseUnit: "pieces", purchaseUnit: "pack", factor: 50, purchasePrice: 450, minStock: 200, reorderQty: 500, supplier: "sup_pack", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_pack", perishable: false, shelf: 1825, trackBatch: false },
  { id: "itm_cutlery", name: "Disposable Cutlery Set", sku: "PKG-004", cat: CAT_IDS.packaging, sub: "Cutlery", type: "packaging", baseUnit: "pieces", purchaseUnit: "box", factor: 100, purchasePrice: 350, minStock: 200, reorderQty: 500, supplier: "sup_pack", outlets: [OUTLET_IDS.wh, OUTLET_IDS.cafe], loc: "loc_wh_pack", perishable: false, shelf: 1825, trackBatch: false },
  { id: "itm_dishwash", name: "Dishwash Liquid", sku: "CLN-001", cat: CAT_IDS.cleaning, sub: "Detergents", type: "supply", baseUnit: "litre", purchaseUnit: "can", factor: 5, purchasePrice: 640, minStock: 10, reorderQty: 10, supplier: "sup_clean", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe, OUTLET_IDS.bar], loc: "loc_wh_clean", perishable: false, shelf: 730, trackBatch: false },
  { id: "itm_sanitiser", name: "Surface Sanitiser", sku: "CLN-002", cat: CAT_IDS.cleaning, sub: "Sanitisers", type: "supply", baseUnit: "litre", purchaseUnit: "bottle", factor: 1, purchasePrice: 220, minStock: 8, reorderQty: 12, supplier: "sup_clean", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe, OUTLET_IDS.bar], loc: "loc_wh_clean", perishable: false, shelf: 540, trackBatch: false },
  { id: "itm_gloves", name: "Disposable Gloves (box)", sku: "CLN-003", cat: CAT_IDS.cleaning, sub: "Sanitisers", type: "supply", baseUnit: "box", purchaseUnit: "box", factor: 1, purchasePrice: 320, minStock: 5, reorderQty: 10, supplier: "sup_clean", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe], loc: "loc_wh_clean", perishable: false, shelf: 1095, trackBatch: false },
  { id: "itm_cleanser", name: "Toilet Cleanser", sku: "CLN-004", cat: CAT_IDS.cleaning, sub: "Detergents", type: "supply", baseUnit: "litre", purchaseUnit: "bottle", factor: 1, purchasePrice: 160, minStock: 6, reorderQty: 12, supplier: "sup_clean", outlets: [OUTLET_IDS.wh, OUTLET_IDS.resto, OUTLET_IDS.cafe, OUTLET_IDS.bar], loc: "loc_wh_clean", perishable: false, shelf: 730, trackBatch: false },
];

const items: InventoryItem[] = itemSeeds.map((s) => ({
  id: s.id,
  name: s.name,
  sku: s.sku,
  barcode: s.barcode ?? "",
  description: s.desc ?? "",
  categoryId: s.cat,
  subcategory: s.sub,
  type: s.type,
  baseUnit: s.baseUnit,
  purchaseUnit: s.purchaseUnit,
  recipeUnit: s.recipeUnit ?? s.baseUnit,
  conversion: {
    purchaseUnit: s.purchaseUnit,
    purchaseQty: s.factor,
    baseUnit: s.baseUnit,
    recipeUnit: s.recipeUnit ?? s.baseUnit,
    recipeQtyPerBase: s.recipeQtyPerBase ?? 1,
  },
  minStock: s.minStock,
  reorderQty: s.reorderQty,
  preferredSupplierId: s.supplier,
  purchasePrice: s.purchasePrice,
  avgCost: round2(s.purchasePrice / s.factor),
  taxPct: s.taxPct ?? 5,
  storageLocationId: s.loc,
  outletIds: s.outlets,
  perishable: s.perishable,
  shelfLifeDays: s.shelf,
  trackBatch: s.trackBatch,
  status: "active",
  createdAt: dAgo(180),
  updatedAt: dAgo(Math.floor(Math.random() * 10) + 1),
}));

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Starting balances per outlet (warehouse-heavy with some outlet stock). */
const startingStock: Record<string, Record<string, number>> = {
  itm_onion: { out_wh: 42, out_resto: 10, out_cafe: 4 },
  itm_tomato: { out_wh: 28, out_resto: 9, out_cafe: 5 },
  itm_potato: { out_wh: 95, out_resto: 22, out_bar: 15 },
  itm_capsicum: { out_wh: 9, out_resto: 4 },
  itm_lettuce: { out_wh: 7, out_resto: 3.5, out_cafe: 2 },
  itm_lemon: { out_wh: 14, out_bar: 6, out_cafe: 3.5 },
  itm_coriander: { out_wh: 2.5, out_resto: 1 },
  itm_milk: { out_wh: 64, out_cafe: 26, out_resto: 18, out_bar: 8 },
  itm_butter: { out_wh: 12, out_cafe: 6, out_resto: 4 },
  itm_cheese_mo: { out_wh: 16, out_resto: 5.5 },
  itm_cheese_proc: { out_wh: 8, out_cafe: 4 },
  itm_cream: { out_wh: 14, out_resto: 6, out_cafe: 3.5 },
  itm_egg: { out_wh: 168, out_resto: 48, out_cafe: 36 },
  itm_paneer: { out_wh: 9, out_resto: 4 },
  itm_yogurt: { out_wh: 5.2, out_resto: 2.6 },
  itm_chicken_leg: { out_wh: 18, out_resto: 8 },
  itm_chicken_breast: { out_wh: 11, out_resto: 5, out_cafe: 4.5 },
  itm_mutton: { out_wh: 6.5, out_resto: 3 },
  itm_bacon: { out_wh: 8, out_cafe: 3, out_bar: 2 },
  itm_prawns: { out_wh: 7.5, out_resto: 3 },
  itm_fish: { out_wh: 8.5, out_resto: 3.5 },
  itm_maida: { out_wh: 120, out_resto: 28, out_cafe: 20 },
  itm_wheat: { out_wh: 96, out_resto: 24 },
  itm_rice: { out_wh: 88, out_resto: 26 },
  itm_pasta: { out_wh: 26, out_resto: 9 },
  itm_sugar: { out_wh: 74, out_cafe: 22, out_bar: 16 },
  itm_oil: { out_wh: 58, out_resto: 18, out_bar: 9 },
  itm_soya: { out_wh: 6, out_resto: 2.5 },
  itm_salt: { out_wh: 24, out_resto: 8, out_cafe: 6 },
  itm_italian_seasoning: { out_wh: 850, out_resto: 320 },
  itm_cocoa: { out_wh: 5.5, out_cafe: 2.4 },
  itm_bread: { out_wh: 66, out_cafe: 26, out_resto: 18 },
  itm_pizza_base: { out_wh: 54, out_resto: 18 },
  itm_brownie: { out_wh: 34, out_cafe: 12, out_resto: 8 },
  itm_bread_loaf: { out_wh: 16, out_cafe: 6 },
  itm_coffee_beans: { out_wh: 22, out_cafe: 12, out_bar: 6 },
  itm_cocoa_pdr: { out_wh: 5.5, out_cafe: 2.6, out_bar: 1.8 },
  itm_tea_leaves: { out_wh: 7.5, out_cafe: 3.5, out_resto: 2.5 },
  itm_soda: { out_wh: 144, out_bar: 58, out_cafe: 36 },
  itm_cola: { out_wh: 168, out_bar: 66, out_cafe: 44, out_resto: 36 },
  itm_water: { out_wh: 288, out_bar: 96, out_cafe: 72, out_resto: 84 },
  itm_gin: { out_wh: 9, out_bar: 5 },
  itm_vodka: { out_wh: 10, out_bar: 6 },
  itm_white_rum: { out_wh: 7, out_bar: 4 },
  itm_whiskey: { out_wh: 8, out_bar: 5 },
  itm_beer: { out_wh: 108, out_bar: 48, out_resto: 26 },
  itm_syrup: { out_wh: 9, out_bar: 4, out_cafe: 3 },
  itm_mint: { out_wh: 3.5, out_bar: 1.5 },
  itm_fries: { out_wh: 34, out_resto: 12, out_bar: 9, out_cafe: 7.5 },
  itm_cups: { out_wh: 820, out_cafe: 340 },
  itm_lids: { out_wh: 760, out_cafe: 300 },
  itm_container: { out_wh: 1150, out_resto: 420, out_cafe: 280 },
  itm_cutlery: { out_wh: 900, out_cafe: 360 },
  itm_dishwash: { out_wh: 22, out_resto: 8, out_cafe: 6, out_bar: 4 },
  itm_sanitiser: { out_wh: 16, out_resto: 6, out_cafe: 5, out_bar: 3 },
  itm_gloves: { out_wh: 9, out_resto: 4, out_cafe: 3 },
  itm_cleanser: { out_wh: 11, out_resto: 5, out_cafe: 4, out_bar: 3 },
};

const balances: InventoryBalance[] = [];
for (const item of items) {
  const stock = startingStock[item.id] ?? {};
  for (const [outletId, qty] of Object.entries(stock)) {
    if (!item.outletIds.includes(outletId)) continue;
    balances.push({
      id: `bal_${item.id}_${outletId}`,
      itemId: item.id,
      outletId,
      qty,
      avgCost: item.avgCost,
      updatedAt: dAgo(Math.floor(Math.random() * 5) + 1),
    });
  }
}

/** A few batches with expiry for perishables (batch tracking demo). */
const batches: StockBatch[] = [
  { id: "bat_1", itemId: "itm_milk", outletId: "out_wh", batchNo: "ND-2210-A", qty: 36, expiryDate: dayAhead(4), receivedAt: dAgo(2), costPerUnit: 68 },
  { id: "bat_2", itemId: "itm_milk", outletId: "out_cafe", batchNo: "ND-2210-B", qty: 18, expiryDate: dayAhead(2), receivedAt: dAgo(1), costPerUnit: 68 },
  { id: "bat_3", itemId: "itm_egg", outletId: "out_wh", batchNo: "EG-4412", qty: 120, expiryDate: dayAhead(11), receivedAt: dAgo(4), costPerUnit: 7 },
  { id: "bat_4", itemId: "itm_chicken_breast", outletId: "out_wh", batchNo: "HP-8891", qty: 6.5, expiryDate: dayAhead(2), receivedAt: dAgo(1), costPerUnit: 240 },
  { id: "bat_5", itemId: "itm_paneer", outletId: "out_resto", batchNo: "ND-PN-77", qty: 4, expiryDate: dayAhead(3), receivedAt: dAgo(1), costPerUnit: 340 },
  { id: "bat_6", itemId: "itm_lettuce", outletId: "out_resto", batchNo: "FC-LT-19", qty: 3.5, expiryDate: dayAhead(2), receivedAt: dAgo(2), costPerUnit: 45 },
  { id: "bat_7", itemId: "itm_beer", outletId: "out_bar", batchNo: "BR-77123", qty: 36, expiryDate: dayAhead(60), receivedAt: dAgo(6), costPerUnit: 75 },
  { id: "bat_8", itemId: "itm_cream", outletId: "out_wh", batchNo: "ND-CR-33", qty: 8, expiryDate: dayAhead(9), receivedAt: dAgo(3), costPerUnit: 210 },
];

/* -------- historical movements (30 days) to drive trends + consumption -------- */

const movements: StockMovement[] = [];
let mvn = 1;

function pushMv(m: Omit<StockMovement, "id">) {
  movements.push({ id: `mov_${String(mvn++).padStart(4, "0")}`, ...m });
}

// Purchase receipts (weekly restocks)
const receiptPOs = [
  { sup: "sup_fresh", outlet: "out_wh", ref: "PO-0007", daysAgo: 28, lines: [["itm_onion", 60, 32], ["itm_tomato", 50, 28], ["itm_lemon", 20, 38]] },
  { sup: "sup_dairy", outlet: "out_wh", ref: "PO-0008", daysAgo: 26, lines: [["itm_milk", 120, 68], ["itm_butter", 20, 285], ["itm_egg", 150, 7]] },
  { sup: "sup_dry", outlet: "out_wh", ref: "PO-0009", daysAgo: 24, lines: [["itm_maida", 200, 45], ["itm_oil", 45, 163.33], ["itm_sugar", 100, 48]] },
  { sup: "sup_bev", outlet: "out_wh", ref: "PO-0010", daysAgo: 21, lines: [["itm_coffee_beans", 25, 950], ["itm_cola", 216, 9], ["itm_soda", 192, 8]] },
  { sup: "sup_bakery", outlet: "out_cafe", ref: "PO-0011", daysAgo: 18, lines: [["itm_bread", 90, 10], ["itm_brownie", 24, 40]] },
  { sup: "sup_meat", outlet: "out_resto", ref: "PO-0012", daysAgo: 15, lines: [["itm_chicken_leg", 25, 190], ["itm_chicken_breast", 18, 240]] },
  { sup: "sup_liquor", outlet: "out_bar", ref: "PO-0013", daysAgo: 12, lines: [["itm_gin", 12, 1650], ["itm_vodka", 12, 1450], ["itm_beer", 120, 75]] },
  { sup: "sup_fresh", outlet: "out_wh", ref: "PO-0014", daysAgo: 9, lines: [["itm_onion", 50, 33], ["itm_potato", 6, 26], ["itm_capsicum", 15, 48]] },
  { sup: "sup_dairy", outlet: "out_wh", ref: "PO-0015", daysAgo: 6, lines: [["itm_milk", 100, 68], ["itm_paneer", 12, 340], ["itm_cream", 24, 210]] },
  { sup: "sup_pack", outlet: "out_cafe", ref: "PO-0016", daysAgo: 4, lines: [["itm_cups", 100, 27], ["itm_lids", 100, 18]] },
  { sup: "sup_dry", outlet: "out_resto", ref: "PO-0017", daysAgo: 2, lines: [["itm_fries", 20, 168], ["itm_pasta", 20, 145]] },
];

for (const r of receiptPOs) {
  for (const [itemId, qty, cost] of r.lines as [string, number, number][]) {
    pushMv({
      at: dAgo(r.daysAgo),
      refNo: r.ref,
      type: "purchase_receipt",
      itemId,
      outletId: r.outlet,
      qtyIn: qty,
      qtyOut: 0,
      unitCost: cost,
      balanceAfter: 0,
      performedBy: "Rahul Menon",
      notes: `Goods receipt against ${r.ref}`,
    });
  }
}

// Daily consumption (recipe consumption / stock out) for high-usage items
const consumptionItems: [string, string, number][] = [
  ["itm_milk", "out_cafe", 9],
  ["itm_milk", "out_resto", 6],
  ["itm_milk", "out_bar", 2.5],
  ["itm_coffee_beans", "out_cafe", 1.4],
  ["itm_coffee_beans", "out_bar", 0.5],
  ["itm_cups", "out_cafe", 65],
  ["itm_lids", "out_cafe", 60],
  ["itm_sugar", "out_cafe", 2.5],
  ["itm_chicken_breast", "out_resto", 3.2],
  ["itm_chicken_leg", "out_resto", 4.1],
  ["itm_maida", "out_resto", 5.5],
  ["itm_maida", "out_cafe", 2],
  ["itm_oil", "out_resto", 2.8],
  ["itm_potato", "out_bar", 4.5],
  ["itm_fries", "out_bar", 3.2],
  ["itm_fries", "out_resto", 2.4],
  ["itm_beer", "out_bar", 6.2],
  ["itm_gin", "out_bar", 0.4],
  ["itm_vodka", "out_bar", 0.35],
  ["itm_cola", "out_bar", 7],
  ["itm_soda", "out_bar", 6],
  ["itm_lemon", "out_bar", 1.1],
  ["itm_mint", "out_bar", 0.3],
  ["itm_water", "out_resto", 9],
  ["itm_water", "out_cafe", 6],
  ["itm_tea_leaves", "out_cafe", 0.35],
  ["itm_cheese_mo", "out_resto", 1.6],
  ["itm_pizza_base", "out_resto", 11],
  ["itm_bread", "out_cafe", 16],
  ["itm_egg", "out_resto", 14],
  ["itm_egg", "out_cafe", 9],
  ["itm_onion", "out_resto", 3.1],
  ["itm_tomato", "out_resto", 2.9],
  ["itm_container", "out_resto", 55],
  ["itm_cutlery", "out_cafe", 22],
  ["itm_dishwash", "out_resto", 0.25],
  ["itm_sanitiser", "out_resto", 0.2],
  ["itm_whiskey", "out_bar", 0.22],
  ["itm_white_rum", "out_bar", 0.18],
  ["itm_syrup", "out_bar", 0.15],
];

let consumptionSeq = 1;
for (let d = 29; d >= 0; d--) {
  for (const [itemId, outletId, qty] of consumptionItems) {
    const item = items.find((i) => i.id === itemId)!;
    const jitter = 0.7 + ((d * 37 + itemId.length * 13 + outletId.length) % 70) / 100;
    const q = Math.round(qty * jitter * 100) / 100;
    if (q <= 0) continue;
    pushMv({
      at: dAgo(d),
      refNo: `CONS-${String(consumptionSeq++).padStart(4, "0")}`,
      type: "recipe_consumption",
      itemId,
      outletId,
      qtyIn: 0,
      qtyOut: q,
      unitCost: item.avgCost,
      balanceAfter: 0,
      performedBy: "System",
      notes: "Daily kitchen/bar consumption",
    });
  }
}

// Waste records
const waste: WasteRecord[] = [
  { id: "wst_1", itemId: "itm_lettuce", outletId: "out_resto", qty: 1.2, unitCost: 45, cost: 54, reason: "Spoiled", at: dAgo(26), notes: "Browning on outer leaves", recordedBy: "Vikram Shah" },
  { id: "wst_2", itemId: "itm_milk", outletId: "out_cafe", qty: 4, unitCost: 68, cost: 272, reason: "Expired", at: dAgo(23), notes: "Sour smell, past use-by", recordedBy: "Ananya Rao" },
  { id: "wst_3", itemId: "itm_bread", outletId: "out_cafe", qty: 9, unitCost: 10, cost: 90, reason: "Overproduction", at: dAgo(19), notes: "End-of-day unsold buns", recordedBy: "Ananya Rao" },
  { id: "wst_4", itemId: "itm_chicken_breast", outletId: "out_resto", qty: 1.5, unitCost: 240, cost: 360, reason: "Preparation Waste", at: dAgo(16), notes: "Over-trimmed during prep", recordedBy: "Chef Ravi" },
  { id: "wst_5", itemId: "itm_oil", outletId: "out_resto", qty: 3, unitCost: 163.33, cost: 490, reason: "Other", at: dAgo(12), notes: "Oil beyond smoke point, disposed", recordedBy: "Chef Ravi" },
  { id: "wst_6", itemId: "itm_tomato", outletId: "out_resto", qty: 2.4, unitCost: 28, cost: 67.2, reason: "Spoiled", at: dAgo(9), notes: "Soft & bruised on arrival", recordedBy: "Vikram Shah" },
  { id: "wst_7", itemId: "itm_paneer", outletId: "out_resto", qty: 1.1, unitCost: 340, cost: 374, reason: "Expired", at: dAgo(6), notes: "Left in walk-in over weekend", recordedBy: "Vikram Shah" },
  { id: "wst_8", itemId: "itm_cups", outletId: "out_cafe", qty: 22, unitCost: 27, cost: 594, reason: "Damaged Packaging", at: dAgo(4), notes: "Crushed during unloading", recordedBy: "Ananya Rao" },
  { id: "wst_9", itemId: "itm_egg", outletId: "out_cafe", qty: 6, unitCost: 7, cost: 42, reason: "Spillage", at: dAgo(3), notes: "Tray dropped", recordedBy: "Ananya Rao" },
  { id: "wst_10", itemId: "itm_fries", outletId: "out_bar", qty: 2.5, unitCost: 168, cost: 420, reason: "Overproduction", at: dAgo(2), notes: "Late-night over prep", recordedBy: "Meera Kapoor" },
  { id: "wst_11", itemId: "itm_lemon", outletId: "out_bar", qty: 1.4, unitCost: 38, cost: 53.2, reason: "Preparation Waste", at: dAgo(1), notes: "Peels & ends from muddling", recordedBy: "Meera Kapoor" },
];

for (const w of waste) {
  pushMv({
    at: w.at,
    refNo: `WST-${w.id.split("_")[1].padStart(4, "0")}`,
    type: "waste",
    itemId: w.itemId,
    outletId: w.outletId,
    qtyIn: 0,
    qtyOut: w.qty,
    unitCost: w.unitCost,
    balanceAfter: 0,
    performedBy: w.recordedBy,
    notes: `${w.reason}: ${w.notes}`,
  });
}

// A couple of adjustments + transfers for realism
pushMv({ at: dAgo(20), refNo: "ADJ-0001", type: "adjustment", itemId: "itm_salt", outletId: "out_resto", qtyIn: 0, qtyOut: 1.5, unitCost: 18, balanceAfter: 0, performedBy: "Vikram Shah", notes: "Cycle count variance (damaged bag)" });
pushMv({ at: dAgo(14), refNo: "TRF-0002", type: "transfer_out", itemId: "itm_beer", outletId: "out_wh", qtyIn: 0, qtyOut: 24, unitCost: 75, balanceAfter: 0, performedBy: "Rahul Menon", notes: "Transfer to The Oak Bar" });
pushMv({ at: dAgo(14), refNo: "TRF-0002", type: "transfer_in", itemId: "itm_beer", outletId: "out_bar", qtyIn: 24, qtyOut: 0, unitCost: 75, balanceAfter: 0, performedBy: "Meera Kapoor", notes: "Transfer from Central Warehouse" });
pushMv({ at: dAgo(8), refNo: "RTS-0001", type: "return_to_supplier", itemId: "itm_milk", outletId: "out_wh", qtyIn: 0, qtyOut: 6, unitCost: 68, balanceAfter: 0, performedBy: "Rahul Menon", notes: "Returned to Nandini Dairy (packaging damaged)" });

/* -------- purchase orders -------- */

const poLine = (
  itemId: string,
  qty: number,
  unitCost: number,
  qtyReceived = 0,
  discountPct = 0,
  taxPct = 5
) => ({
  id: `ln_${itemId}_${qty}`,
  itemId,
  qtyOrdered: qty,
  unitCost,
  qtyReceived,
  discountPct,
  taxPct,
  status: (qtyReceived > 0 ? "pending" : "pending") as "pending",
});

const purchaseOrders: PurchaseOrder[] = [
  {
    id: "po_1", poNumber: "PO-0001", supplierId: "sup_fresh", outletId: "out_wh",
    orderDate: day(75), expectedDate: day(73), status: "received", createdBy: "Rahul Menon",
    lines: [poLine("itm_onion", 100, 31), poLine("itm_tomato", 80, 27), poLine("itm_lemon", 30, 36)],
    statusHistory: [{ at: dAgo(75), status: "draft", by: "Rahul Menon" }, { at: dAgo(75), status: "approved", by: "Owner" }, { at: dAgo(74), status: "ordered", by: "Rahul Menon" }, { at: dAgo(73), status: "received", by: "Rahul Menon", note: "Full receipt GRN-0001" }],
    receiptIds: [], notes: "", createdAt: dAgo(75), updatedAt: dAgo(73),
  },
  {
    id: "po_2", poNumber: "PO-0002", supplierId: "sup_dairy", outletId: "out_wh",
    orderDate: day(70), expectedDate: day(68), status: "received", createdBy: "Rahul Menon",
    lines: [poLine("itm_milk", 150, 66), poLine("itm_butter", 24, 280), poLine("itm_egg", 200, 6.8)],
    statusHistory: [{ at: dAgo(70), status: "draft", by: "Rahul Menon" }, { at: dAgo(69), status: "approved", by: "Owner" }, { at: dAgo(69), status: "ordered", by: "Rahul Menon" }, { at: dAgo(68), status: "received", by: "Rahul Menon" }],
    receiptIds: [], notes: "", createdAt: dAgo(70), updatedAt: dAgo(68),
  },
  {
    id: "po_3", poNumber: "PO-0003", supplierId: "sup_bakery", outletId: "out_cafe",
    orderDate: day(64), expectedDate: day(63), status: "received", createdBy: "Ananya Rao",
    lines: [poLine("itm_bread", 120, 9.5, 0, 0, 5), poLine("itm_pizza_base", 60, 19, 0, 0, 5)],
    statusHistory: [{ at: dAgo(64), status: "draft", by: "Ananya Rao" }, { at: dAgo(64), status: "approved", by: "Owner" }, { at: dAgo(64), status: "ordered", by: "Ananya Rao" }, { at: dAgo(63), status: "received", by: "Ananya Rao" }],
    receiptIds: [], notes: "", createdAt: dAgo(64), updatedAt: dAgo(63),
  },
  {
    id: "po_4", poNumber: "PO-0004", supplierId: "sup_meat", outletId: "out_resto",
    orderDate: day(58), expectedDate: day(56), status: "received", createdBy: "Vikram Shah",
    lines: [poLine("itm_chicken_leg", 40, 185), poLine("itm_chicken_breast", 30, 235), poLine("itm_mutton", 12, 700)],
    statusHistory: [{ at: dAgo(58), status: "draft", by: "Vikram Shah" }, { at: dAgo(57), status: "approved", by: "Owner" }, { at: dAgo(57), status: "ordered", by: "Vikram Shah" }, { at: dAgo(56), status: "received", by: "Vikram Shah" }],
    receiptIds: [], notes: "", createdAt: dAgo(58), updatedAt: dAgo(56),
  },
  {
    id: "po_5", poNumber: "PO-0005", supplierId: "sup_liquor", outletId: "out_bar",
    orderDate: day(50), expectedDate: day(46), status: "received", createdBy: "Meera Kapoor",
    lines: [poLine("itm_gin", 12, 1600, 0, 0, 12), poLine("itm_vodka", 12, 1400, 0, 0, 12), poLine("itm_beer", 144, 72, 0, 0, 12)],
    statusHistory: [{ at: dAgo(50), status: "draft", by: "Meera Kapoor" }, { at: dAgo(49), status: "approved", by: "Owner" }, { at: dAgo(49), status: "ordered", by: "Meera Kapoor" }, { at: dAgo(46), status: "received", by: "Meera Kapoor" }],
    receiptIds: [], notes: "Liquor licence copy attached.", createdAt: dAgo(50), updatedAt: dAgo(46),
  },
  {
    id: "po_6", poNumber: "PO-0006", supplierId: "sup_pack", outletId: "out_cafe",
    orderDate: day(42), expectedDate: day(39), status: "partially_received", createdBy: "Ananya Rao",
    lines: [poLine("itm_cups", 200, 26.5, 100), poLine("itm_lids", 200, 17.5, 100), poLine("itm_container", 1000, 8.8, 0)],
    statusHistory: [{ at: dAgo(42), status: "draft", by: "Ananya Rao" }, { at: dAgo(41), status: "approved", by: "Owner" }, { at: dAgo(41), status: "ordered", by: "Ananya Rao" }, { at: dAgo(39), status: "partially_received", by: "Ananya Rao", note: "Cups & lids received, containers pending" }],
    receiptIds: [], notes: "Container delivery delayed by supplier.", createdAt: dAgo(42), updatedAt: dAgo(39),
  },
  {
    id: "po_7", poNumber: "PO-0007", supplierId: "sup_fresh", outletId: "out_wh",
    orderDate: day(3), expectedDate: dayAhead(1), status: "ordered", createdBy: "Rahul Menon",
    lines: [poLine("itm_onion", 80, 32), poLine("itm_tomato", 60, 28), poLine("itm_lettuce", 20, 44), poLine("itm_capsicum", 20, 48)],
    statusHistory: [{ at: dAgo(3), status: "draft", by: "Rahul Menon" }, { at: dAgo(2), status: "approved", by: "Owner" }, { at: dAgo(2), status: "ordered", by: "Rahul Menon" }],
    receiptIds: [], notes: "Morning delivery slot 5–6 AM.", createdAt: dAgo(3), updatedAt: dAgo(2),
  },
  {
    id: "po_8", poNumber: "PO-0008", supplierId: "sup_dairy", outletId: "out_wh",
    orderDate: day(1), expectedDate: dayAhead(1), status: "approved", createdBy: "Rahul Menon",
    lines: [poLine("itm_milk", 140, 68), poLine("itm_cream", 24, 210), poLine("itm_paneer", 15, 335)],
    statusHistory: [{ at: dAgo(1), status: "draft", by: "Rahul Menon" }, { at: dAgo(1), status: "approved", by: "Owner" }],
    receiptIds: [], notes: "", createdAt: dAgo(1), updatedAt: dAgo(1),
  },
  {
    id: "po_9", poNumber: "PO-0009", supplierId: "sup_bev", outletId: "out_wh",
    orderDate: day(0), expectedDate: dayAhead(3), status: "pending_approval", createdBy: "Ananya Rao",
    lines: [poLine("itm_coffee_beans", 30, 940), poLine("itm_tea_leaves", 15, 255), poLine("itm_cocoa_pdr", 10, 415)],
    statusHistory: [{ at: dAgo(0), status: "draft", by: "Ananya Rao" }, { at: dAgo(0), status: "pending_approval", by: "Ananya Rao", note: "Coffee beans low at cafe" }],
    receiptIds: [], notes: "Coffee beans critically low — needs approval today.", createdAt: dAgo(0), updatedAt: dAgo(0),
  },
  {
    id: "po_10", poNumber: "PO-0010", supplierId: "sup_clean", outletId: "out_resto",
    orderDate: day(0), expectedDate: dayAhead(4), status: "draft", createdBy: "Vikram Shah",
    lines: [poLine("itm_dishwash", 20, 630), poLine("itm_sanitiser", 12, 215)],
    statusHistory: [{ at: dAgo(0), status: "draft", by: "Vikram Shah" }],
    receiptIds: [], notes: "", createdAt: dAgo(0), updatedAt: dAgo(0),
  },
  {
    id: "po_11", poNumber: "PO-0011", supplierId: "sup_sea", outletId: "out_resto",
    orderDate: day(20), expectedDate: day(18), status: "cancelled", createdBy: "Vikram Shah",
    lines: [poLine("itm_prawns", 15, 420), poLine("itm_fish", 15, 310)],
    statusHistory: [{ at: dAgo(20), status: "draft", by: "Vikram Shah" }, { at: dAgo(20), status: "approved", by: "Owner" }, { at: dAgo(19), status: "cancelled", by: "Owner", note: "Supplier unable to fulfil — cold chain issue" }],
    receiptIds: [], cancelReason: "Supplier cold-chain failure; rescheduled to next week.", notes: "", createdAt: dAgo(20), updatedAt: dAgo(19),
  },
];

const receipts: GoodsReceipt[] = [
  {
    id: "grn_1", grnNumber: "GRN-0001", poId: "po_1", supplierId: "sup_fresh", outletId: "out_wh",
    receivedAt: dAgo(73), receivedBy: "Rahul Menon",
    lines: [
      { lineId: "ln_itm_onion_100", itemId: "itm_onion", orderedQty: 100, receivedQty: 100, damagedQty: 0, acceptedQty: 100, unitCost: 31, batchNo: "FC-ON-101", expiryDate: dayAhead(18) },
      { lineId: "ln_itm_tomato_80", itemId: "itm_tomato", orderedQty: 80, receivedQty: 78, damagedQty: 2, acceptedQty: 78, unitCost: 27, batchNo: "FC-TO-102", expiryDate: dayAhead(5) },
      { lineId: "ln_itm_lemon_30", itemId: "itm_lemon", orderedQty: 30, receivedQty: 30, damagedQty: 0, acceptedQty: 30, unitCost: 36, batchNo: "FC-LM-103", expiryDate: dayAhead(10) },
    ],
    notes: "2 kg tomatoes rejected (bruised).", createdAt: dAgo(73),
  },
];

const counts: StockCount[] = [
  {
    id: "cnt_1", countNumber: "SC-0001", outletId: "out_cafe", categoryIds: [CAT_IDS.dairy, CAT_IDS.coffee],
    status: "finalized", createdAt: dAgo(30), createdBy: "Ananya Rao", finalizedAt: dAgo(30), finalizedBy: "Ananya Rao",
    lines: [
      { itemId: "itm_milk", expected: 24, counted: 22.5, variance: -1.5, note: "Spillage during opening" },
      { itemId: "itm_butter", expected: 6, counted: 6, variance: 0, note: "" },
      { itemId: "itm_coffee_beans", expected: 12, counted: 11.4, variance: -0.6, note: "Calibration wastage" },
      { itemId: "itm_tea_leaves", expected: 3.5, counted: 3.5, variance: 0, note: "" },
    ],
  },
  {
    id: "cnt_2", countNumber: "SC-0002", outletId: "out_bar", categoryIds: [CAT_IDS.alcohol],
    status: "finalized", createdAt: dAgo(15), createdBy: "Meera Kapoor", finalizedAt: dAgo(15), finalizedBy: "Meera Kapoor",
    lines: [
      { itemId: "itm_gin", expected: 6, counted: 5, variance: -1, note: "Free pour discrepancy" },
      { itemId: "itm_vodka", expected: 6, counted: 6, variance: 0, note: "" },
      { itemId: "itm_beer", expected: 48, counted: 47, variance: -1, note: "Breakage" },
    ],
  },
  {
    id: "cnt_3", countNumber: "SC-0003", outletId: "out_resto", categoryIds: [CAT_IDS.dry, CAT_IDS.meat],
    status: "draft", createdAt: dAgo(2), createdBy: "Vikram Shah",
    lines: [
      { itemId: "itm_maida", expected: 28, counted: null, variance: 0, note: "" },
      { itemId: "itm_rice", expected: 26, counted: null, variance: 0, note: "" },
      { itemId: "itm_oil", expected: 18, counted: null, variance: 0, note: "" },
      { itemId: "itm_chicken_leg", expected: 8, counted: null, variance: 0, note: "" },
      { itemId: "itm_sugar", expected: 10, counted: null, variance: 0, note: "" },
    ],
  },
];

const transfers: StockTransfer[] = [
  {
    id: "trf_1", transferNumber: "TRF-0001", fromLocationId: "loc_wh_bar", toLocationId: "loc_bar_bar",
    fromOutletId: "out_wh", toOutletId: "out_bar",
    lines: [{ itemId: "itm_gin", qty: 6, receivedQty: 6 }, { itemId: "itm_vodka", qty: 6, receivedQty: 6 }],
    status: "received", createdAt: dAgo(35), createdBy: "Rahul Menon", dispatchedAt: dAgo(34), receivedAt: dAgo(33),
    notes: "Monthly bar restock.",
  },
  {
    id: "trf_2", transferNumber: "TRF-0002", fromLocationId: "loc_wh_cold", toLocationId: "loc_bar_cold",
    fromOutletId: "out_wh", toOutletId: "out_bar",
    lines: [{ itemId: "itm_beer", qty: 24, receivedQty: 24 }],
    status: "received", createdAt: dAgo(15), createdBy: "Rahul Menon", dispatchedAt: dAgo(14), receivedAt: dAgo(14),
    notes: "",
  },
  {
    id: "trf_3", transferNumber: "TRF-0003", fromLocationId: "loc_wh_dry", toLocationId: "loc_resto_dry",
    fromOutletId: "out_wh", toOutletId: "out_resto",
    lines: [{ itemId: "itm_maida", qty: 50, receivedQty: 49, damagedQty: 1 }, { itemId: "itm_sugar", qty: 25, receivedQty: 25 }],
    status: "received", createdAt: dAgo(25), createdBy: "Rahul Menon", dispatchedAt: dAgo(24), receivedAt: dAgo(24),
    notes: "One maida bag torn in transit — recorded as damaged.",
  },
  {
    id: "trf_4", transferNumber: "TRF-0004", fromLocationId: "loc_wh_dry", toLocationId: "loc_cafe_dry",
    fromOutletId: "out_wh", toOutletId: "out_cafe",
    lines: [{ itemId: "itm_sugar", qty: 20 }],
    status: "dispatched", createdAt: dAgo(3), createdBy: "Rahul Menon", dispatchedAt: dAgo(2),
    notes: "Awaiting cafe confirmation.",
  },
  {
    id: "trf_5", transferNumber: "TRF-0005", fromLocationId: "loc_wh_cold", toLocationId: "loc_resto_cold",
    fromOutletId: "out_wh", toOutletId: "out_resto",
    lines: [{ itemId: "itm_cheese_mo", qty: 8 }, { itemId: "itm_cream", qty: 12 }],
    status: "approved", createdAt: dAgo(1), createdBy: "Vikram Shah",
    notes: "Weekend prep support.",
  },
  {
    id: "trf_6", transferNumber: "TRF-0006", fromLocationId: "loc_wh_pack", toLocationId: "loc_resto_dry",
    fromOutletId: "out_wh", toOutletId: "out_resto",
    lines: [{ itemId: "itm_container", qty: 400 }],
    status: "pending", createdAt: dAgo(0), createdBy: "Vikram Shah",
    notes: "Takeaway containers for weekend rush.",
  },
  {
    id: "trf_7", transferNumber: "TRF-0007", fromLocationId: "loc_cafe_cold", toLocationId: "loc_resto_cold",
    fromOutletId: "out_cafe", toOutletId: "out_resto",
    lines: [{ itemId: "itm_milk", qty: 4 }],
    status: "draft", createdAt: dAgo(0), createdBy: "Ananya Rao",
    notes: "Cafe surplus milk.",
  },
];

/* -------- recipes + menu -------- */

const menuItems: MenuItem[] = [
  { id: "mi_cappuccino", name: "Cappuccino", sku: "CF-001", category: "Coffee", sellingPrice: 180, recipeId: "rc_cappuccino", available: true, active: true },
  { id: "mi_iced_latte", name: "Iced Latte", sku: "CF-002", category: "Coffee", sellingPrice: 210, recipeId: "rc_iced_latte", available: true, active: true },
  { id: "mi_burger", name: "Chicken Burger", sku: "BG-001", category: "Burgers & Sandwiches", sellingPrice: 260, recipeId: "rc_burger", available: true, active: true },
  { id: "mi_pizza", name: "Margherita Pizza", sku: "PZ-001", category: "Pizza & Pasta", sellingPrice: 320, recipeId: "rc_pizza", available: true, active: true },
  { id: "mi_tikka", name: "Paneer Tikka", sku: "MC-001", category: "Starters", sellingPrice: 290, recipeId: "rc_tikka", available: true, active: true },
  { id: "mi_fries", name: "French Fries", sku: "ST-001", category: "Starters", sellingPrice: 150, recipeId: "rc_fries", available: true, active: true },
  { id: "mi_mojito", name: "Mojito", sku: "MK-001", category: "Mocktails", sellingPrice: 190, recipeId: "rc_mojito", available: true, active: true },
  { id: "mi_cocktail", name: "Urban Signature Cocktail", sku: "CK-001", category: "Cocktails", sellingPrice: 450, recipeId: "rc_cocktail", available: true, active: true },
  { id: "mi_alfredo", name: "Pasta Alfredo", sku: "PS-001", category: "Pizza & Pasta", sellingPrice: 340, recipeId: "rc_alfredo", available: true, active: true },
  { id: "mi_caesar", name: "Caesar Salad", sku: "SL-001", category: "Starters", sellingPrice: 240, recipeId: "rc_caesar", available: true, active: true },
  { id: "mi_brownie", name: "Chocolate Brownie", sku: "DS-001", category: "Desserts", sellingPrice: 170, recipeId: "rc_brownie", available: true, active: true },
  { id: "mi_lime_soda", name: "Fresh Lime Soda", sku: "MK-002", category: "Mocktails", sellingPrice: 120, recipeId: "rc_lime_soda", available: true, active: true },
];

const recipes: Recipe[] = [
  {
    id: "rc_cappuccino", name: "Cappuccino", menuItemId: "mi_cappuccino",
    ingredients: [
      { itemId: "itm_coffee_beans", qty: 18 },
      { itemId: "itm_milk", qty: 150 },
      { itemId: "itm_sugar", qty: 8 },
    ],
    yieldQty: 1, yieldUnit: "cup", portionSize: "180 ml", notes: "Double shot, microfoam.",
    sellingPrice: 180, targetFoodCostPct: 22, active: true,
  },
  {
    id: "rc_iced_latte", name: "Iced Latte", menuItemId: "mi_iced_latte",
    ingredients: [
      { itemId: "itm_coffee_beans", qty: 18 },
      { itemId: "itm_milk", qty: 180 },
      { itemId: "itm_sugar", qty: 10 },
    ],
    yieldQty: 1, yieldUnit: "glass", portionSize: "250 ml", notes: "Pour over ice.",
    sellingPrice: 210, targetFoodCostPct: 22, active: true,
  },
  {
    id: "rc_burger", name: "Chicken Burger", menuItemId: "mi_burger",
    ingredients: [
      { itemId: "itm_chicken_breast", qty: 0.15 },
      { itemId: "itm_bread", qty: 1 },
      { itemId: "itm_cheese_proc", qty: 1 },
      { itemId: "itm_lettuce", qty: 0.03 },
      { itemId: "itm_tomato", qty: 0.04 },
      { itemId: "itm_oil", qty: 0.02 },
    ],
    yieldQty: 1, yieldUnit: "burger", portionSize: "280 g", notes: "Grill chicken, toast bun.",
    sellingPrice: 260, targetFoodCostPct: 28, active: true,
  },
  {
    id: "rc_pizza", name: "Margherita Pizza", menuItemId: "mi_pizza",
    ingredients: [
      { itemId: "itm_pizza_base", qty: 1 },
      { itemId: "itm_cheese_mo", qty: 0.12 },
      { itemId: "itm_tomato", qty: 0.1 },
      { itemId: "itm_italian_seasoning", qty: 5 },
      { itemId: "itm_oil", qty: 0.01 },
    ],
    yieldQty: 1, yieldUnit: "pizza", portionSize: "10 inch", notes: "Wood-fired style, 250°C.",
    sellingPrice: 320, targetFoodCostPct: 26, active: true,
  },
  {
    id: "rc_tikka", name: "Paneer Tikka", menuItemId: "mi_tikka",
    ingredients: [
      { itemId: "itm_paneer", qty: 0.2 },
      { itemId: "itm_yogurt", qty: 0.05 },
      { itemId: "itm_capsicum", qty: 0.05 },
      { itemId: "itm_onion", qty: 0.05 },
      { itemId: "itm_italian_seasoning", qty: 3 },
    ],
    yieldQty: 1, yieldUnit: "plate", portionSize: "8 pieces", notes: "Marinate 4 hrs, char-grill.",
    sellingPrice: 290, targetFoodCostPct: 28, active: true,
  },
  {
    id: "rc_fries", name: "French Fries", menuItemId: "mi_fries",
    ingredients: [
      { itemId: "itm_fries", qty: 0.2 },
      { itemId: "itm_salt", qty: 0.005 },
      { itemId: "itm_oil", qty: 0.02 },
    ],
    yieldQty: 1, yieldUnit: "portion", portionSize: "200 g", notes: "Fry at 175°C for 3 min.",
    sellingPrice: 150, targetFoodCostPct: 22, active: true,
  },
  {
    id: "rc_mojito", name: "Mojito", menuItemId: "mi_mojito",
    ingredients: [
      { itemId: "itm_white_rum", qty: 45 },
      { itemId: "itm_lemon", qty: 0.05 },
      { itemId: "itm_mint", qty: 0.01 },
      { itemId: "itm_soda", qty: 120 },
      { itemId: "itm_sugar", qty: 10 },
    ],
    yieldQty: 1, yieldUnit: "glass", portionSize: "280 ml", notes: "Muddle mint, build in glass.",
    sellingPrice: 190, targetFoodCostPct: 24, active: true,
  },
  {
    id: "rc_cocktail", name: "Urban Signature Cocktail", menuItemId: "mi_cocktail",
    ingredients: [
      { itemId: "itm_vodka", qty: 45 },
      { itemId: "itm_gin", qty: 20 },
      { itemId: "itm_syrup", qty: 20 },
      { itemId: "itm_lemon", qty: 0.04 },
      { itemId: "itm_soda", qty: 60 },
    ],
    yieldQty: 1, yieldUnit: "glass", portionSize: "160 ml", notes: "Shake, strain, coupe glass.",
    sellingPrice: 450, targetFoodCostPct: 22, active: true,
  },
  {
    id: "rc_alfredo", name: "Pasta Alfredo", menuItemId: "mi_alfredo",
    ingredients: [
      { itemId: "itm_pasta", qty: 0.15 },
      { itemId: "itm_cream", qty: 0.12 },
      { itemId: "itm_butter", qty: 0.03 },
      { itemId: "itm_cheese_mo", qty: 0.03 },
      { itemId: "itm_italian_seasoning", qty: 4 },
    ],
    yieldQty: 1, yieldUnit: "plate", portionSize: "320 g", notes: "Toss pasta in sauce, finish with cheese.",
    sellingPrice: 340, targetFoodCostPct: 26, active: true,
  },
  {
    id: "rc_caesar", name: "Caesar Salad", menuItemId: "mi_caesar",
    ingredients: [
      { itemId: "itm_lettuce", qty: 0.15 },
      { itemId: "itm_chicken_breast", qty: 0.1 },
      { itemId: "itm_bread", qty: 1 },
      { itemId: "itm_cheese_proc", qty: 1 },
    ],
    yieldQty: 1, yieldUnit: "bowl", portionSize: "250 g", notes: "Grilled chicken, croutons, caesar dressing.",
    sellingPrice: 240, targetFoodCostPct: 28, active: true,
  },
  {
    id: "rc_brownie", name: "Chocolate Brownie", menuItemId: "mi_brownie",
    ingredients: [
      { itemId: "itm_brownie", qty: 1 },
    ],
    yieldQty: 1, yieldUnit: "slice", portionSize: "120 g", notes: "Warm 90s, serve with cream.",
    sellingPrice: 170, targetFoodCostPct: 22, active: true,
  },
  {
    id: "rc_lime_soda", name: "Fresh Lime Soda", menuItemId: "mi_lime_soda",
    ingredients: [
      { itemId: "itm_lemon", qty: 0.05 },
      { itemId: "itm_soda", qty: 200 },
      { itemId: "itm_sugar", qty: 15 },
      { itemId: "itm_salt", qty: 0.002 },
    ],
    yieldQty: 1, yieldUnit: "glass", portionSize: "250 ml", notes: "Sweet-salt balance as ordered.",
    sellingPrice: 120, targetFoodCostPct: 18, active: true,
  },
];

const invoices: SupplierInvoice[] = [
  { id: "inv_1", invoiceNumber: "INV-2201", supplierId: "sup_fresh", poId: "po_1", invoiceDate: day(73), dueDate: day(58), subtotal: 8156, tax: 407.8, total: 8563.8, paid: 8563.8, status: "paid", notes: "", payments: [{ id: "pay_1", at: dAgo(60), amount: 8563.8, mode: "Bank Transfer", notes: "Net 15 settled" }] },
  { id: "inv_2", invoiceNumber: "INV-2202", supplierId: "sup_dairy", poId: "po_2", invoiceDate: day(68), dueDate: day(61), subtotal: 22212, tax: 1110.6, total: 23322.6, paid: 23322.6, status: "paid", notes: "", payments: [{ id: "pay_2", at: dAgo(62), amount: 23322.6, mode: "Bank Transfer", notes: "" }] },
  { id: "inv_3", invoiceNumber: "INV-2203", supplierId: "sup_bakery", poId: "po_3", invoiceDate: day(63), dueDate: day(56), subtotal: 2292, tax: 114.6, total: 2406.6, paid: 2406.6, status: "paid", notes: "", payments: [{ id: "pay_3", at: dAgo(58), amount: 2406.6, mode: "UPI", notes: "" }] },
  { id: "inv_4", invoiceNumber: "INV-2204", supplierId: "sup_meat", poId: "po_4", invoiceDate: day(56), dueDate: day(41), subtotal: 18130, tax: 906.5, total: 19036.5, paid: 19036.5, status: "paid", notes: "", payments: [{ id: "pay_4", at: dAgo(45), amount: 19036.5, mode: "Bank Transfer", notes: "" }] },
  { id: "inv_5", invoiceNumber: "INV-2205", supplierId: "sup_liquor", poId: "po_5", invoiceDate: day(46), dueDate: day(16), subtotal: 47136, tax: 5656.32, total: 52792.32, paid: 30000, status: "partially_paid", notes: "Balance due on 20th.", payments: [{ id: "pay_5", at: dAgo(40), amount: 30000, mode: "Bank Transfer", notes: "Part payment" }] },
  { id: "inv_6", invoiceNumber: "INV-2206", supplierId: "sup_pack", poId: "po_6", invoiceDate: day(39), dueDate: day(9), subtotal: 8230, tax: 411.5, total: 8641.5, paid: 0, status: "overdue", notes: "Partial delivery — invoiced for cups & lids only.", payments: [] },
  { id: "inv_7", invoiceNumber: "INV-2207", supplierId: "sup_bev", poId: undefined, invoiceDate: day(12), dueDate: dayAhead(18), subtotal: 34500, tax: 1725, total: 36225, paid: 36225, status: "paid", notes: "Spot purchase — soda & cola restock.", payments: [{ id: "pay_7", at: dAgo(10), amount: 36225, mode: "Cheque", notes: "" }] },
  { id: "inv_8", invoiceNumber: "INV-2208", supplierId: "sup_dry", poId: undefined, invoiceDate: day(4), dueDate: dayAhead(26), subtotal: 27350, tax: 1367.5, total: 28717.5, paid: 0, status: "unpaid", notes: "Monthly dry goods replenishment.", payments: [] },
];

const team: TeamMember[] = [
  { id: "usr_1", name: "Arjun Nair", email: "arjun@theurbantable.in", role: "Owner", outletIds: [OUTLET_IDS.cafe, OUTLET_IDS.resto, OUTLET_IDS.bar, OUTLET_IDS.wh], status: "active", lastActive: dAgo(0) },
  { id: "usr_2", name: "Rahul Menon", email: "rahul@theurbantable.in", role: "Inventory Manager", outletIds: [OUTLET_IDS.wh], status: "active", lastActive: dAgo(0) },
  { id: "usr_3", name: "Ananya Rao", email: "ananya@theurbantable.in", role: "Outlet Manager", outletIds: [OUTLET_IDS.cafe], status: "active", lastActive: dAgo(0) },
  { id: "usr_4", name: "Vikram Shah", email: "vikram@theurbantable.in", role: "Outlet Manager", outletIds: [OUTLET_IDS.resto], status: "active", lastActive: dAgo(1) },
  { id: "usr_5", name: "Meera Kapoor", email: "meera@theurbantable.in", role: "Outlet Manager", outletIds: [OUTLET_IDS.bar], status: "active", lastActive: dAgo(0) },
  { id: "usr_6", name: "Sanjay Pillai", email: "sanjay@theurbantable.in", role: "Purchasing Manager", outletIds: [OUTLET_IDS.wh, OUTLET_IDS.resto], status: "active", lastActive: dAgo(2) },
  { id: "usr_7", name: "Chef Ravi", email: "ravi@theurbantable.in", role: "Staff / Viewer", outletIds: [OUTLET_IDS.resto], status: "active", lastActive: dAgo(1) },
  { id: "usr_8", name: "Priya Das", email: "priya@theurbantable.in", role: "Admin", outletIds: [OUTLET_IDS.cafe, OUTLET_IDS.resto], status: "active", lastActive: dAgo(3) },
  { id: "usr_9", name: "Kabir Sethi", email: "kabir@theurbantable.in", role: "Staff / Viewer", outletIds: [OUTLET_IDS.bar], status: "invited", lastActive: dAgo(5) },
];

const settings: AppSettings = {
  profile: {
    name: "The Urban Table",
    legalName: "Urban Table Hospitality Pvt Ltd",
    email: "hello@theurbantable.in",
    phone: "+91 80 4123 5566",
    address: "14 MG Road, Bengaluru, Karnataka 560001",
    gstin: "29AABCU9603R1ZX",
    currency: "INR",
    timezone: "Asia/Kolkata",
  },
  inventory: {
    defaultMinStock: 10,
    costingMethod: "weighted_average",
    expiryAlertDays: 10,
    lowStockNotifications: true,
    defaultBaseUnit: "kg",
  },
  procurement: {
    requireApproval: true,
    defaultLeadTimeDays: 3,
    poPrefix: "PO",
    poNextNumber: 12,
    grnPrefix: "GRN",
    grnNextNumber: 2,
  },
  notifications: { lowStock: true, expiringStock: true, purchaseApprovals: true, pendingReceipts: true },
  appearance: { theme: "light", density: "comfortable" },
};

const notifications: NotificationRec[] = [
  { id: "ntf_1", kind: "po_approval", title: "PO-0009 awaiting approval", body: "BlueWave Beverages order for coffee beans needs owner approval.", link: "/purchase-orders/po_9", at: dAgo(0), read: false },
  { id: "ntf_2", kind: "low_stock", title: "Coffee beans low at Downtown Cafe", body: "Arabica Coffee Beans are at 12 kg against a 10 kg minimum.", link: "/inventory/itm_coffee_beans", at: dAgo(0), read: false },
  { id: "ntf_3", kind: "expiring", title: "Milk batch expiring in 2 days", body: "Batch ND-2210-B (18 L) at Downtown Cafe expires soon.", link: "/stock-movements", at: dAgo(0), read: false },
  { id: "ntf_4", kind: "invoice_overdue", title: "Invoice INV-2206 overdue", body: "EcoServe Packaging bill of ₹8,641.50 was due 9 days ago.", link: "/invoices", at: dAgo(1), read: false },
  { id: "ntf_5", kind: "transfer_pending", title: "TRF-0006 awaiting approval", body: "400 takeaway containers requested from warehouse to Riverside.", link: "/transfers", at: dAgo(0), read: false },
  { id: "ntf_6", kind: "out_of_stock", title: "Zero stock: processed cheese slices", body: "Downtown Cafe has no processed cheese slices in stock.", link: "/inventory/itm_cheese_proc", at: dAgo(2), read: true },
  { id: "ntf_7", kind: "low_stock", title: "Lettuce below minimum at Riverside", body: "Iceberg lettuce is 3.5 kg against a 6 kg minimum.", link: "/inventory/itm_lettuce", at: dAgo(1), read: true },
  { id: "ntf_8", kind: "po_approval", title: "PO-0008 approved — ready to order", body: "Dairy restock approved; mark as ordered with Nandini Dairy.", link: "/purchase-orders/po_8", at: dAgo(1), read: true },
];

export function buildSeed(): DBShape {
  return {
    v: 2,
    seededAt: now.toISOString(),
    updatedAt: now.toISOString(),
    outlets,
    storageLocations: locations,
    categories,
    suppliers,
    items,
    balances,
    batches,
    movements,
    purchaseOrders,
    receipts,
    counts,
    waste,
    transfers,
    recipes,
    menuItems,
    invoices,
    notifications,
    team,
    settings,
  };
}
