import type { Metadata } from "next";
import { Breadcrumbs } from "@/src/components/Breadcrumbs";
import { CustomizationPlanExplorer } from "@/src/components/CustomizationPlanExplorer";
import { SiteHeader } from "@/src/components/SiteHeader";
import { customizationPlan } from "@/src/lib/data";

export const metadata: Metadata = { title: "定制化装修" };

export default function MaterialsPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />
      <div className="mx-auto max-w-[1720px] px-6 py-6 lg:px-10 2xl:px-16">
        <Breadcrumbs items={[{ label: "居家智能体", href: "/" }, { label: "定制化装修" }]} />

        <header className="customization-heading">
          <div>
            <p className="control-kicker">CUSTOMIZED RENOVATION</p>
            <h1>我的定制化装修</h1>
            <p>{customizationPlan.plan.description}</p>
          </div>
          <div className="customization-heading-stats" aria-label="方案资料统计">
            <span><strong>{String(customizationPlan.spaces.length).padStart(2, "0")}</strong><small>空间</small></span>
            <span><strong>{String(customizationPlan.products.length).padStart(2, "0")}</strong><small>产品</small></span>
            <span><strong>{String(customizationPlan.materials.length).padStart(2, "0")}</strong><small>主材</small></span>
          </div>
        </header>

        <CustomizationPlanExplorer />
      </div>
    </main>
  );
}
