"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductImage } from "@/src/components/ProductImage";
import type { ManualDocument, ManualDocumentKind, ManualSourceSummary } from "@/src/types/content";

interface ManualLibraryExplorerProps {
  documents: ManualDocument[];
  summary: ManualSourceSummary;
  initialTab?: ManualDocumentKind;
  initialZone?: string;
}

interface ManualCardGroup {
  key: string;
  kind: ManualDocumentKind;
  zone: string;
  displayName: string;
  model: string | null;
  summary: string;
  coverImage: string;
  documents: ManualDocument[];
}

export function ManualLibraryExplorer({ documents, summary, initialTab = "house", initialZone = "全部" }: ManualLibraryExplorerProps) {
  const [tab, setTab] = useState<ManualDocumentKind>(initialTab);
  const [zone, setZone] = useState(initialZone);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") !== "equipment") return;
    const requestedZone = params.get("zone");
    const timer = window.setTimeout(() => {
      setTab("equipment");
      setZone(requestedZone && summary.equipmentZones.includes(requestedZone) ? requestedZone : "全部");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [summary.equipmentZones]);

  const groups = useMemo<ManualCardGroup[]>(() => {
    const result: ManualCardGroup[] = [];
    const equipmentGroups = new Map<string, ManualCardGroup>();
    for (const document of documents) {
      if (document.kind === "house") {
        result.push({ key: document.id, kind: "house", zone: document.zone, displayName: document.title, model: null, summary: document.summary, coverImage: document.coverImage, documents: [document] });
        continue;
      }
      const key = `${document.zone}:${document.deviceName}`;
      const existing = equipmentGroups.get(key);
      if (existing) existing.documents.push(document);
      else equipmentGroups.set(key, { key, kind: "equipment", zone: document.zone, displayName: document.deviceName ?? document.title, model: document.model, summary: document.summary, coverImage: document.coverImage, documents: [document] });
    }
    return [...result, ...equipmentGroups.values()];
  }, [documents]);

  const visibleGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    return groups.filter((group) => {
      if (group.kind !== tab) return false;
      if (tab === "equipment" && zone !== "全部" && group.zone !== zone) return false;
      const searchable = [group.displayName, group.model, group.zone, group.summary, ...group.documents.flatMap((document) => [document.title, document.sourceFile, ...document.keywords])].filter(Boolean).join(" ").toLocaleLowerCase("zh-CN");
      return !normalized || searchable.includes(normalized);
    });
  }, [groups, query, tab, zone]);

  function selectTab(nextTab: ManualDocumentKind) {
    setTab(nextTab);
    setZone("全部");
    setQuery("");
  }

  const visiblePdfCount = visibleGroups.reduce((sum, group) => sum + group.documents.length, 0);

  return (
    <>
      <div className="control-panel mt-8 grid gap-3 p-3 sm:grid-cols-2" aria-label="数字房屋说明书二级菜单">
        <button type="button" onClick={() => selectTab("house")} aria-pressed={tab === "house"} className={`rounded-[12px] px-5 py-5 text-left transition ${tab === "house" ? "action-primary" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
          <span className="block text-[10px] font-medium tracking-[.18em] opacity-70">HOUSE DOCUMENTS</span><strong className="mt-2 block text-xl font-medium">房屋说明书</strong><span className="mt-2 block text-xs opacity-70">{summary.housePdfCount} 份PDF原件</span>
        </button>
        <button type="button" onClick={() => selectTab("equipment")} aria-pressed={tab === "equipment"} className={`rounded-[12px] px-5 py-5 text-left transition ${tab === "equipment" ? "action-primary" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
          <span className="block text-[10px] font-medium tracking-[.18em] opacity-70">EQUIPMENT DOCUMENTS</span><strong className="mt-2 block text-xl font-medium">设备说明书</strong><span className="mt-2 block text-xs opacity-70">{summary.equipmentZones.length} 个分区 · {summary.equipmentDeviceCount} 台设备 · {summary.equipmentPdfCount} 份PDF</span>
        </button>
      </div>

      <div className="control-panel mt-5 flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {tab === "equipment" ? ["全部", ...summary.equipmentZones].map((item) => <button key={item} type="button" onClick={() => setZone(item)} aria-pressed={zone === item} className={`rounded-[10px] px-4 py-2.5 text-sm transition ${zone === item ? "action-primary" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>{item}</button>) : <span className="rounded-[10px] bg-stone-100 px-4 py-2.5 text-sm text-stone-600">住宅交付与使用资料</span>}
        </div>
        <label className="relative block lg:w-96"><span className="sr-only">搜索说明书名称、设备或型号</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "house" ? "搜索入住、使用或质量保证书" : "搜索设备名称、品牌或型号"} className="w-full rounded-[10px] border border-stone-200 bg-stone-50 px-5 py-3 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-emerald-700 focus:bg-white" /></label>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm text-stone-500"><span>{tab === "equipment" ? `当前展示 ${visibleGroups.length} 台设备 · ${visiblePdfCount} 份原始PDF` : `当前展示 ${visibleGroups.length} 份房屋说明书`}</span><span>{tab === "equipment" ? `分区：${zone}` : "房屋资料"}</span></div>

      {visibleGroups.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleGroups.map((group) => {
            const primary = group.documents[0];
            const totalPages = group.documents.reduce((sum, document) => sum + document.pageCount, 0);
            const searchablePages = group.documents.reduce((sum, document) => sum + document.searchablePageCount, 0);
            return (
              <article key={group.key} className="control-card group flex overflow-hidden flex-col">
                <Link href={`/home-manual/${primary.id}`} className="block">
                  <div className="product-media aspect-[4/3] border-b border-stone-100 p-5"><ProductImage src={group.coverImage} alt={`${group.displayName}封面`} fit="contain" className="transition duration-300 group-hover:scale-[1.02]" /><span className="absolute left-4 top-4 rounded-full bg-stone-950/80 px-3 py-1.5 text-[10px] text-white backdrop-blur">{group.kind === "house" ? "房屋说明书" : group.zone}</span>{group.documents.length > 1 ? <span className="absolute right-4 top-4 rounded-full bg-emerald-900 px-3 py-1.5 text-[10px] text-white">{group.documents.length}份原说明书</span> : null}</div>
                </Link>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="text-xs text-stone-400">{group.kind === "equipment" ? `${group.zone}设备 · 型号 ${group.model}` : "住宅交付资料"}</p>
                  <h2 className="mt-2 text-2xl font-medium leading-9 tracking-tight text-stone-900">{group.displayName}</h2>
                  {group.kind === "equipment" ? <p className="mt-2 text-[11px] leading-5 text-stone-400">原说明书：{primary.title}{group.documents.length > 1 ? ` 等${group.documents.length}份文件` : ""}</p> : null}
                  <p className="mt-4 text-xs leading-6 text-stone-500">{group.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-[10px] text-stone-500"><span className="rounded-full bg-stone-100 px-3 py-1.5">{group.documents.length} 份PDF</span><span className="rounded-full bg-stone-100 px-3 py-1.5">共 {totalPages} 页</span><span className="rounded-full bg-stone-100 px-3 py-1.5">{searchablePages > 0 ? `可查询 ${searchablePages} 页` : "扫描版 · 标题可查"}</span></div>
                  {group.documents.length > 1 ? <div className="mt-4 rounded-[10px] border border-stone-200 bg-stone-100 p-3"><span className="text-[10px] font-medium tracking-[.12em] text-stone-400">本设备原始文件</span><div className="mt-2 space-y-1.5">{group.documents.map((document, index) => <Link key={document.id} href={`/home-manual/${document.id}`} className="flex items-center justify-between gap-3 text-xs text-stone-600 hover:text-emerald-800"><span className="truncate">{index + 1}. {document.title}</span><span className="shrink-0">{document.pageCount}页 →</span></Link>)}</div></div> : null}
                  <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 border-t border-stone-100 pt-5"><Link href={`/home-manual/${primary.id}`} className="action-primary rounded-[10px] px-4 py-3 text-center text-sm font-medium">{group.kind === "equipment" ? "查看设备说明书" : "查看房屋说明书"}</Link><a href={primary.pdfUrl} target="_blank" rel="noreferrer" className="rounded-[10px] border border-stone-300 px-4 py-3 text-sm text-stone-600 hover:border-emerald-700" aria-label={`新窗口打开${primary.title}`}>↗</a></div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <div className="control-panel mt-5 grid min-h-64 place-items-center border-dashed p-8 text-center"><div><p className="text-lg font-medium text-stone-800">没有匹配的说明书</p><p className="mt-2 text-sm text-stone-500">可清空搜索词或切换其他分区。</p></div></div>}
    </>
  );
}
