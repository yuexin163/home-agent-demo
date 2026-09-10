import Image from "next/image";
import Link from "next/link";
import { SmartAssistant } from "@/src/components/SmartAssistant";
import { PropertyRepairButton } from "@/src/components/PropertyRepair";
import { SiteHeader } from "@/src/components/SiteHeader";
import { customizationPlan, manualLibrary } from "@/src/lib/data";

export default function Home() {
  const spaceCount = customizationPlan.spaces.length;
  const productCount = customizationPlan.products.length;
  const materialCount = customizationPlan.materials.length;
  const equipmentCount = manualLibrary.sourceSummary.equipmentDeviceCount;
  const equipmentPdfCount = manualLibrary.sourceSummary.equipmentPdfCount;

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />

      <section className="home-dashboard mx-auto max-w-[1720px] px-6 py-6 lg:px-10 2xl:px-16">
        <div className="home-heading">
          <div>
            <p className="control-kicker">YIPIN HOME AGENT</p>
            <h1>您的定制新家</h1>
          </div>
          <p>小壹管家已为您汇集装修、房屋与设备信息，随时提问，即刻找到答案</p>
        </div>

        <div className="home-workspace">
          <div className="home-primary-column">
            <Link href="/materials" className="home-showcase group" aria-label="查看壹品定制装修方案">
              <Image
                src={customizationPlan.plan.heroImage}
                alt="壹品定制装修方案客餐厅效果图"
                fill
                priority
                sizes="(min-width: 1024px) 64vw, 100vw"
                className="home-showcase-image"
              />
              <span className="home-showcase-shade" />
              <span className="home-showcase-topline">
                <span className="home-synced-status"><span className="status-dot" />您的方案已就绪</span>
                <span>{customizationPlan.plan.layout}</span>
              </span>
              <span className="home-showcase-copy">
                <span className="control-kicker">CUSTOMIZED HOME · 2026</span>
                <strong>{customizationPlan.plan.name}</strong>
                <span>{spaceCount}个空间 · {productCount}项产品 · {materialCount}项主要材料</span>
                <span className="home-showcase-action">查看定制装修方案 <span aria-hidden="true">→</span></span>
              </span>
            </Link>

            <section className="home-assistant-panel" aria-labelledby="home-assistant-title">
              <div className="home-assistant-heading">
                <div>
                  <p className="control-kicker">HOME KNOWLEDGE QUERY</p>
                  <h2 id="home-assistant-title">问居家智能体</h2>
                </div>
                <p>装修材料、设备使用和房屋信息，随时提问，一问即达</p>
              </div>
              <SmartAssistant compact />
            </section>
          </div>

          <aside className="home-secondary-column">
            <Link href="/materials" className="home-plan-card group" aria-label="查看完整定制方案">
              <span className="home-plan-header">
                <span>
                  <small>MY CUSTOMIZED HOME</small>
                  <strong>我的定制方案</strong>
                </span>
                <span className="home-plan-link">查看完整方案 →</span>
              </span>

              <span className="home-floorplan-media">
                <Image
                  src={customizationPlan.plan.floorPlanImage}
                  alt="三室两厅两卫户型图"
                  width={1200}
                  height={1200}
                  sizes="(min-width: 1024px) 32vw, 100vw"
                  className="home-floorplan-image"
                  priority
                />
              </span>

              <span className="home-plan-stats">
                {[[String(spaceCount).padStart(2, "0"), "空间"], [String(productCount).padStart(2, "0"), "产品"], [String(materialCount).padStart(2, "0"), "主材"]].map(([value, label]) => (
                  <span key={label}><strong>{value}</strong><small>{label}</small></span>
                ))}
              </span>
            </Link>

            <div className="home-module-grid">
              <Link href="/materials" className="home-module-card home-module-primary group">
                <span className="home-module-index">01</span>
                <span><small>CUSTOMIZED RENOVATION</small><strong>定制化装修方案</strong><em>{spaceCount}个空间的方案与产品资料</em></span>
                <b aria-hidden="true">→</b>
              </Link>
              <Link href="/inspection" className="home-module-card group">
                <span className="home-module-index">02</span>
                <span><small>QUALITY INSPECTION</small><strong>装修质检报告</strong><em>验房报告 · 5条隐蔽影像</em></span>
                <b aria-hidden="true">→</b>
              </Link>
              <Link href="/home-manual" className="home-module-card group">
                <span className="home-module-index">03</span>
                <span><small>DIGITAL HOME MANUAL</small><strong>数字房屋说明书</strong><em>{equipmentCount}台设备 · {equipmentPdfCount}份说明书</em></span>
                <b aria-hidden="true">→</b>
              </Link>
              <PropertyRepairButton variant="card" />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
