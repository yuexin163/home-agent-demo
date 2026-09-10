"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type InspectionImage = {
  id: string;
  category: string;
  title: string;
  description: string;
  src: string;
  alt: string;
  checkpoints: string[];
};

const inspectionImages: InspectionImage[] = [
  {
    id: "ceiling-ductwork",
    category: "吊顶隐蔽工程",
    title: "风管与龙骨隐蔽记录",
    description: "记录吊顶封板前风管、管线与轻钢龙骨的现场布置情况。",
    src: "/inspection/images/concealed-ceiling-01.webp",
    alt: "吊顶封板前的风管、管线与轻钢龙骨现场影像",
    checkpoints: ["风管与管线走向", "龙骨节点与固定", "封板前影像留档"],
  },
  {
    id: "ceiling-equipment",
    category: "吊顶隐蔽工程",
    title: "设备与管线综合记录",
    description: "记录吊顶内部设备、排水管、通风软管及线路的综合布置。",
    src: "/inspection/images/concealed-ceiling-02.webp",
    alt: "吊顶内部设备与多类管线综合布置现场影像",
    checkpoints: ["设备安装位置", "管线交叉关系", "检修空间留档"],
  },
  {
    id: "ceiling-coordination",
    category: "吊顶隐蔽工程",
    title: "综合管线隐蔽记录",
    description: "记录吊顶内部风管、线缆、排水管及龙骨的施工状态。",
    src: "/inspection/images/concealed-ceiling-03.webp",
    alt: "吊顶内部综合管线和龙骨施工现场影像",
    checkpoints: ["综合管线排布", "线缆预留状态", "隐蔽节点留档"],
  },
  {
    id: "water-pressure",
    category: "水路隐蔽工程",
    title: "给水管道打压记录",
    description: "记录给水管道隐蔽前进行压力检测时的仪表与管路状态。",
    src: "/inspection/images/water-pressure-test.webp",
    alt: "给水管道压力检测仪表和管路现场影像",
    checkpoints: ["压力仪表状态", "管道连接节点", "隐蔽前检测留档"],
  },
  {
    id: "waterproofing",
    category: "防水隐蔽工程",
    title: "卫生间防水隐蔽记录",
    description: "记录卫生间防水施工后、饰面封闭前的地面与管根状态。",
    src: "/inspection/images/waterproofing-record.webp",
    alt: "卫生间防水施工后的地面和排水管根现场影像",
    checkpoints: ["地面防水状态", "管根节点处理", "饰面施工前留档"],
  },
];

export function InspectionGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slidePosition, setSlidePosition] = useState(1);
  const [isAnimated, setIsAnimated] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const slides = useMemo(
    () => [inspectionImages[inspectionImages.length - 1], ...inspectionImages, inspectionImages[0]],
    [],
  );
  const activeImage = inspectionImages[activeIndex];

  useEffect(() => {
    if (isPaused || detailIndex !== null) return;
    const timer = window.setInterval(() => {
      setIsAnimated(true);
      setSlidePosition((position) => position + 1);
      setActiveIndex((index) => (index + 1) % inspectionImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [detailIndex, isPaused]);

  useEffect(() => {
    if (detailIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailIndex(null);
      if (event.key === "ArrowLeft") setDetailIndex((index) => index === null ? 0 : (index - 1 + inspectionImages.length) % inspectionImages.length);
      if (event.key === "ArrowRight") setDetailIndex((index) => index === null ? 0 : (index + 1) % inspectionImages.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailIndex]);

  function move(direction: 1 | -1) {
    setIsAnimated(true);
    setSlidePosition((position) => position + direction);
    setActiveIndex((index) => (index + direction + inspectionImages.length) % inspectionImages.length);
  }

  function selectImage(index: number) {
    setIsAnimated(true);
    setActiveIndex(index);
    setSlidePosition(index + 1);
  }

  function handleTransitionEnd() {
    if (slidePosition === 0) {
      setIsAnimated(false);
      setSlidePosition(inspectionImages.length);
    }
    if (slidePosition === inspectionImages.length + 1) {
      setIsAnimated(false);
      setSlidePosition(1);
    }
  }

  const resolvedDetailIndex = detailIndex ?? 0;
  const detailImage = inspectionImages[resolvedDetailIndex];

  return (
    <>
      <section className="inspection-gallery-section" aria-labelledby="inspection-gallery-title">
        <div className="inspection-section-heading">
          <div>
            <p className="eyebrow">CONCEALED WORKS ARCHIVE</p>
            <h2 id="inspection-gallery-title">隐蔽工程影像</h2>
          </div>
          <p>关键工序影像与质检记录已按施工节点完成归档。</p>
        </div>

        <div
          className="inspection-gallery"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
          }}
        >
          <div className="inspection-carousel" aria-roledescription="轮播图" aria-label="隐蔽工程现场影像">
            <div
              className="inspection-carousel-track"
              style={{
                transform: `translate3d(-${slidePosition * 100}%, 0, 0)`,
                transitionDuration: isAnimated ? "720ms" : "0ms",
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {slides.map((image, index) => {
                const isClone = index === 0 || index === slides.length - 1;
                return (
                  <button
                    type="button"
                    className="inspection-carousel-slide"
                    key={`${image.id}-${index}`}
                    aria-hidden={isClone || undefined}
                    tabIndex={isClone ? -1 : 0}
                    onClick={() => setDetailIndex(inspectionImages.findIndex((item) => item.id === image.id))}
                    aria-label={isClone ? undefined : `查看${image.title}详情`}
                  >
                    <Image
                      src={image.src}
                      alt={isClone ? "" : image.alt}
                      fill
                      loading="eager"
                      sizes="(min-width: 1024px) 72vw, 100vw"
                      className="inspection-carousel-image"
                    />
                    <span className="inspection-carousel-shade" />
                    <span className="inspection-carousel-caption">
                      <small>{image.category}</small>
                      <strong>{image.title}</strong>
                      <span>查看影像档案</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="inspection-carousel-controls">
              <button type="button" onClick={() => move(-1)} aria-label="上一张隐蔽工程图片">←</button>
              <span>{String(activeIndex + 1).padStart(2, "0")} / {String(inspectionImages.length).padStart(2, "0")}</span>
              <button type="button" onClick={() => move(1)} aria-label="下一张隐蔽工程图片">→</button>
            </div>
          </div>

          <aside className="inspection-gallery-info" aria-live="polite">
            <span className="inspection-record-status"><span />影像已归档</span>
            <small>RECORD {String(activeIndex + 1).padStart(2, "0")}</small>
            <h3>{activeImage.title}</h3>
            <p>{activeImage.description}</p>
            <div className="inspection-checkpoint-list">
              {activeImage.checkpoints.map((checkpoint) => <span key={checkpoint}>{checkpoint}</span>)}
            </div>
            <button type="button" className="inspection-detail-action" onClick={() => setDetailIndex(activeIndex)}>
              查看完整影像 <span aria-hidden="true">↗</span>
            </button>
            <div className="inspection-carousel-dots" aria-label="选择隐蔽工程图片">
              {inspectionImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={index === activeIndex ? "is-active" : undefined}
                  onClick={() => selectImage(index)}
                  aria-label={`查看第 ${index + 1} 张：${image.title}`}
                  aria-pressed={index === activeIndex}
                />
              ))}
            </div>
          </aside>
        </div>
      </section>

      {detailIndex !== null ? (
        <div className="inspection-lightbox" role="dialog" aria-modal="true" aria-labelledby="inspection-detail-title" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setDetailIndex(null);
        }}>
          <button type="button" className="inspection-lightbox-close" onClick={() => setDetailIndex(null)} aria-label="关闭影像详情">×</button>
          <div className="inspection-lightbox-card">
            <div className="inspection-lightbox-media">
              <Image src={detailImage.src} alt={detailImage.alt} fill sizes="90vw" className="inspection-lightbox-image" />
              <button type="button" className="inspection-lightbox-prev" onClick={() => setDetailIndex((resolvedDetailIndex - 1 + inspectionImages.length) % inspectionImages.length)} aria-label="查看上一张影像">←</button>
              <button type="button" className="inspection-lightbox-next" onClick={() => setDetailIndex((resolvedDetailIndex + 1) % inspectionImages.length)} aria-label="查看下一张影像">→</button>
            </div>
            <div className="inspection-lightbox-copy">
              <p>{detailImage.category}</p>
              <h3 id="inspection-detail-title">{detailImage.title}</h3>
              <span>{String(resolvedDetailIndex + 1).padStart(2, "0")} / {String(inspectionImages.length).padStart(2, "0")}</span>
              <div className="inspection-lightbox-description">{detailImage.description}</div>
              <ul>{detailImage.checkpoints.map((checkpoint) => <li key={checkpoint}>{checkpoint}</li>)}</ul>
              <small>隐蔽工程封闭前施工状态与关键节点记录。</small>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
