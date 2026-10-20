"use client";

import { useStore } from "@/lib/store";
import type { StoreApi } from "@/lib/store";

export function useAppStore(): StoreApi {
  return useStore();
}
