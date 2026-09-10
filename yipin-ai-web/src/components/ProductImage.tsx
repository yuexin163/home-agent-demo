"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  fit?: "contain" | "cover";
  className?: string;
}

export function ProductImage({ src, alt, fit = "contain", className = "" }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`grid size-full place-items-center bg-stone-100 px-6 text-center text-xs text-stone-400 ${className}`} role="img" aria-label={`${alt}图片待补充`}>
        图片待补充
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`size-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}
