"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface RenovationPlanItem {
  slotId: string;
  spaceId: string;
  productId: string;
  quantity: number;
  addedAt: string;
}

interface RenovationPlanContextValue {
  items: RenovationPlanItem[];
  hydrated: boolean;
  addItem: (item: Omit<RenovationPlanItem, "addedAt" | "quantity">) => void;
  updateQuantity: (slotId: string, quantity: number) => void;
  removeItem: (slotId: string) => void;
  clearPlan: () => void;
  getItemBySlot: (slotId: string) => RenovationPlanItem | undefined;
}

const STORAGE_KEY = "yipin-renovation-plan-v1";
const RenovationPlanContext = createContext<RenovationPlanContextValue | null>(null);

export function RenovationPlanProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<RenovationPlanItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.localStorage.removeItem(STORAGE_KEY);
    queueMicrotask(() => {
      if (cancelled) return;
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateItems = useCallback((updater: (current: RenovationPlanItem[]) => RenovationPlanItem[]) => {
    setItems((current) => updater(current));
  }, []);

  const addItem = useCallback((item: Omit<RenovationPlanItem, "addedAt" | "quantity">) => {
    updateItems((current) => {
      const existing = current.find((candidate) => candidate.slotId === item.slotId);
      return [
        ...current.filter((candidate) => candidate.slotId !== item.slotId),
        { ...item, quantity: existing?.quantity ?? 1, addedAt: new Date().toISOString() },
      ];
    });
  }, [updateItems]);

  const updateQuantity = useCallback((slotId: string, quantity: number) => {
    const normalized = Number.isFinite(quantity) ? Math.min(999, Math.max(1, Math.round(quantity * 10) / 10)) : 1;
    updateItems((current) => current.map((item) => item.slotId === slotId ? { ...item, quantity: normalized } : item));
  }, [updateItems]);

  const removeItem = useCallback((slotId: string) => {
    updateItems((current) => current.filter((item) => item.slotId !== slotId));
  }, [updateItems]);

  const clearPlan = useCallback(() => updateItems(() => []), [updateItems]);
  const getItemBySlot = useCallback((slotId: string) => items.find((item) => item.slotId === slotId), [items]);

  const value = useMemo(() => ({ items, hydrated, addItem, updateQuantity, removeItem, clearPlan, getItemBySlot }), [items, hydrated, addItem, updateQuantity, removeItem, clearPlan, getItemBySlot]);

  return (
    <RenovationPlanContext.Provider value={value}>
      {children}
    </RenovationPlanContext.Provider>
  );
}

export function useRenovationPlan() {
  const context = useContext(RenovationPlanContext);
  if (!context) throw new Error("useRenovationPlan must be used inside RenovationPlanProvider");
  return context;
}
