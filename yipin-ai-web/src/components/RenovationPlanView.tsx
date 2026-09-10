"use client";

import Link from "next/link";
import { ProductImage } from "@/src/components/ProductImage";
import { useRenovationPlan } from "@/src/components/RenovationPlanProvider";
import type { SelectionSlot, ShowcaseProduct, Space } from "@/src/types/content";

interface RenovationPlanViewProps {
  spaces: Space[];
  slots: SelectionSlot[];
  products: ShowcaseProduct[];
}

function getKnownPrice(product: ShowcaseProduct) {
  if (!product.priceLabel.includes("元") || product.priceLabel.includes("待确认") || product.displayPrice.includes("待")) return null;
  const value = Number(product.displayPrice.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function getQuantityUnit(product: ShowcaseProduct) {
  if (product.category === "地板") return "㎡";
  if (product.category === "厨房电器") return "台";
  return "件";
}

function formatCurrency(value: number) {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getSlotHref(slot: SelectionSlot) {
  return `/materials?space=${slot.spaceId}&slot=${slot.id}&category=${encodeURIComponent(slot.libraryCategory ?? "全部")}`;
}

export function RenovationPlanView({ spaces, slots, products }: RenovationPlanViewProps) {
  const { items, hydrated, updateQuantity, removeItem, clearPlan } = useRenovationPlan();
  const rowActionClass = "inline-flex h-9 min-w-16 appearance-none items-center justify-center whitespace-nowrap rounded-[9px] border px-3 text-[12px] font-medium leading-none transition";
  const selected = items.flatMap((item) => {
    const slot = slots.find((candidate) => candidate.id === item.slotId);
    const product = products.find((candidate) => candidate.id === item.productId);
    return slot && product ? [{ item, slot, product }] : [];
  });
  const knownLineTotals = selected.map(({ item, product }) => {
    const price = getKnownPrice(product);
    return price === null ? null : price * item.quantity;
  });
  const knownTotal = knownLineTotals.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const pendingPriceCount = knownLineTotals.filter((value) => value === null).length;
  const selectableSlots = slots.filter((slot) => slot.productIds.length > 0);
  const selectedSlotIds = new Set(selected.map(({ slot }) => slot.id));
  const missingSlots = selectableSlots.filter((slot) => !selectedSlotIds.has(slot.id));
  const overallProgress = selectableSlots.length > 0 ? Math.round((selected.length / selectableSlots.length) * 100) : 0;
  const completedSpaceCount = spaces.filter((space) => {
    const spaceSlots = selectableSlots.filter((slot) => slot.spaceId === space.id);
    return spaceSlots.length > 0 && spaceSlots.every((slot) => selectedSlotIds.has(slot.id));
  }).length;

  if (!hydrated) {
    return <div className="control-panel mt-8 min-h-96 animate-pulse" aria-label="正在读取我的装修方案" />;
  }

  if (selected.length === 0) {
    return (
      <section className="control-panel mt-8 grid min-h-[480px] place-items-center border-dashed p-8 text-center">
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-800">＋</span>
          <h1 className="mt-6 text-3xl font-medium tracking-tight text-stone-900">我的装修方案还是空的</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-stone-500">先选择一个空间，再从对应的材料或设备位中加入商品。每个设备位只能保留一款，后续可以随时替换。</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/materials?space=living-dining" className="action-primary rounded-[10px] px-5 py-3 text-sm">从客餐厅开始</Link>
            <Link href="/materials?space=kitchen" className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-700 hover:border-emerald-700">选择厨房设备</Link>
            <Link href="/materials?space=shared-bathroom" className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-700 hover:border-emerald-700">选择卫浴设备</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="plan-print-sheet control-panel mt-8 p-5 shadow-[0_24px_80px_rgba(0,0,0,.24)] sm:p-8 lg:p-10">
      <section className="grid gap-6 border-b border-stone-200 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-medium tracking-[.22em] text-emerald-700">MY RENOVATION PLAN</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-.045em] text-stone-900 sm:text-5xl">我的装修方案</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-500">装修清单按空间和设备位归集，便于集中核对产品、数量与配置关系。清单价格为产品资料标注价格，实际成交与施工费用以最终确认单为准。</p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-stone-200 text-center">
          <div className="min-w-24 bg-stone-50 p-4"><strong className="block text-2xl text-emerald-900">{selected.length}/{selectableSlots.length}</strong><span className="text-[10px] text-stone-500">已完成设备位</span></div>
          <div className="min-w-24 bg-stone-50 p-4"><strong className="block text-2xl text-emerald-900">{completedSpaceCount}/{spaces.length}</strong><span className="text-[10px] text-stone-500">已完成空间</span></div>
          <div className="min-w-24 bg-stone-50 p-4"><strong className="block text-2xl text-emerald-900">{pendingPriceCount}</strong><span className="text-[10px] text-stone-500">待询价</span></div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
        <div className="control-hero p-5 text-white">
          <div className="flex items-end justify-between gap-4">
            <div><p className="control-kicker">PLAN PROGRESS</p><h2 className="mt-2 text-xl font-medium">方案完成度</h2></div>
            <strong className="text-3xl font-medium text-emerald-200">{overallProgress}%</strong>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10" aria-label={`方案完成度 ${overallProgress}%`}>
            <div className="h-full rounded-full bg-[#45df78] transition-[width]" style={{ width: `${overallProgress}%` }} />
          </div>
          <p className="mt-3 text-xs leading-5 text-emerald-100/60">还有 {missingSlots.length} 个可选设备位待完成。</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {spaces.map((space) => {
            const spaceSlots = selectableSlots.filter((slot) => slot.spaceId === space.id);
            const completed = spaceSlots.filter((slot) => selectedSlotIds.has(slot.id)).length;
            const progress = spaceSlots.length > 0 ? Math.round((completed / spaceSlots.length) * 100) : 0;
            return (
              <Link key={space.id} href={`/materials?space=${space.id === "bathroom" ? "shared-bathroom" : space.id}`} className="control-card print-no-link p-4">
                <div className="flex items-center justify-between gap-2"><span className="text-xs text-stone-500">{space.name}</span><strong className="text-sm text-emerald-800">{completed}/{spaceSlots.length}</strong></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${progress}%` }} /></div>
                <p className="mt-3 text-[11px] text-stone-500">{progress === 100 ? "已完成" : `完成度 ${progress}% · 继续选择 →`}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-8 space-y-10">
        {spaces.map((space) => {
          const group = selected.filter(({ item }) => item.spaceId === space.id);
          if (group.length === 0) return null;
          return (
            <section key={space.id}>
              <div className="flex items-end justify-between border-b border-stone-200 pb-3">
                <div><p className="eyebrow">SPACE</p><h2 className="mt-1 text-2xl font-medium text-stone-900">{space.name}</h2></div>
                <Link href={`/materials?space=${space.id === "bathroom" ? "shared-bathroom" : space.id}`} className="print-hidden text-sm text-emerald-800 hover:underline">继续选择 →</Link>
              </div>
              <div className="mt-4 grid gap-4">
                {group.map(({ item, slot, product }) => {
                  const unit = getQuantityUnit(product);
                  const price = getKnownPrice(product);
                  const lineTotal = price === null ? null : price * item.quantity;
                  const quantityStep = product.category === "地板" ? 0.5 : 1;
                  return (
                  <article key={slot.id} className="control-card grid gap-4 p-4 sm:grid-cols-[112px_1fr_auto] sm:items-center">
                    <div className="product-media h-28 rounded-2xl p-2"><ProductImage src={product.coverImage} alt={product.name} fit={product.category === "地板" ? "cover" : "contain"} /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-emerald-800">{slot.name}</p>
                      <h3 className="mt-1.5 text-lg font-medium text-stone-900">{product.name}</h3>
                      <p className="mt-1 text-xs text-stone-500">{product.brand} · {product.model}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">{product.specification}</p>
                    </div>
                    <div className="sm:min-w-56 sm:text-right">
                      <strong className="block text-lg font-medium text-stone-900">{lineTotal === null ? product.displayPrice : `小计 ¥ ${formatCurrency(lineTotal)}`}</strong>
                      <span className="text-[10px] text-stone-400">{price === null ? product.priceLabel : `单价 ¥ ${formatCurrency(price)} · ${product.priceLabel}`}</span>
                      <div className="print-hidden mt-3 flex items-center gap-2 sm:justify-end">
                        <span className="text-xs text-stone-500">数量</span>
                        <button type="button" onClick={() => updateQuantity(item.slotId, item.quantity - quantityStep)} className="grid size-8 place-items-center rounded-[8px] border border-stone-300 text-stone-600 hover:border-emerald-700" aria-label={`减少${product.name}数量`}>−</button>
                        <label className="flex h-8 items-center rounded-[8px] border border-stone-300 bg-stone-50 px-2">
                          <span className="sr-only">{product.name}数量</span>
                          <input type="number" min="1" max="999" step={quantityStep} value={item.quantity} onChange={(event) => updateQuantity(item.slotId, Number(event.target.value))} className="w-12 bg-transparent text-center text-xs text-stone-900 outline-none" />
                          <span className="text-[10px] text-stone-500">{unit}</span>
                        </label>
                        <button type="button" onClick={() => updateQuantity(item.slotId, item.quantity + quantityStep)} className="grid size-8 place-items-center rounded-[8px] border border-stone-300 text-stone-600 hover:border-emerald-700" aria-label={`增加${product.name}数量`}>＋</button>
                      </div>
                      <p className="print-only mt-2 text-xs text-stone-500">数量：{item.quantity} {unit}</p>
                      <div className="print-hidden mt-3 flex gap-2 sm:justify-end">
                        <Link href={getSlotHref(slot)} className={`${rowActionClass} border-stone-300 text-stone-600 hover:border-emerald-700 hover:text-emerald-800`}>替换</Link>
                        <button type="button" onClick={() => removeItem(item.slotId)} className={`${rowActionClass} border-red-300 text-red-400 hover:border-red-400 hover:bg-red-950/30 hover:text-red-300`}>删除</button>
                      </div>
                    </div>
                  </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-10 border-t border-stone-200 pt-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="eyebrow">TO BE COMPLETED</p><h2 className="mt-2 text-2xl font-medium text-stone-900">待补选设备位</h2></div>
          <span className={missingSlots.length === 0 ? "status-success rounded-full px-3 py-1.5 text-xs" : "text-sm text-stone-500"}>{missingSlots.length === 0 ? "✓ 所有可选项已完成" : `还需完成 ${missingSlots.length} 项`}</span>
        </div>
        {missingSlots.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {missingSlots.map((slot) => {
              const space = spaces.find((candidate) => candidate.id === slot.spaceId);
              return (
                <article key={slot.id} className="control-card flex items-center justify-between gap-4 p-4">
                  <div><p className="text-[10px] tracking-[.12em] text-stone-400">{space?.name ?? "空间"} · {slot.categoryLabel}</p><h3 className="mt-1.5 text-sm font-medium text-stone-900">{slot.name}</h3></div>
                  <Link href={getSlotHref(slot)} className="action-primary print-hidden shrink-0 rounded-[9px] px-3 py-2 text-xs">去补选 →</Link>
                  <span className="print-only text-xs text-stone-500">待补选</span>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="control-hero mt-10 grid gap-6 p-6 text-white lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs tracking-[.18em] text-emerald-300">REFERENCE TOTAL</p>
          <strong className="mt-2 block text-4xl font-medium">¥ {formatCurrency(knownTotal)}</strong>
          <p className="mt-2 text-xs leading-5 text-emerald-100/60">按当前数量计算商品参考价；另有 {pendingPriceCount} 项未计价产品，不计入合计。</p>
        </div>
        <div className="print-hidden flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="action-primary rounded-[10px] px-5 py-3 text-sm font-medium">打印 / 保存PDF</button>
          <button type="button" onClick={() => { if (window.confirm("确定清空我的装修方案吗？")) clearPlan(); }} className="rounded-full border border-emerald-700 px-5 py-3 text-sm text-emerald-50 hover:bg-emerald-900">清空方案</button>
        </div>
      </section>
    </div>
  );
}
