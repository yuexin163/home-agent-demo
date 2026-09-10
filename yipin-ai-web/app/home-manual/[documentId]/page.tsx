import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/src/components/Breadcrumbs";
import { ManualPdfViewer } from "@/src/components/ManualPdfViewer";
import { ProductImage } from "@/src/components/ProductImage";
import { SiteHeader } from "@/src/components/SiteHeader";
import { getManualDocumentById, manualLibrary } from "@/src/lib/data";

interface PageProps { params: Promise<{ documentId: string }> }

export function generateStaticParams() {
  return manualLibrary.documents.map((document) => ({ documentId: document.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { documentId } = await params;
  const document = getManualDocumentById(documentId);
  return { title: document?.deviceName ?? document?.title ?? "说明书未找到", description: document?.summary };
}

export default async function ManualDocumentPage({ params }: PageProps) {
  const { documentId } = await params;
  const document = getManualDocumentById(documentId);
  if (!document) notFound();
  const backHref = document.kind === "equipment" ? `/home-manual?tab=equipment&zone=${encodeURIComponent(document.zone)}` : "/home-manual?tab=house";
  const siblingManuals = document.kind === "equipment" ? manualLibrary.documents.filter((item) => item.kind === "equipment" && item.deviceName === document.deviceName) : [];

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />
      <div className="mx-auto max-w-[1720px] px-5 py-7 lg:px-10 lg:py-10">
        <Breadcrumbs items={[{ label: "居家智能体", href: "/" }, { label: "数字房屋说明书", href: backHref }, { label: document.kind === "equipment" ? document.zone : "房屋说明书" }, { label: document.deviceName ?? document.title }]} />

        <section className="mt-7 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="control-panel self-start overflow-hidden xl:sticky xl:top-28">
            <div className="product-media aspect-[4/3] border-b border-stone-100 p-5"><ProductImage src={document.coverImage} alt={`${document.title}封面`} fit="contain" /></div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] text-emerald-800">{document.kind === "house" ? "房屋说明书" : document.zone}</span>{document.model ? <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[10px] text-stone-500">{document.model}</span> : null}</div>
              <h1 className="mt-5 text-2xl font-medium leading-9 text-stone-900">{document.deviceName ?? document.title}</h1>
              {document.deviceName ? <p className="mt-2 text-xs leading-6 text-stone-500">原文件：{document.title}</p> : null}
              <p className="mt-4 text-sm leading-7 text-stone-600">{document.summary}</p>
              <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-stone-200"><div className="bg-white p-4"><dt className="text-[10px] text-stone-400">原文页数</dt><dd className="mt-1 text-sm font-medium text-stone-800">{document.pageCount} 页</dd></div><div className="bg-white p-4"><dt className="text-[10px] text-stone-400">文件大小</dt><dd className="mt-1 text-sm font-medium text-stone-800">{document.fileSize}</dd></div></dl>
              {siblingManuals.length > 1 ? <div className="mt-5 rounded-xl border border-stone-200 bg-stone-100 p-4"><span className="text-[10px] font-medium tracking-[.12em] text-stone-400">本设备共 {siblingManuals.length} 份原说明书</span><div className="mt-3 space-y-2">{siblingManuals.map((item, index) => <Link key={item.id} href={`/home-manual/${item.id}`} className={`block rounded-[9px] border px-3 py-2.5 text-xs leading-5 transition ${item.id === document.id ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-white text-stone-600 hover:border-emerald-700"}`}>{index + 1}. {item.title}</Link>)}</div></div> : null}
              <div className="mt-5 grid gap-2"><a href={document.pdfUrl} target="_blank" rel="noreferrer" className="action-primary rounded-[10px] px-4 py-3 text-center text-sm font-medium">新窗口打开原PDF ↗</a><Link href={backHref} className="rounded-[10px] border border-stone-300 px-4 py-3 text-center text-sm text-stone-600 hover:border-emerald-700">← 返回说明书列表</Link></div>
            </div>
          </aside>

          <ManualPdfViewer pdfUrl={document.pdfUrl} title={document.title} pageCount={document.pageCount} />
        </section>
      </div>
    </main>
  );
}
