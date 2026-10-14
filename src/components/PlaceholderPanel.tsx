import type { ReactNode } from "react";

type PlaceholderPanelProps = {
  /** Short label rendered as an eyebrow, e.g. "CASE STUDY 01". */
  label: string;
  /** Primary caption, e.g. the business or project name. */
  title: string;
  /** Optional supporting line under the title. */
  detail?: string;
  /** Taller panels suit portraits; default suits landscape cards. */
  aspect?: "portrait" | "landscape";
  /**
   * Tones the panel for placement. `dark` sits on the featured case study's
   * ink background; `light` is the default for light surfaces.
   */
  tone?: "light" | "dark";
  /** Extra classes for layout context, e.g. forcing a min-height. */
  className?: string;
  children?: ReactNode;
};

/**
 * Intentional stand-in for imagery that does not exist yet.
 *
 * The portfolio references a portrait and three case-study photos that are not
 * in /public. Rendering <Image> against a missing file produced a broken-image
 * glyph and a 404 on every page load. This renders a deliberate typographic
 * panel in the brand palette instead, so nothing looks accidental and real
 * photography can replace it later without touching the layout.
 */
export function PlaceholderPanel({
  label,
  title,
  detail,
  aspect = "landscape",
  tone = "light",
  className = "",
  children,
}: PlaceholderPanelProps) {
  const isPortrait = aspect === "portrait";
  const isDark = tone === "dark";

  return (
    <div
      aria-hidden="true"
      className={[
        "relative w-full overflow-hidden",
        isPortrait ? "h-[420px] md:h-[540px]" : "h-56 md:h-64",
        className,
      ].join(" ")}
    >
      {/* Diagonal hatch reads as a stand-in for photography rather than a
          finished image, and matches the editorial language of the page. */}
      <div
        className={[
          "absolute inset-0",
          isDark
            ? "bg-gradient-to-br from-white/[0.07] via-transparent to-accent-primary/10"
            : "bg-gradient-to-br from-bg-muted/60 via-surface to-accent-primary/12",
        ].join(" ")}
      />

      {/* Oversized index ghosting behind the caption gives the panel depth
          without needing an image. */}
      <span
        className={[
          "pointer-events-none absolute -bottom-8 -right-4 select-none font-geist-mono text-[7rem] font-medium leading-none tracking-tighter md:text-[9rem]",
          isDark ? "text-white/[0.06]" : "text-foreground/[0.05]",
        ].join(" ")}
      >
        {label.replace(/\D/g, "") || "—"}
      </span>

      <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
        <p
          className={[
            "text-eyebrow",
            isDark ? "text-accent-primary" : "text-accent-secondary",
          ].join(" ")}
        >
          {label}
        </p>
        <p
          className={[
            "mt-2 font-geist-sans font-bold leading-tight tracking-tight",
            isDark ? "text-white" : "text-foreground",
            isPortrait ? "text-2xl md:text-3xl" : "text-lg md:text-xl",
          ].join(" ")}
        >
          {title}
        </p>
        {detail ? (
          <p
            className={[
              "mt-1 text-sm",
              isDark ? "text-on-dark/70" : "text-muted-text",
            ].join(" ")}
          >
            {detail}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}