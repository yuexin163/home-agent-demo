"use client";

import Link from "next/link";
import { useRenovationPlan } from "@/src/components/RenovationPlanProvider";
import type { SelectionSlot } from "@/src/types/content";

interface PlanProductActionProps {
  productId: string;
  slot: SelectionSlot;
  compact?: boolean;
}

export function PlanProductAction({ productId, slot, compact = false }: PlanProductActionProps) {
  const { addItem, getItemBySlot, hydrated } = useRenovationPlan();
  const current = getItemBySlot(slot.id);
  const isSelected = current?.productId === productId;
  const willReplace = Boolean(current && !isSelected);

  const handleSelect = () => {
    if (willReplace && !window.confirm(`“${slot.name}”已经选择了其他商品，是否替换为当前商品？`)) return;
    addItem({ slotId: slot.id, spaceId: slot.spaceId, productId });
  };

  if (!hydrated) {
    return <span className={`block animate-pulse rounded-full bg-stone-100 ${compact ? "h-10" : "h-14"}`} aria-hidden="true" />;
  }

  if (isSelected) {
    return compact ? (
      <span className="status-success inline-flex w-full items-center justify-center rounded-[10px] px-4 py-2.5 text-xs font-medium">✓ 已选择</span>
    ) : (
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <span className="status-success rounded-[12px] px-5 py-4 text-sm font-medium">✓ 已加入我的装修方案</span>
        <Link href="/my-plan" className="rounded-[12px] border border-emerald-700 px-5 py-4 text-center text-sm font-medium text-emerald-900 hover:bg-emerald-50">查看方案</Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSelect}
      className={`${compact ? "w-full rounded-[10px] px-4 py-2.5 text-xs" : "w-full rounded-[12px] px-5 py-4 text-sm"} action-primary font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700`}
    >
      {willReplace ? `替换${slot.name}当前选择` : "加入我的装修方案"}
    </button>
  );
}
