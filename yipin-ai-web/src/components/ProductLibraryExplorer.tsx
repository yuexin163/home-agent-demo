"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductImage } from "@/src/components/ProductImage";
import type { ProductCategory, SelectionSlot, ShowcaseProduct } from "@/src/types/content";

const categoryOrder: ProductCategory[] = ["地板", "软装", "定制柜体", "厨房电器", "卫浴", "厨卫五金"];

interface ProductLibraryExplorerProps {
  products: ShowcaseProduct[];
  initialCategory: string;
  selectionSlot?: SelectionSlot;
  selectionSlots: SelectionSlot[];
}

export function ProductLibraryExplorer({ products, initialCategory, selectionSlot, selectionSlots }: ProductLibraryExplorerProps) {
  const availableCategories = useMemo<Array<"全部" | ProductCategory>>(() => {
    const present = new Set(products.map((product) => product.category));
    return ["全部", ...categoryOrder.filter((category) => present.has(category))];
  }, [products]);
  const normalizedInitial = availableCategories.includes(initialCategory as "全部" | ProductCategory) ? initialCategory : "全部";
  const [category, setCategory] = useState(normalizedInitial);
  const [query, setQuery] = useState("");

  const visibleProducts = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("zh-CN");
    return products.filter((product) => {
      const matchesCategory = category === "全部" || product.category === category;
      const searchable = [product.name, product.brand, product.model, product.category, product.subcategory, ...product.tags].join(" ").toLocaleLowerCase("zh-CN");
      return matchesCategory && (!keyword || searchable.includes(keyword));
    });
  }, [category, products, query]);

  return (
    <>
      <div className="control-panel mt-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="产品分类筛选">
          {availableCategories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`rounded-[10px] px-4 py-2.5 text-sm transition ${category === item ? "action-primary" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-80">
          <span className="sr-only">搜索产品名称、品牌或型号</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索名称、品牌或型号"
            className="w-full rounded-[10px] border border-stone-200 bg-stone-50 px-5 py-3 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-emerald-700 focus:bg-white"
          />
        </label>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm text-stone-500">
        <span>当前展示 {visibleProducts.length} 款</span>
        <span className="text-right">{selectionSlot ? `当前资料范围：${selectionSlot.name}` : "全部装修资料"}</span>
      </div>

      {visibleProducts.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => {
            const productSlot = selectionSlot ?? selectionSlots.find((slot) => slot.productIds.includes(product.id));
            const detailHref = productSlot
              ? `/products/${product.id}?space=${productSlot.spaceId}&slot=${productSlot.id}`
              : `/products/${product.id}`;
            const recommended = productSlot?.recommendedProductId === product.id;

            return (
              <article key={product.id} className="control-card group overflow-hidden transition hover:-translate-y-1">
                <Link href={detailHref} className="block">
                  <div className="product-media aspect-[4/3] border-b border-stone-100 p-5">
                    <ProductImage src={product.coverImage} alt={product.name} fit={product.category === "地板" ? "cover" : "contain"} className="transition duration-300 group-hover:scale-[1.025]" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-emerald-800 shadow-sm backdrop-blur">{product.category}</span>
                    {recommended ? <span className="absolute right-4 top-4 rounded-full bg-emerald-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm">推荐产品</span> : null}
                  </div>
                </Link>
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={detailHref} className="min-w-0 flex-1">
                      <p className="text-xs text-stone-400">{product.brand} · {product.subcategory}</p>
                      <h2 className="mt-2 text-xl font-medium tracking-tight text-stone-900">{product.name}</h2>
                      <p className="mt-2 text-xs text-stone-500">型号 {product.model}</p>
                    </Link>
                    <Link href={detailHref} className="grid size-10 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-700 transition group-hover:bg-emerald-900 group-hover:text-white" aria-label={`查看${product.name}详情`}>→</Link>
                  </div>
                  <div className="mt-5 flex items-end justify-between border-t border-stone-100 pt-4">
                    <div>
                      <strong className="text-lg font-medium text-stone-900">{product.displayPrice}</strong>
                      <span className="ml-2 text-[10px] text-stone-400">{product.priceLabel}</span>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] text-emerald-800">产品档案</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="control-panel mt-5 grid min-h-72 place-items-center border-dashed p-8 text-center">
          <div>
            <p className="text-lg font-medium text-stone-800">没有匹配的产品</p>
            <p className="mt-2 text-sm text-stone-500">可清空搜索词或切换其他分类。</p>
          </div>
        </div>
      )}
    </>
  );
}
