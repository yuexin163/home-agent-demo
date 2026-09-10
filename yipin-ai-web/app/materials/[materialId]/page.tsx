import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCustomizationSpaceUrl, getMaterialById, materials } from "@/src/lib/data";

interface PageProps { params: Promise<{ materialId: string }> }

export function generateStaticParams() {
  return materials.map((material) => ({ materialId: material.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { materialId } = await params;
  const material = getMaterialById(materialId);
  return { title: material?.name ?? "材料未找到" };
}

export default async function MaterialPage({ params }: PageProps) {
  const { materialId } = await params;
  const material = getMaterialById(materialId);
  if (!material) notFound();
  redirect(getCustomizationSpaceUrl(material.spaceId));
}
