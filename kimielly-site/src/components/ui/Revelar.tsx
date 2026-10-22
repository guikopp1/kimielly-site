"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Entrada sutil ao rolar a página. Sem JavaScript (ou com
 * prefers-reduced-motion) o conteúdo aparece normalmente.
 */
export function Revelar({
  children,
  atraso = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  atraso?: number;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("visivel");
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("visivel");
            obs.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={["revelar", className].filter(Boolean).join(" ")}
      style={{ "--atraso": `${atraso}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
