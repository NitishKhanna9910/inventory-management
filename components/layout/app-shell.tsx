"use client";

import { DemoBadge, DemoScenarios, GlobalSearch, HelpPanel } from "@/components/shared/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { sel, useStore } from "@/lib/store";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChefHat,
  ClipboardList,
  ClipboardCheck,
  FileText,
  FlaskConical,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Package,
  PackageOpen,
  Receipt,
  ScrollText,
  Search,
  Settings as SettingsIcon,
  ShoppingBasket,
  ShoppingCart,
  Tags,
  TrendingUp,
  Trash2,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

const NAV: { section: string; items: { label: string; href: string; icon: React.ElementType }[] }[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Inventory",
    items: [
      { label: "Stock Overview", href: "/inventory", icon: Package },
      { label: "Ingredients & Items", href: "/inventory/items", icon: ShoppingBasket },
      { label: "Categories", href: "/categories", icon: Tags },
      { label: "Stock Movements", href: "/stock-movements", icon: ScrollText },
      { label: "Stock Counts", href: "/stock-counts", icon: ClipboardCheck },
      { label: "Waste & Spoilage", href: "/waste", icon: Trash2 },
    ],
  },
  {
    section: "Procurement",
    items: [
      { label: "Suppliers", href: "/suppliers", icon: Truck },
      { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
      { label: "Goods Receiving", href: "/receiving", icon: PackageOpen },
      { label: "Invoices & Bills", href: "/invoices", icon: Receipt },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Recipes & Costing", href: "/recipes", icon: ChefHat },
      { label: "Menu Items", href: "/menu", icon: ClipboardList },
      { label: "Locations & Warehouses", href: "/locations", icon: Warehouse },
      { label: "Transfers", href: "/transfers", icon: Truck },
    ],
  },
  {
    section: "Analytics",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Forecasting", href: "/forecasting", icon: TrendingUp },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "Team & Roles", href: "/team", icon: Users },
      { label: "Settings", href: "/settings", icon: SettingsIcon },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { db } = useStore();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Package className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-white">StockPilot</p>
          <p className="truncate text-[10px] leading-tight text-sidebar-muted">
            Restaurant Inventory &amp; Operations
          </p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-hover/60 p-2">
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
            Business
          </p>
          <p className="px-1 text-[13px] font-medium text-white">{db.settings.profile.name}</p>
          <p className="px-1 text-[10px] text-sidebar-muted">
            {db.outlets.length} locations · {db.items.filter((i) => i.status === "active").length} items
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors",
                        active
                          ? "bg-sidebar-active font-medium text-white"
                          : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
                      )}
                    >
                      <item.icon className={cn("size-4 shrink-0", active ? "text-sidebar-accent" : "text-sidebar-muted")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <DemoBadge />
        <p className="mt-1.5 text-[10px] leading-relaxed text-sidebar-muted">
          Frontend demo · data stored locally in your browser
        </p>
      </div>
    </div>
  );
}

function NotificationBell() {
  const { db, update } = useStore();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const unread = db.notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        className="relative"
      >
        <Bell />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      notifications: d.notifications.map((n) => ({ ...n, read: true })),
                    }))
                  }
                >
                  Mark all read
                </Button>
                <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => setOpen(false)} aria-label="Close notifications">
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
              {db.notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications.</p>
              ) : (
                db.notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      update((d) => ({
                        ...d,
                        notifications: d.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
                      }));
                      setOpen(false);
                      router.push(n.link);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent",
                      !n.read && "bg-primary/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.read ? "bg-border" : "bg-primary"
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-tight">{n.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{n.body}</span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {new Date(n.at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ·{" "}
                        {new Date(n.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { db, update } = useStore();
  const [outlet, setOutlet] = React.useState("all");

  const changeOutlet = (v: string) => {
    setOutlet(v);
    window.dispatchEvent(new CustomEvent("stockpilot:outlet", { detail: v }));
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/95 px-3 backdrop-blur sm:px-5">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu />
      </Button>
      <div className="relative hidden min-w-0 flex-1 max-w-md sm:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          readOnly
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true }))}
          placeholder="Search items, SKUs, POs…  (Ctrl+K)"
          className="h-8 cursor-pointer bg-muted/50 pl-8 text-[13px] shadow-none"
          aria-label="Open global search"
        />
      </div>
      <div className="flex-1 sm:hidden" />
      <Select value={outlet} onValueChange={changeOutlet}>
        <SelectTrigger className="h-8 w-[150px] text-xs sm:w-[180px]" aria-label="Current outlet">
          <Building2 className="size-3.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All outlets</SelectItem>
          {db.outlets.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DemoScenarios />
      <NotificationBell />
      <HelpPanel />
      <div className="flex items-center gap-2 pl-1">
        <Avatar className="size-8">
          <AvatarFallback>AN</AvatarFallback>
        </Avatar>
        <div className="hidden leading-tight md:block">
          <p className="text-[13px] font-medium">Arjun Nair</p>
          <p className="text-[10px] text-muted-foreground">Owner</p>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-64 bg-sidebar shadow-xl">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-3 rounded-md p-1 text-sidebar-muted hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-60">
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-3 py-4 sm:px-5 sm:py-6">{children}</main>
        <footer className="border-t px-5 py-3 text-[11px] text-muted-foreground">
          StockPilot demo · Data persists in your browser (localStorage) · No backend connected
        </footer>
      </div>
      <GlobalSearch />
    </div>
  );
}
