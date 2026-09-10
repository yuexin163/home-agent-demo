"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export const OPEN_PROPERTY_REPAIR_EVENT = "open-property-repair";

export function openPropertyRepair() {
  window.dispatchEvent(new CustomEvent(OPEN_PROPERTY_REPAIR_EVENT));
}

export function PropertyRepairButton({ variant = "nav" }: { variant?: "nav" | "card" }) {
  return (
    <button
      type="button"
      onClick={openPropertyRepair}
      className={variant === "card" ? "home-module-card home-repair-card group" : "property-repair-nav"}
      aria-label="打开报事报修二维码"
    >
      {variant === "card" ? (
        <>
          <span className="home-module-index">04</span>
          <span><small>PROPERTY SERVICE</small><strong>报事报修</strong><em>扫码联系物业，提交服务需求</em></span>
          <b aria-hidden="true">↗</b>
        </>
      ) : (
        <>
          <span className="property-repair-nav-icon" aria-hidden="true">◇</span>
          <span>报事报修</span>
        </>
      )}
    </button>
  );
}

export function PropertyRepairDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const openDialog = () => setIsOpen(true);
    window.addEventListener(OPEN_PROPERTY_REPAIR_EVENT, openDialog);
    return () => window.removeEventListener(OPEN_PROPERTY_REPAIR_EVENT, openDialog);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="property-repair-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
      <section
        className="property-repair-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-repair-title"
        aria-describedby="property-repair-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="property-repair-close"
          aria-label="关闭报事报修窗口"
          onClick={() => setIsOpen(false)}
        >
          ×
        </button>

        <div className="property-repair-heading">
          <span className="property-repair-status"><i aria-hidden="true" />物业服务在线</span>
          <p>PROPERTY SERVICE</p>
          <h2 id="property-repair-title">报事报修</h2>
          <span id="property-repair-description">请使用微信扫描下方二维码，联系物业提交服务需求</span>
        </div>

        <div className="property-repair-qr-frame">
          <Image
            src="/services/property-service-qr.png"
            alt="物业报事报修微信小程序码"
            width={650}
            height={650}
            priority
            unoptimized
          />
        </div>

        <div className="property-repair-footer">
          <span><i aria-hidden="true">01</i>打开微信扫一扫</span>
          <span><i aria-hidden="true">02</i>填写并提交需求</span>
        </div>
      </section>
    </div>
  );
}
