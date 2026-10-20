# StockPilot — Restaurant Inventory & Operations (Sample UI)

Frontend-only demo app for a restaurant / bar / cafe inventory management flow. Built with Next.js 15 (App Router), TypeScript, Tailwind v4 and shadcn-style components. **No backend, no auth, no API keys** — all data lives in the browser's `localStorage`.

> This build is a **sample UI to demonstrate the flow to a client**. Priority is that every page and button works and shows something; numbers are representative, not accounting-grade.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # production build (Vercel-ready)
```

## Routes (25)

| Area | Routes |
|------|--------|
| Overview | `/` (dashboard), `/guide` (product walkthrough) |
| Inventory | `/inventory`, `/inventory/items`, `/categories` |
| Operations | `/stock-movements`, `/stock-counts`, `/waste`, `/locations`, `/locations/[id]`, `/transfers` |
| Procurement | `/suppliers`, `/suppliers/[id]`, `/purchase-orders`, `/purchase-orders/[id]`, `/receiving`, `/invoices` |
| Menu & Recipes | `/recipes`, `/recipes/[id]`, `/menu` |
| Insights | `/reports`, `/forecasting` |
| Admin | `/team`, `/settings` |

Every sidebar link and primary action renders a real page — no blank screens or dead buttons.

The `/guide` page is an in-app guided walkthrough of the full end-to-end cycle (items → PO → receiving → stock → waste → counts → transfers → recipes → reports), with live stats pulled from the current data and jump-to-page buttons for each phase.

## Business rules demonstrated

- Stock only changes through explicit operations that emit movement records (receipts, waste, transfers, adjustments, recipe consumption).
- Creating a PO does **not** increase stock; only receiving does, and only by the accepted quantity (no duplicate receipts).
- Waste reduces stock; stock-count adjustments apply only after finalize.
- Transfers deduct at dispatch and add at receipt.
- Unit conversions (e.g. carton → bottles) and weighted-average cost on receipt.

## Seed data

"The Urban Table" demo dataset: 3 outlets + 1 warehouse, 13 categories, 40+ items, 9 suppliers, 12 menu items with recipes, 10 POs, 8 invoices, transfers and stock counts. Currency INR (₹), timezone Asia/Kolkata.

The store is versioned (`DB_VERSION`); if the version in `localStorage` is old the app backs it up and reseeds automatically. **Settings → Reset demo data** restores the seed.

## Architecture (short)

- `lib/` — domain layer: `types.ts`, `seed-data.ts`, `store.ts` (singleton DB + React context), `calculations.ts`, `ops.ts` (mutations), `utils.ts`.
- `components/pages/` — one file per screen; `components/ui/` — shadcn-style primitives; `components/layout/` — shell, page header, metric cards.
- Pages call ops functions with the `StoreApi` returned by `useStore()`; `saveDB` emits and components re-render.

## Known limitations (honest)

- **localStorage only** — data is per-browser, no sync between devices, clearing site data wipes changes (Settings has a reset).
- **No auth / roles enforcement** — the Team & Roles screen is display-only.
- **Numbers are representative** — valuations, forecasts and food-cost % are computed from seed data for illustration, not certified accounting figures.
- **Sample flows** — receiving fully books stock via the PO detail page; the Receiving screen links there. No barcode scanning, no email/notifications, no PDF exports (CSV export works on Reports).
- ESLint passes with warnings only (unused vars in a few files); build skips lint by config.

## Deploy

Static-friendly — `npm run build` succeeds and can be deployed to Vercel as-is.
