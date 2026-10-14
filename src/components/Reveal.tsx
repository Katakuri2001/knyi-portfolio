"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  /** Seconds of delay applied to this element. */
  delay?: number;
  /** Stagger applied to direct children instead of revealing the wrapper. */
  stagger?: number;
  className?: string;
  as?: ElementType;
};

/**
 * Reveals content as it enters the viewport.
 *
 * Built on IntersectionObserver rather than an animation library so the site
 * keeps zero runtime dependencies.
 *
 * Progressive enhancement is the important part: content renders visible in the
 * markup, and is only hidden once this component has mounted, confirmed motion
 * is allowed, and observed the element to be below the fold. With JavaScript
 * disabled, before hydration, under prefers-reduced-motion, or for anything
 * already on screen, content is simply visible — never stranded at opacity 0.
 */
export function Reveal({
  children,
  delay = 0,
  stagger,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  const show = useCallback(() => setHidden(false), []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect the OS preference: never hide anything.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen at first paint — show it, no animation needed.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    // Below the fold: hide, then reveal on entry.
    setHidden(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [show]);

  const hiddenStyle = { opacity: 0, transform: "translateY(12px)" } as const;
  const shownStyle = (seconds: number) => ({
    opacity: 1,
    transform: "none",
    transitionDelay: `${seconds}s`,
  });

  if (stagger !== undefined) {
    return (
      <Tag ref={ref} className={className}>
        {Array.isArray(children)
          ? children.map((child, index) => (
              <div
                key={index}
                className="reveal-item"
                style={hidden ? hiddenStyle : shownStyle(index * stagger)}
              >
                {child}
              </div>
            ))
          : children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={className}
      style={hidden ? hiddenStyle : shownStyle(delay)}
    >
      {children}
    </Tag>
  );
}