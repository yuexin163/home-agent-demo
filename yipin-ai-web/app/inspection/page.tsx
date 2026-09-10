import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/src/components/Breadcrumbs";
import { InspectionGallery } from "@/src/components/InspectionGallery";
import { SiteHeader } from "@/src/components/SiteHeader";

export const metadata: Metadata = { title: "装修质检报告", description: "装修验收、问题、整改与复验资料入口。" };

const reportStats = [
  ["279", "总房间数", "覆盖 5 栋楼"],
  ["17", "总问题数", "涉及 1 个房间"],
  ["11", "已整改待复验", "整改结果等待复核"],
  ["06", "已关闭问题", "6 项完成闭环"],
];

export default function InspectionPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />
      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-10 lg:py-10">
        <Breadcrumbs items={[{ label: "居家智能体", href: "/" }, { label: "装修质检报告" }]} />
        <section className="control-hero inspection-hero mt-7 grid gap-8 px-6 py-8 text-white sm:px-10 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-medium tracking-[.22em] text-amber-300">RENOVATION QUALITY INSPECTION</p>
            <h1 className="mt-4 text-4xl font-medium tracking-[-.045em] sm:text-5xl">装修质检报告</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-emerald-50/70">小壹已归集验房报告与隐蔽工程影像，关键数据、整改进度和现场记录随时可查。</p>
            <div className="inspection-hero-meta"><span>任务：汉芯B住宅验房</span><span>报告时间：2026.08.10</span><span>楼栋范围：5 栋</span></div>
          </div>
          <div className="inspection-hero-actions">
            <span className="inspection-report-status"><span />验房报告已归档</span>
            <a href="#inspection-gallery-title" className="inspection-gallery-jump">
              <span className="inspection-gallery-jump-icon" aria-hidden="true">↘</span>
              <span><small>CONCEALED WORKS</small><strong>查看隐蔽工程影像</strong></span>
            </a>
          </div>
        </section>

        <section className="inspection-stats" aria-label="验房报告概览">
          {reportStats.map(([value, label, description]) => (
            <article key={label} className="inspection-stat-card">
              <strong>{value}</strong><span>{label}</span><small>{description}</small>
            </article>
          ))}
        </section>

        <section className="inspection-report-section" aria-labelledby="inspection-report-title">
          <div className="inspection-section-heading">
            <div><p className="eyebrow">HOME INSPECTION REPORT</p><h2 id="inspection-report-title">验房任务报告</h2></div>
            <p>验房任务、问题统计与整改复验结果已完成归档。</p>
          </div>
          <div className="inspection-report-card">
            <div className="inspection-report-toolbar">
              <div><span>PDF</span><strong>验房任务报告</strong><small>2 页 · 247 KB</small></div>
              <div>
                <a href="/inspection/home-inspection-report.pdf" target="_blank" rel="noreferrer">打开完整报告 ↗</a>
                <a href="/inspection/home-inspection-report.pdf" download>下载报告</a>
              </div>
            </div>
            <div className="inspection-report-viewer">
              <iframe title="验房任务报告" src="/inspection/home-inspection-report.pdf#view=FitH&navpanes=0" />
            </div>
          </div>
        </section>

        <InspectionGallery />

        <div className="mt-10 flex flex-wrap gap-3"><Link href="/" className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-700 hover:border-emerald-700">← 返回居家智能体</Link><Link href="/home-manual" className="action-primary rounded-[10px] px-5 py-3 text-sm">查看房屋说明书</Link></div>
      </div>
    </main>
  );
}
