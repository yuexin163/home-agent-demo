"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { customizationPlan } from "@/src/lib/data";

export function CustomizationPlanExplorer({ initialSpaceId = customizationPlan.spaces[0].id }: { initialSpaceId?: string }) {
  const [selectedSpaceId, setSelectedSpaceId] = useState(initialSpaceId);
  const [activeRenderIndex, setActiveRenderIndex] = useState(0);
  const [slidePosition, setSlidePosition] = useState(0);
  const [isSlideAnimated, setIsSlideAnimated] = useState(true);
  const selectedSpace = customizationPlan.spaces.find((space) => space.id === selectedSpaceId) ?? customizationPlan.spaces[0];
  const selectedRender = selectedSpace.renders[activeRenderIndex] ?? selectedSpace.renders[0];
  const carouselRenders = selectedSpace.renders.length > 1
    ? [...selectedSpace.renders, selectedSpace.renders[0]]
    : selectedSpace.renders;

  useEffect(() => {
    const requestedSpaceId = new URLSearchParams(window.location.search).get("space");
    if (requestedSpaceId && customizationPlan.spaces.some((space) => space.id === requestedSpaceId)) {
      selectSpace(requestedSpaceId);
    }
  }, []);

  useEffect(() => {
    const renders = customizationPlan.spaces.find((space) => space.id === selectedSpaceId)?.renders ?? [];
    if (renders.length <= 1) return;

    const timer = window.setInterval(() => {
      setSlidePosition((currentPosition) => {
        const nextPosition = currentPosition + 1;
        setActiveRenderIndex(nextPosition % renders.length);
        return nextPosition;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [selectedSpaceId]);

  function selectSpace(spaceId: string) {
    setIsSlideAnimated(false);
    setSelectedSpaceId(spaceId);
    setActiveRenderIndex(0);
    setSlidePosition(0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setIsSlideAnimated(true));
    });
  }

  function selectRender(renderIndex: number) {
    setActiveRenderIndex(renderIndex);
    setSlidePosition(renderIndex);
    setIsSlideAnimated(true);
  }

  function handleSlideTransitionEnd() {
    if (slidePosition !== selectedSpace.renders.length) return;

    setIsSlideAnimated(false);
    setSlidePosition(0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setIsSlideAnimated(true));
    });
  }

  const products = customizationPlan.products.filter((product) => product.spaceIds.includes(selectedSpace.id));
  const materials = customizationPlan.materials.filter((material) => material.spaceIds.includes(selectedSpace.id));

  return (
    <>
      <section className="customization-console" aria-label="按空间浏览定制化装修方案">
        <nav className="customization-space-nav" aria-label="装修空间">
          <div className="customization-space-nav-title">
            <small>SPACE INDEX</small>
            <strong>选择空间</strong>
          </div>
          <div className="customization-space-list">
            {customizationPlan.spaces.map((space) => {
              const active = space.id === selectedSpace.id;
              return (
                <button
                  key={space.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectSpace(space.id)}
                  className={active ? "is-active" : undefined}
                >
                  <span>{String(space.order).padStart(2, "0")}</span>
                  <strong>{space.name}</strong>
                  <small>{space.areaSqm}㎡</small>
                  <b aria-hidden="true">→</b>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="customization-render" aria-live="polite">
          <div
            className="customization-render-track"
            style={{
              transform: `translate3d(-${slidePosition * 100}%, 0, 0)`,
              transitionDuration: isSlideAnimated ? "720ms" : "0ms",
            }}
            onTransitionEnd={handleSlideTransitionEnd}
          >
            {carouselRenders.map((render, renderIndex) => {
              const isLoopClone = renderIndex === selectedSpace.renders.length;
              return (
                <span key={`${render.id}-${renderIndex}`} className="customization-render-slide" aria-hidden={isLoopClone || undefined}>
                  <Image
                    src={render.image}
                    alt={isLoopClone ? "" : `${selectedSpace.name}定制装修效果图视角 ${render.number}`}
                    fill
                    loading="eager"
                    sizes="(min-width: 1280px) 54vw, 70vw"
                    className="customization-render-image"
                  />
                </span>
              );
            })}
          </div>
          <span className="customization-render-shade" />
          <span className="customization-render-number">VIEW {selectedRender.number}</span>
          <span className="customization-render-copy">
            <small>SELECTED SPACE</small>
            <strong>{selectedSpace.name}</strong>
            <span>{selectedSpace.areaSqm}㎡ · {products.length}项产品 · {materials.length}项主要材料</span>
          </span>
          {selectedSpace.renders.length > 1 ? (
            <div className="customization-render-switcher" aria-label={`${selectedSpace.name}效果图视角`}>
              {selectedSpace.renders.map((render, renderIndex) => (
                <button
                  key={render.id}
                  type="button"
                  aria-label={`查看${selectedSpace.name}效果图视角 ${render.number}`}
                  aria-pressed={render.id === selectedRender.id}
                  className={render.id === selectedRender.id ? "is-active" : undefined}
                  onClick={() => selectRender(renderIndex)}
                >
                  {render.number}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="customization-overview">
          <div className="customization-overview-head">
            <span><small>MY CUSTOMIZED HOME</small><strong>{customizationPlan.plan.name}</strong></span>
            <em>方案已就绪</em>
          </div>
          <div className="customization-overview-plan">
            <Image
              src={customizationPlan.plan.floorPlanImage}
              alt="三室两厅两卫装修方案户型图"
              width={1200}
              height={1200}
              sizes="320px"
            />
          </div>
          <div className="customization-overview-meta">
            <span><small>当前空间</small><strong>{selectedSpace.name}</strong></span>
            <span><small>空间面积</small><strong>{selectedSpace.areaSqm}㎡</strong></span>
          </div>
          <p>选择任一空间，即可联动查看效果图、定制产品和主要材料。</p>
        </aside>
      </section>

      <section className="customization-content" aria-labelledby="space-content-title">
        <div className="customization-content-heading">
          <div>
            <p className="control-kicker">SPACE CONFIGURATION</p>
            <h2 id="space-content-title">{selectedSpace.name}配置</h2>
          </div>
          <p>小壹已按空间整理产品与材料信息</p>
        </div>

        <div className="customization-content-grid">
          <div>
            <div className="customization-section-label">
              <h3>定制产品</h3>
              <span>{products.length} 项</span>
            </div>
            <div className="customization-product-grid">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}?space=${selectedSpace.id}`}
                  className="customization-product-card"
                  aria-label={`查看${product.name}详情`}
                >
                  <div className="customization-product-media">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1280px) 20vw, 30vw"
                    />
                    <span>{product.category}</span>
                  </div>
                  <div className="customization-product-copy">
                    <small>{product.brandSeries}</small>
                    <h4>{product.name}</h4>
                    {"dimensions" in product && product.dimensions ? <p>{product.dimensions}</p> : <p>规格以壹品正式资料为准</p>}
                    <span>查看产品详情 <b aria-hidden="true">→</b></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside>
            <div className="customization-section-label">
              <h3>主要材料</h3>
              <span>{materials.length} 项</span>
            </div>
            <div className="customization-material-list">
              {materials.map((material) => (
                <article key={material.id} className="customization-material-card">
                  <div className="customization-material-media">
                    <Image src={material.image} alt={material.name} fill sizes="320px" />
                  </div>
                  <div>
                    <small>{material.category}</small>
                    <h4>{material.name}</h4>
                    <dl>
                      {"model" in material && material.model ? <><dt>型号</dt><dd>{material.model}</dd></> : null}
                      {"size" in material && material.size ? <><dt>规格</dt><dd>{material.size}</dd></> : null}
                    </dl>
                    {"detailImage" in material && material.detailImage ? (
                      <a href={material.detailImage} target="_blank" rel="noreferrer">查看材料详情 ↗</a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
