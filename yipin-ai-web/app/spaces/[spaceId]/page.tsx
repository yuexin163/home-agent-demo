import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomizationSpaceUrl, getSpaceById, spaces } from "@/src/lib/data";

interface PageProps { params: Promise<{ spaceId: string }> }

export function generateStaticParams() {
  return spaces.map((space) => ({ spaceId: space.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { spaceId } = await params;
  const space = getSpaceById(spaceId);
  return { title: space?.name ?? "空间未找到" };
}

export default async function SpacePage({ params }: PageProps) {
  const { spaceId } = await params;
  redirect(getCustomizationSpaceUrl(spaceId));
}
