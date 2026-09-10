import Image from "next/image";
import Link from "next/link";
import { PropertyRepairButton, PropertyRepairDialog } from "@/src/components/PropertyRepair";

export function SiteHeader() {
  return (
    <>
      <header className="site-header sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-[1720px] items-center justify-between px-4 sm:h-[72px] sm:px-5 lg:px-10 2xl:px-16">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-stone-900" aria-label="中建壹品居家智能体，返回首页">
          <Image
            src="/brand/yipin-mark.png"
            alt=""
            width={67}
            height={67}
            className="size-9 shrink-0 sm:hidden"
            priority
          />
          <Image
            src="/brand/yipin-logo-light.png"
            alt="中建壹品"
            width={351}
            height={69}
            className="hidden h-8 w-auto shrink-0 sm:block lg:h-[34px]"
            priority
          />
          <span className="hidden border-l border-white/20 pl-3 lg:block">
            <strong className="block text-[13px] font-semibold tracking-[0.14em] text-[#f4efe8]">居家智能体</strong>
            <small className="mt-0.5 block text-[9px] tracking-[0.14em] text-emerald-700">HOME AGENT · 2026</small>
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 text-xs sm:gap-1.5 sm:text-sm" aria-label="主导航">
          <span className="control-status mr-1 hidden lg:inline-flex"><span className="control-online-dot" />小壹在线</span>
          <Link href="/" className="rounded-full px-2.5 py-2 text-stone-600 hover:bg-white hover:text-emerald-800">首页</Link>
          <Link href="/materials" className="rounded-full px-2.5 py-2 text-stone-600 hover:bg-white hover:text-emerald-800"><span className="sm:hidden">装修方案</span><span className="hidden sm:inline">定制化装修方案</span></Link>
          <Link href="/inspection" className="hidden rounded-full px-2.5 py-2 text-stone-600 hover:bg-white hover:text-emerald-800 md:inline-flex">装修质检报告</Link>
          <Link href="/home-manual" className="rounded-full px-2.5 py-2 text-stone-600 hover:bg-white hover:text-emerald-800"><span className="sm:hidden">房屋说明书</span><span className="hidden sm:inline">数字房屋说明书</span></Link>
          <span className="hidden 2xl:inline-flex"><PropertyRepairButton /></span>
          <details className="community-switcher">
            <summary aria-label="切换小区">
              <span className="community-switcher-icon" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="hidden xl:inline">中建壹品·汉芯公馆</span>
              <span className="xl:hidden">小区</span>
              <span className="community-switcher-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="community-switcher-panel">
              <p>切换服务小区</p>
              <button type="button" className="is-current">
                <span><strong>中建壹品·汉芯公馆</strong><small>当前房屋档案</small></span>
                <em>当前</em>
              </button>
              <button type="button" disabled>
                <span><strong>其他小区</strong><small>服务接入中</small></span>
              </button>
            </div>
          </details>
          </nav>
        </div>
      </header>
      <PropertyRepairDialog />
    </>
  );
}
