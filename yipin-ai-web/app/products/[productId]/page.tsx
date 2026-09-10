import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/src/components/Breadcrumbs";
import { ProductImage } from "@/src/components/ProductImage";
import { SiteHeader } from "@/src/components/SiteHeader";
import { customizationPlan, getCustomizationSpaceUrl, getRelatedShowcaseProducts, getSelectionSlotById, getSelectionSlotForProduct, getShowcaseProductById, getSpaceById, showcaseProducts } from "@/src/lib/data";

interface CustomizationProduct {
  id: string;
  name: string;
  category: string;
  spaceIds: string[];
  productCode?: string;
  dimensions?: string;
  brandSeries: string;
  image: string;
  sourceFile: string;
  note?: string;
}

const customizationProducts = customizationPlan.products as CustomizationProduct[];

interface PageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ space?: string; slot?: string }>;
}

export function generateStaticParams() {
  return [...showcaseProducts, ...customizationProducts].map((product) => ({ productId: product.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const customizationProduct = customizationProducts.find((product) => product.id === productId);
  if (customizationProduct) {
    return {
      title: customizationProduct.name,
      description: `${customizationProduct.productCode ?? "定制产品"} · ${customizationProduct.dimensions ?? "产品规格"}`,
    };
  }
  const product = getShowcaseProductById(productId);
  return { title: product?.name ?? "产品未找到", description: product?.description };
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { productId } = await params;
  const { space: requestedSpaceId, slot: requestedSlotId } = process.env.STATIC_EXPORT === "1" ? {} : await searchParams;
  const customizationProduct = customizationProducts.find((item) => item.id === productId);
  if (customizationProduct) return <CustomizationProductPage product={customizationProduct} requestedSpaceId={requestedSpaceId} />;

  const product = getShowcaseProductById(productId);
  if (!product) notFound();

  const requestedSlot = requestedSlotId ? getSelectionSlotById(requestedSlotId) : undefined;
  const defaultSlot = getSelectionSlotForProduct(product.id);
  const selectionSlot = requestedSlot && requestedSlot.productIds.includes(product.id) ? requestedSlot : defaultSlot;
  const actionSpace = selectionSlot ? getSpaceById(selectionSlot.spaceId) : requestedSpaceId ? getSpaceById(requestedSpaceId) : undefined;
  const relatedProducts = getRelatedShowcaseProducts(product.id, product.category);
  const isRecommended = selectionSlot?.recommendedProductId === product.id;
  const details = [
    ["品牌", product.brand], ["产品型号", product.model], ["产品分类", `${product.category} / ${product.subcategory}`],
    ["产品规格", product.specification], ["适用空间", product.suitableSpaces.join("、")], ["产品特点", product.tags.slice(0, 3).join("、")],
  ];
  const contextualListHref = selectionSlot ? `/materials?space=${selectionSlot.spaceId}&slot=${selectionSlot.id}&category=${encodeURIComponent(selectionSlot.libraryCategory ?? product.category)}` : `/materials?category=${encodeURIComponent(product.category)}`;
  const breadcrumbs = actionSpace && selectionSlot
    ? [{ label: "居家智能体", href: "/" }, { label: actionSpace.name, href: getCustomizationSpaceUrl(actionSpace.id) }, { label: selectionSlot.name, href: contextualListHref }, { label: product.name }]
    : [{ label: "居家智能体", href: "/" }, { label: "定制化装修", href: "/materials" }, { label: product.category, href: `/materials?category=${encodeURIComponent(product.category)}` }, { label: product.name }];

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />
      <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-10 lg:py-10">
        <Breadcrumbs items={breadcrumbs} />

        <section className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.8fr)]">
          <div className="product-media min-h-[440px] rounded-[18px] border border-stone-200 bg-white p-7 shadow-[0_22px_70px_rgba(0,0,0,.24)] sm:min-h-[580px]">
            <ProductImage src={product.coverImage} alt={product.name} fit={product.category === "地板" ? "cover" : "contain"} />
            <span className="absolute left-5 top-5 rounded-full bg-stone-950/75 px-3 py-1.5 text-[11px] text-white backdrop-blur">产品档案</span>
          </div>

          <div className="flex flex-col justify-center py-2">
            {actionSpace && selectionSlot ? (
              <Link href={getCustomizationSpaceUrl(actionSpace.id)} className="control-card mb-5 px-5 py-4 text-sm text-emerald-950 transition hover:border-emerald-700">
                <strong className="block">适用于 {actionSpace.name} · {selectionSlot.name}{isRecommended ? " · 推荐产品" : ""}</strong>
                <span className="mt-1 block text-xs leading-5 text-emerald-800/70">返回空间页查看其他装修资料 →</span>
              </Link>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">{product.category}</span>
              <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-600">{product.subcategory}</span>
              {isRecommended ? <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs text-amber-900">推荐产品</span> : null}
            </div>
            <p className="mt-7 text-xs font-medium tracking-[.2em] text-stone-400">{product.brand} · {product.model}</p>
            <h1 className="mt-3 text-4xl font-medium leading-tight tracking-[-.045em] text-stone-900 sm:text-5xl">{product.name}</h1>
            <p className="mt-6 text-sm leading-8 text-stone-600">{product.name}，型号 {product.model}，适用于{product.suitableSpaces.join("、")}。详细规格与功能信息如下。</p>

            <div className="control-hero mt-7 p-5 text-white">
              <span className="text-xs text-emerald-200">{product.priceLabel}</span>
              <strong className="mt-1 block text-3xl font-medium tracking-tight">{product.displayPrice}</strong>
              <p className="mt-2 text-[11px] leading-5 text-emerald-100/60">产品价格及服务内容以实际订单信息为准。</p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200">
              {details.map(([label, value]) => (
                <div key={label} className="min-h-24 bg-white p-4">
                  <dt className="text-[11px] tracking-[.12em] text-stone-400">{label}</dt>
                  <dd className="mt-2 text-sm font-medium leading-6 text-stone-800">{value || "暂无信息"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-12 grid gap-6 border-t border-stone-200 pt-9 lg:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="eyebrow">PRODUCT TAGS</p>
            <h2 className="mt-3 text-2xl font-medium text-stone-900">展示标签</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => <span key={tag} className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">{tag}</span>)}
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <div><p className="eyebrow">SAME CATEGORY</p><h2 className="mt-3 text-2xl font-medium text-stone-900">同品类产品</h2></div>
              <Link href={`/materials?category=${encodeURIComponent(product.category)}`} className="text-sm text-emerald-800 hover:underline">查看全部</Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {relatedProducts.map((related) => (
                <Link key={related.id} href={`/products/${related.id}`} className="control-card flex items-center gap-4 p-3 transition hover:border-emerald-700">
                  <div className="product-media size-24 shrink-0 rounded-2xl p-2"><ProductImage src={related.coverImage} alt={related.name} fit={related.category === "地板" ? "cover" : "contain"} /></div>
                  <div className="min-w-0"><p className="text-xs text-stone-400">{related.brand}</p><h3 className="mt-1 font-medium text-stone-900">{related.name}</h3><p className="mt-1 truncate text-xs text-stone-500">{related.model}</p></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={contextualListHref} className="action-primary rounded-[10px] px-5 py-3 text-sm">← 返回资料列表</Link>
          {actionSpace ? <Link href={getCustomizationSpaceUrl(actionSpace.id)} className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-700 hover:border-emerald-700">返回{actionSpace.name}资料</Link> : null}
          <Link href="/home-manual" className="rounded-full border border-emerald-700 bg-white px-5 py-3 text-sm text-emerald-900 hover:bg-emerald-50">查看房屋说明书</Link>
        </div>
      </div>
    </main>
  );
}

function CustomizationProductPage({ product, requestedSpaceId }: { product: CustomizationProduct; requestedSpaceId?: string }) {
  const spaces = customizationPlan.spaces.filter((space) => product.spaceIds.includes(space.id));
  const currentSpace = spaces.find((space) => space.id === requestedSpaceId) ?? spaces[0];
  const relatedProducts = customizationProducts
    .filter((item) => item.id !== product.id && item.spaceIds.includes(currentSpace?.id ?? ""))
    .slice(0, 3);
  const details = [
    ["商品 ID", product.productCode ?? "暂无信息"],
    ["模型尺寸", product.dimensions ?? "暂无信息"],
    ["品牌系列", product.brandSeries || "暂无信息"],
    ["产品分类", product.category],
    ["所属空间", spaces.map((space) => space.name).join("、")],
    ["商品描述", product.note ?? "—"],
  ];

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />
      <div className="mx-auto max-w-[1580px] px-6 py-6 lg:px-10 lg:py-9 2xl:px-16">
        <Breadcrumbs items={[
          { label: "居家智能体", href: "/" },
          { label: "定制化装修", href: "/materials" },
          ...(currentSpace ? [{ label: currentSpace.name, href: `/materials?space=${currentSpace.id}` }] : []),
          { label: product.name },
        ]} />

        <section className="customization-detail-layout">
          <div className="customization-detail-media">
            <Image
              src={product.image}
              alt={`${product.name}产品资料图`}
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 92vw"
            />
            <span>定制产品档案</span>
          </div>

          <div className="customization-detail-copy">
            <div className="customization-detail-tags">
              <span>{currentSpace?.name ?? "定制空间"}</span>
              <span>{product.category}</span>
            </div>
            <p className="control-kicker">CUSTOM PRODUCT DETAIL</p>
            <h1>{product.name}</h1>
            <p className="customization-detail-lead">小壹已为您整理产品型号、尺寸、品牌系列与所属空间。</p>

            <dl className="customization-detail-specs">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            <Link href="/materials" className="customization-detail-back">← 返回定制化装修</Link>
          </div>
        </section>

        {relatedProducts.length ? (
          <section className="customization-related">
            <div className="customization-section-label">
              <h2>{currentSpace?.name}其他产品</h2>
              <span>{relatedProducts.length} 项</span>
            </div>
            <div className="customization-related-grid">
              {relatedProducts.map((related) => (
                <Link key={related.id} href={`/products/${related.id}?space=${currentSpace?.id ?? ""}`}>
                  <span className="customization-related-image"><Image src={related.image} alt={related.name} fill sizes="280px" /></span>
                  <span><small>{related.category}</small><strong>{related.name}</strong><em>查看详情 →</em></span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
