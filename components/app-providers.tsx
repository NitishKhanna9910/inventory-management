"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreContext, useStore, type StoreApi } from "@/lib/store";
import * as React from "react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const store = useStore();
  return (
    <StoreContext.Provider value={store}>
      <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
    </StoreContext.Provider>
  );
}
