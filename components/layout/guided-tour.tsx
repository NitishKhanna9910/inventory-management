"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChefHat,
  HelpCircle,
  Lightbulb,
  Package,
  RotateCcw,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

type TourStep = {
  id: string;
  title: string;
  body: string;
  selector?: string; // CSS selector for spotlight target
  position?: "top" | "bottom" | "left" | "right";
  icon?: React.ElementType;
  href?: string;
  hrefLabel?: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to StockPilot! 🎉",
    body: "Let's take a quick tour of your inventory management system. This 90-second walkthrough will show you the key features.",
    icon: Lightbulb,
  },
  {
    id: "sidebar",
    title: "Navigation Sidebar",
    body: "All your modules are here — Inventory, Procurement, Operations, Analytics. Click any link to jump to that section.",
    selector: 'aside',
    position: "right",
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    body: "Your home screen shows key metrics — stock value, low-stock alerts, pending POs, waste trends. Everything updates in real-time.",
    selector: 'main h1',
    position: "bottom",
    icon: Package,
    href: "/",
    hrefLabel: "Go to Dashboard",
  },
  {
    id: "inventory",
    title: "Inventory Management",
    body: "View all items, check stock levels, see what's running low. Stock changes only when you perform operations (receiving, waste, transfers).",
    selector: 'a[href="/inventory"]',
    position: "right",
    icon: Package,
    href: "/inventory",
    hrefLabel: "View Inventory",
  },
  {
    id: "procurement",
    title: "Purchase Orders",
    body: "Create POs to order from suppliers. Track status: Draft → Approved → Ordered → Received. Stock increases ONLY after goods are received.",
    selector: 'a[href="/purchase-orders"]',
    position: "right",
    icon: ShoppingCart,
    href: "/purchase-orders",
    hrefLabel: "View Purchase Orders",
  },
  {
    id: "waste",
    title: "Waste Tracking",
    body: "Record expired/spoiled items. Waste immediately reduces stock and logs who recorded it and why. Great for accountability.",
    selector: 'a[href="/waste"]',
    position: "right",
    icon: Trash2,
    href: "/waste",
    hrefLabel: "Record Waste",
  },
  {
    id: "recipes",
    title: "Recipes & Costing",
    body: "Link ingredients to recipes to calculate true dish costs. See food cost % and profit margins for every menu item.",
    selector: 'a[href="/recipes"]',
    position: "right",
    icon: ChefHat,
    href: "/recipes",
    hrefLabel: "View Recipes",
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    body: "Stock valuation, spend by supplier, waste trends, reorder suggestions — all numbers come from your movement records.",
    selector: 'a[href="/reports"]',
    position: "right",
    icon: BarChart3,
    href: "/reports",
    hrefLabel: "View Reports",
  },
  {
    id: "help",
    title: "Need Help?",
    body: "Click the help icon (❓) anytime for quick explanations. Or visit the Product Walkthrough page for a detailed flow guide.",
    selector: 'button[aria-label="Help"]',
    position: "bottom",
    icon: HelpCircle,
    href: "/guide",
    hrefLabel: "Open Full Walkthrough",
  },
  {
    id: "done",
    title: "You're all set! ✅",
    body: "That's the basics. Explore the sidebar to dive deeper, or start with the Dashboard. Data saves automatically in your browser.",
    icon: CheckCircle2,
  },
];

const STORAGE_KEY = "stockpilot-tour-seen";

export function GuidedTour() {
  const [active, setActive] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement | null>(null);
  const [tooltipStyle, setTooltipStyle] = React.useState<React.CSSProperties>({
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 50,
    width: "380px",
    maxWidth: "calc(100vw - 2rem)",
  });

  // Auto-start on first visit
  React.useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Small delay to let page render
        const t = setTimeout(() => setActive(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage not available, start anyway
      setTimeout(() => setActive(true), 800);
    }
  }, []);

  const step = TOUR_STEPS[stepIndex];

  // Track spotlight target position
  React.useEffect(() => {
    if (!active || !step?.selector) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(step.selector!);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [active, step]);

  // Position tooltip after render — measure actual height, flip if it would overflow
  React.useLayoutEffect(() => {
    if (!active) return;

    const place = () => {
      const tip = tooltipRef.current;
      if (!tip) return;

      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const offset = 20;
      const margin = 12;

      let style: React.CSSProperties = {
        position: "fixed",
        zIndex: 50,
        width: "min(380px, calc(100vw - 2rem))",
      };

      if (!rect || !step?.selector) {
        // Centered fallback (welcome / done steps)
        style = {
          ...style,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
        setTooltipStyle(style);
        return;
      }

      const pos = step.position || "bottom";
      let top: number;
      let left: number;
      const transform = "";

      if (pos === "right" || pos === "left") {
        // Vertical placement, centered on target
        top = rect.top + rect.height / 2 - th / 2;
        top = Math.max(margin, Math.min(top, vh - th - margin));

        if (pos === "right") {
          left = rect.right + offset;
          if (left + tw > vw - margin) left = rect.left - offset - tw; // flip
          if (left < margin) left = margin;
        } else {
          left = rect.left - offset - tw;
          if (left < margin) left = rect.right + offset; // flip
          if (left + tw > vw - margin) left = vw - tw - margin;
        }
      } else {
        // top / bottom placement, centered horizontally
        left = rect.left + rect.width / 2 - tw / 2;
        left = Math.max(margin, Math.min(left, vw - tw - margin));

        if (pos === "bottom") {
          top = rect.bottom + offset;
          if (top + th > vh - margin) top = rect.top - offset - th; // flip above
          if (top < margin) top = margin;
        } else {
          top = rect.top - offset - th;
          if (top < margin) top = rect.bottom + offset; // flip below
          if (top + th > vh - margin) top = vh - th - margin;
        }
      }

      style = { ...style, top, left, transform };
      setTooltipStyle(style);
    };

    // Run after paint so offsetWidth/Height are accurate
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
    };
  }, [active, step, rect, stepIndex]);

  const next = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const finish = () => {
    setActive(false);
    setStepIndex(0);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const skip = () => {
    finish();
  };

  const restart = () => {
    setStepIndex(0);
    setActive(true);
  };

  if (!active) {
    // Floating restart button
    return (
      <button
        onClick={restart}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
        aria-label="Start guided tour"
        title="Start guided tour"
      >
        <RotateCcw className="h-5 w-5" />
      </button>
    );
  }

  const spotlightStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(5, 150, 105, 0.5)",
        border: "3px solid #059669",
        pointerEvents: "none",
        transition: "all 0.3s ease",
        zIndex: 40,
      }
    : {};

  const Icon = step.icon || Lightbulb;

  return (
    <>
      {/* Spotlight overlay */}
      {rect ? <div style={spotlightStyle} /> : <div className="fixed inset-0 z-40 bg-black/70" aria-hidden />}

      {/* Tooltip */}
      <div ref={tooltipRef} style={tooltipStyle} className="rounded-xl border bg-card p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Step {stepIndex + 1} of {TOUR_STEPS.length}
              </p>
              <h3 className="text-base font-semibold">{step.title}</h3>
            </div>
          </div>
          <button
            onClick={skip}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        {/* Progress bar */}
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={skip}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {step.href ? (
              <Button asChild variant="outline" size="sm">
                <Link href={step.href}>
                  {step.hrefLabel || "Go"} <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            ) : null}

            {stepIndex > 0 ? (
              <Button variant="ghost" size="sm" onClick={prev}>
                Back
              </Button>
            ) : null}

            <Button size="sm" onClick={next}>
              {stepIndex === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
              {stepIndex < TOUR_STEPS.length - 1 ? <ArrowRight className="ml-1 h-3 w-3" /> : null}
            </Button>
          </div>
        </div>
      </div>

      {/* Skip button (top-right, accessible) */}
      <button
        onClick={skip}
        className="fixed right-6 top-20 z-50 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg hover:bg-accent"
      >
        Skip
      </button>
    </>
  );
}
