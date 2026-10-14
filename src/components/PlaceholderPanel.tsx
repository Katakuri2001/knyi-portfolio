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
  children,
}: PlaceholderPanelProps) {
  const isPortrait = aspect === "portrait";

  return (
    <div
      aria-hidden="true"
      className={[
        "relative w-full overflow-hidden rounded-2xl border border-border/40",
        "bg-gradient-to-br from-bg-muted/70 via-background to-accent-primary/10",
        isPortrait ? "h-[420px] md:h-[540px]" : "h-56 md:h-64",
      ].join(" ")}
    >
      {/* Corner ticks give the panel a measured, technical frame. */}
      <span className="absolute left-4 top-4 h-3 w-3 border-l border-t border-accent-secondary/40" />
      <span className="absolute right-4 top-4 h-3 w-3 border-r border-t border-accent-secondary/40" />
      <span className="absolute bottom-4 left-4 h-3 w-3 border-b border-l border-accent-secondary/40" />
      <span className="absolute bottom-4 right-4 h-3 w-3 border-b border-r border-accent-secondary/40" />

      <div
        className={[
          "flex h-full flex-col justify-between p-6",
          isPortrait ? "md:p-8" : "",
        ].join(" ")}
      >
        <div>
          <p className="font-method text-[0.6875rem] uppercase tracking-[0.18em] text-accent-secondary">
            {label}
          </p>
          <p
            className={[
              "mt-2 font-geist-sans font-bold leading-tight text-foreground",
              isPortrait ? "text-2xl md:text-3xl" : "text-base md:text-lg",
            ].join(" ")}
          >
            {title}
          </p>
          {detail ? (
            <p className="mt-1 text-sm text-muted-text">{detail}</p>
          ) : null}
        </div>

        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}