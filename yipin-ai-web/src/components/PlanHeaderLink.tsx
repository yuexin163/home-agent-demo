"use client";

import Link from "next/link";
import { useRenovationPlan } from "@/src/components/RenovationPlanProvider";

export function PlanHeaderLink() {
  const { items, hydrated } = useRenovationPlan();

  return (
    <Link href="/my-plan" className="action-primary relative rounded-[10px] px-3 py-2">
      <span className="sm:hidden">方案</span>
      <span className="hidden sm:inline">我的装修方案</span>
      {hydrated && items.length > 0 ? <span className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-semibold text-emerald-900">{items.length}</span> : null}
    </Link>
  );
}
