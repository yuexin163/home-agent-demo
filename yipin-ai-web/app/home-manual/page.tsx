import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/src/components/Breadcrumbs";
import { ManualLibraryExplorer } from "@/src/components/ManualLibraryExplorer";
import { SiteHeader } from "@/src/components/SiteHeader";
import { manualLibrary } from "@/src/lib/data";

export const metadata: Metadata = { title: "数字房屋说明书", description: "智能查询房屋交付信息、设备使用说明与原始PDF。" };

export default function HomeManualPage() {
  const totalPages = manualLibrary.documents.reduce((sum, document) => sum + document.pageCount, 0);

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />
      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-10 lg:py-10">
        <Breadcrumbs items={[{ label: "居家智能体", href: "/" }, { label: "数字房屋说明书" }]} />

        <section className="control-hero mt-7 grid gap-8 px-6 py-8 text-white sm:px-10 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-xs font-medium tracking-[.22em] text-emerald-300">DIGITAL HOME MANUAL</p><h1 className="mt-4 text-4xl font-medium tracking-[-.045em] sm:text-5xl">数字房屋说明书</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-emerald-50/70">小壹已将房屋交付信息与设备说明统一归档，可按名称、空间或型号快速定位，并随时查看完整原文。</p></div>
          <div className="grid grid-cols-3 gap-2">{[[String(manualLibrary.sourceSummary.housePdfCount).padStart(2, "0"), "房屋PDF"], [String(manualLibrary.sourceSummary.equipmentPdfCount).padStart(2, "0"), "设备PDF"], [String(totalPages), "原文页数"]].map(([value, label]) => <div key={label} className="control-stat min-w-24 rounded-[12px] p-4"><strong className="block text-2xl font-medium">{value}</strong><span className="mt-1 block text-[10px] text-emerald-200">{label}</span></div>)}</div>
        </section>

        <div className="theme-note mt-6 px-5 py-4 text-xs leading-6">小壹可从 {manualLibrary.documents.length} 份说明书、{totalPages} 页内容中智能定位答案，也可随时查看完整原文。</div>

        <ManualLibraryExplorer documents={manualLibrary.documents} summary={manualLibrary.sourceSummary} />

        <div className="mt-12 flex flex-wrap gap-3 border-t border-stone-200 pt-7"><Link href="/" className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-700 hover:border-emerald-700">← 返回居家智能体</Link><Link href="/materials" className="action-primary rounded-[10px] px-5 py-3 text-sm">查看定制化装修方案</Link></div>
      </div>
    </main>
  );
}
