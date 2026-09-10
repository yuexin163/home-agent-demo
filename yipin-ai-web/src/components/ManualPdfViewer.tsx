"use client";

import { useEffect, useState } from "react";

interface ManualPdfViewerProps {
  pdfUrl: string;
  title: string;
  pageCount: number;
}

export function ManualPdfViewer({ pdfUrl, title, pageCount }: ManualPdfViewerProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    const requestedPage = Number(new URLSearchParams(window.location.search).get("page"));
    if (!Number.isFinite(requestedPage)) return;
    const timer = window.setTimeout(() => setPage(Math.min(pageCount, Math.max(1, Math.round(requestedPage)))), 0);
    return () => window.clearTimeout(timer);
  }, [pageCount]);

  return (
    <section className="control-panel overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-stone-200 px-5 py-4 sm:flex-row sm:items-center">
        <div><p className="text-xs font-medium tracking-[.15em] text-emerald-700">ORIGINAL PDF</p><h2 className="mt-1 text-lg font-medium text-stone-900">原说明书在线预览</h2></div>
        <span className="text-xs text-stone-500">原始资料在线归档 · 当前定位第 {page} 页</span>
      </div>
      <iframe src={`${pdfUrl}#page=${page}&view=FitH`} title={`${title}原始PDF`} className="h-[76vh] min-h-[680px] w-full bg-stone-100" loading="eager" />
    </section>
  );
}
