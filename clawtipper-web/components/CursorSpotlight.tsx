"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Subtle emerald ring that follows the pointer (system cursor stays default).
 * Disabled when `prefers-reduced-motion: reduce`.
 */
export function CursorSpotlight() {
  const [visible, setVisible] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const visual = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const move = (e: PointerEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      setVisible(true);
    };

    const leave = () => setVisible(false);

    window.addEventListener("pointermove", move, { passive: true });
    document.body.addEventListener("pointerleave", leave);

    const tick = () => {
      const lerp = 0.16;
      visual.current.x += (pos.current.x - visual.current.x) * lerp;
      visual.current.y += (pos.current.y - visual.current.y) * lerp;
      const el = document.getElementById("cursor-spot");
      if (el) {
        el.style.transform = `translate3d(${visual.current.x}px, ${visual.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", move);
      document.body.removeEventListener("pointerleave", leave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      id="cursor-spot"
      className="pointer-events-none fixed left-0 top-0 z-[100] h-9 w-9 rounded-full border-2 border-emerald-500/60 bg-emerald-400/10 shadow-[0_0_28px_rgba(16,185,129,0.28)]"
      aria-hidden
    />
  );
}
