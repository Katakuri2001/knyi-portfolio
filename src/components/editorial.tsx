import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

/**
 * Shared editorial primitives.
 *
 * These exist to stop every section from growing its own slightly different
 * version of the same heading, ledger and note. They are intentionally small:
 * sections that need their own art direction compose these rather than being
 * forced through one generic card.
 */

type Tone = "light" | "dark";

/** Mono section marker: index, label, and a hairline that runs full width. */
export function SectionMarker({
  index,
  label,
  tone = "light",
}: {
  index: string;
  label: string;
  tone?: Tone;
}) {
  return (
    <div
      className={[
        "flex items-baseline gap-4 pt-4",
        tone === "dark"
          ? "border-t border-white/20 text-accent-primary"
          : "rule-ink text-accent-ink",
      ].join(" ")}
    >
      <span className="text-meta font-medium tracking-[0.18em]">{index}</span>
      <span className="text-eyebrow">{label}</span>
    </div>
  );
}

/** Two-column heading: title left, supporting sentence right, rule above. */
export function SectionHead({
  index,
  label,
  title,
  lede,
  tone = "light",
}: {
  index: string;
  label: string;
  title: ReactNode;
  lede?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="grid gap-8">
      <Reveal>
        <SectionMarker index={index} label={label} tone={tone} />
      </Reveal>

      <div
        className={[
          "section-head",
          tone === "dark"
            ? "border-white/20"
            : "border-[color-mix(in_oklab,var(--color-rule)_22%,transparent)]",
        ].join(" ")}
      >
        <Reveal delay={0.05}>
          <h2
            className={[
              "text-title",
              tone === "dark" ? "text-white" : "text-foreground",
            ].join(" ")}
          >
            {title}
          </h2>
        </Reveal>

        {lede ? (
          <Reveal delay={0.1}>
            <p
              className={[
                "text-lede max-w-prose",
                tone === "dark" ? "text-on-dark/78" : "text-muted-text",
              ].join(" ")}
            >
              {lede}
            </p>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}

/** Label/value ledger. Renders exactly the metrics the data supplies. */
export function Ledger({
  items,
  tone = "light",
}: {
  items: { label: string; value: string }[];
  tone?: Tone;
}) {
  return (
    <dl>
      {items.map((item) => (
        <div
          key={item.label}
          className={[
            "flex items-baseline justify-between gap-6 py-3.5",
            tone === "dark"
              ? "border-t border-white/14 last:border-b"
              : "border-t border-border/90 last:border-b",
          ].join(" ")}
        >
          <dt
            className={[
              "text-meta shrink-0",
              tone === "dark" ? "text-on-dark-muted" : "text-muted-text",
            ].join(" ")}
          >
            {item.label}
          </dt>
          <dd
            className={[
              "text-right text-subtitle leading-tight",
              tone === "dark" ? "text-white" : "text-foreground",
            ].join(" ")}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Bordered note block for provenance and caveats. */
export function Note({
  label,
  children,
  tone = "light",
}: {
  label?: string;
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <div
      className={[
        "border-l-2 py-1 pl-4",
        tone === "dark" ? "border-accent-primary/70" : "border-accent-ink/60",
      ].join(" ")}
    >
      {label ? (
        <p
          className={[
            "figure-caption mb-1.5",
            tone === "dark" ? "text-accent-primary" : "text-accent-ink",
          ].join(" ")}
        >
          {label}
        </p>
      ) : null}
      <p
        className={[
          "text-[0.8125rem] leading-relaxed",
          tone === "dark" ? "text-on-dark-muted" : "text-muted-text",
        ].join(" ")}
      >
        {children}
      </p>
    </div>
  );
}

/**
 * Figure wrapper. Reserves the aspect ratio up front (no layout shift) and
 * settles the plate slightly as it enters the viewport.
 */
export function Figure({
  children,
  ratio = "4 / 5",
  caption,
  captionTone = "light",
  className = "",
}: {
  children: ReactNode;
  ratio?: string;
  caption?: ReactNode;
  captionTone?: Tone;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div
        className="figure-plate"
        style={{ aspectRatio: ratio, background: "var(--color-ink-deep)" }}
      >
        {children}
      </div>
      {caption ? (
        <figcaption
          className={[
            "figure-caption mt-3 flex items-center gap-2",
            captionTone === "dark" ? "text-on-dark-muted" : "text-muted-text",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 flex-none"
            style={{ background: "var(--color-accent-primary)" }}
          />
          <span>{caption}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}