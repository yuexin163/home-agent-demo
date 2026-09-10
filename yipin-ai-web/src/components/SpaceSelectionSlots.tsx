import Link from "next/link";
import { ProductImage } from "@/src/components/ProductImage";
import type { SelectionSlot, ShowcaseProduct } from "@/src/types/content";

export function SpaceSelectionSlots({ slots, products }: { slots: SelectionSlot[]; products: ShowcaseProduct[] }) {
  const availableCount = slots.filter((slot) => slot.productIds.length > 0).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div><p className="eyebrow">RENOVATION ARCHIVE</p><h2 className="mt-3 text-3xl font-medium tracking-tight text-stone-900">装修资料分类</h2></div>
        <span className="text-sm text-stone-500">{availableCount} 项已有资料</span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {slots.map((slot, index) => {
          const previewProduct = slot.recommendedProductId ? products.find((product) => product.id === slot.recommendedProductId) : undefined;
          const available = slot.productIds.length > 0;
          const href = available ? `/materials?space=${slot.spaceId}&slot=${slot.id}&category=${encodeURIComponent(slot.libraryCategory ?? "全部")}` : "";
          const card = <><div className="product-media relative h-36 rounded-2xl p-3">{previewProduct ? <ProductImage src={previewProduct.coverImage} alt={previewProduct.name} fit={previewProduct.category === "地板" ? "cover" : "contain"} /> : <span className="text-xs text-stone-400">更多产品</span>}<span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium ${available ? "bg-white/90 text-emerald-800 shadow-sm" : "bg-stone-200 text-stone-500"}`}>{available ? `${slot.productIds.length} 款资料` : "敬请期待"}</span></div><div className="mt-4 flex items-start justify-between gap-3"><div><p className="text-xs text-stone-400">{String(index + 1).padStart(2, "0")} · {slot.categoryLabel}</p><h3 className="mt-1.5 text-lg font-medium text-stone-900">{slot.name}</h3><p className="mt-1.5 text-xs leading-5 text-stone-500">{slot.description}</p></div><span className={`grid size-9 shrink-0 place-items-center rounded-full ${available ? "bg-emerald-900 text-white" : "bg-stone-100 text-stone-400"}`} aria-hidden="true">{available ? "→" : "·"}</span></div></>;
          return available ? <Link key={slot.id} href={href} className="control-card p-4 transition hover:-translate-y-1">{card}</Link> : <div key={slot.id} className="control-card p-4 opacity-70">{card}</div>;
        })}
      </div>
    </div>
  );
}
