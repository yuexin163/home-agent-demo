import type { Metadata } from "next";
import { RenovationPlanProvider } from "@/src/components/RenovationPlanProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "壹品居家智能体",
    template: "%s · 壹品居家智能体",
  },
  description: "随问随查定制化装修、装修质检和数字房屋说明书信息的壹品居家智能体。",
  icons: { icon: "/brand/yipin-mark.png" },
  openGraph: {
    title: "壹品居家智能体",
    description: "定制化装修、装修质检与数字房屋说明书资料，一问即达。",
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/og-home-agent.png", alt: "壹品居家智能体分享预览" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "壹品居家智能体",
    description: "小壹管家，让家的每一项信息随问随查。",
    images: ["/og-home-agent.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body><RenovationPlanProvider>{children}</RenovationPlanProvider></body>
    </html>
  );
}
