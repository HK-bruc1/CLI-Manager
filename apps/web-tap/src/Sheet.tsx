import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { overlayHost } from "./viewport";
import type { Translate } from "./i18n";

/** Overlay styles live outside the app; closing restores focus without stealing the keyboard. */
export function Sheet({ title, side = false, onClose, children, t }: {
  title: string; side?: boolean; onClose: () => void; children: ReactNode; t: Translate;
}) {
  const box = useRef<HTMLDivElement>(null);
  const label = useId();
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById("root");
    if (root) root.inert = true;
    box.current?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat) return;
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab" || !box.current) return;
      const focusable = [...box.current.querySelectorAll<HTMLElement>("button:not(:disabled),a[href],input,select,textarea,[tabindex='0']")];
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0]!; const last = focusable.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === box.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === box.current)) { event.preventDefault(); first.focus(); }
    };
    // Let child controls consume Escape before the enclosing dialog handles it.
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key); if (root) root.inert = false;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    let start: { x: number; y: number; active: boolean } | undefined;
    let distance = 0;
    let frame = 0;
    const begin = (event: TouchEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest("[data-drag-handle]") || event.touches.length !== 1) return;
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY, active: false };
    };
    const move = (event: TouchEvent) => {
      if (!start) return;
      const delta = side ? start.x - event.touches[0].clientX : event.touches[0].clientY - start.y;
      if (delta < 10 && !start.active) return;
      start.active = true; distance = Math.max(0, delta); event.preventDefault();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { element.style.transform = side ? `translateX(${-distance}px)` : `translateY(${distance}px)`; });
    };
    const finish = () => {
      cancelAnimationFrame(frame);
      if (start?.active && distance > 80) closeRef.current();
      else element.style.transform = "";
      start = undefined; distance = 0;
    };
    element.addEventListener("touchstart", begin, { passive: true });
    element.addEventListener("touchmove", move, { passive: false });
    element.addEventListener("touchend", finish); element.addEventListener("touchcancel", finish);
    return () => {
      cancelAnimationFrame(frame); element.removeEventListener("touchstart", begin); element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", finish); element.removeEventListener("touchcancel", finish);
    };
  }, [side]);
  return createPortal(<div className={`tap-overlay${side ? " is-side" : ""}`} onClick={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <div ref={box} className="tap-sheet" role="dialog" aria-modal="true" aria-labelledby={label} tabIndex={-1}>
      <header data-drag-handle><h2 id={label}>{title}</h2><button className="tap-icon" aria-label={t("close")} onClick={onClose}><X size={18} /></button></header>
      <div className="tap-sheet-body">{children}</div>
    </div>
  </div>, overlayHost());
}
