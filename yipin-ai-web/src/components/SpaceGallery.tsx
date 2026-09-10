"use client";

import { useState } from "react";
import { ProductImage } from "@/src/components/ProductImage";

export function SpaceGallery({ images, spaceName, label = "空间效果图", fit = "cover" }: { images: string[]; spaceName: string; label?: string; fit?: "cover" | "contain" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentImage = images[activeIndex] ?? "";

  return (
    <div className="placeholder-scene shadow-[0_22px_70px_rgba(28,25,23,.1)]" role="group" aria-label={`${spaceName}图片浏览`}>
      <ProductImage src={currentImage} alt={`${spaceName}图片预览`} fit={fit} className="absolute inset-0 z-[1] bg-white" />
      <span className="placeholder-label">{label}</span>
      <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 rounded-full bg-stone-950/65 p-1.5 text-white backdrop-blur">
        <span className="px-3 text-xs">{images.length ? `${activeIndex + 1} / ${images.length}` : "图片待补充"}</span>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)} className="grid size-9 place-items-center rounded-full bg-white/15 hover:bg-white/25" aria-label="上一张图片">←</button>
            <button type="button" onClick={() => setActiveIndex((activeIndex + 1) % images.length)} className="grid size-9 place-items-center rounded-full bg-white text-stone-900 hover:bg-emerald-100" aria-label="下一张图片">→</button>
          </>
        )}
      </div>
    </div>
  );
}
