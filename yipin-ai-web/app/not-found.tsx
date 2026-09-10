import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-5">
      <div className="max-w-lg text-center">
        <Image src="/brand/yipin-mark.png" alt="中建壹品" width={67} height={67} className="mx-auto size-16" />
        <p className="mt-8 text-xs font-semibold tracking-[.2em] text-emerald-700">404 · DATA NOT FOUND</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight text-stone-900">未找到对应资料</h1>
        <p className="mt-4 text-sm leading-7 text-stone-500">您访问的内容不存在或已更新，请返回首页继续浏览。</p>
        <Link href="/" className="action-primary mt-7 inline-flex rounded-[10px] px-6 py-3 text-sm">返回空间总览</Link>
      </div>
    </main>
  );
}
