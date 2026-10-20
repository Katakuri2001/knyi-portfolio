import Image from "next/image";
import type { ReactNode } from "react";
import { Figure } from "@/components/editorial";
import type { CaseStudy } from "@/lib/content";
import { withBasePath } from "@/lib/paths";

/**
 * The visual for one case study.
 *
 * If the owner has uploaded a real campaign image, that is shown. If not, the
 * section falls back to its editorial figure — an abstract plate that carries
 * no numbers, dates or dashboard chrome, so it can never be mistaken for
 * evidence.
 *
 * Uploads are served from `/api/uploads/...` and are not in the build manifest,
 * so `next/image` runs with `unoptimized` — it still reserves the box, defers
 * the decode and sets the aspect ratio, it just does not run the optimiser.
 */
export function CaseVisual({
  study,
  fallback,
  ratio,
  caption,
  captionTone = "light",
  priority = false,
}: {
  study: CaseStudy;
  fallback: ReactNode;
  ratio: string;
  caption: string;
  captionTone?: "light" | "dark";
  priority?: boolean;
}) {
  if (study.image) {
    const alt =
      study.imageAlt?.trim() ||
      `${caseTitleFor(study)} — campaign image supplied by the project owner.`;

    return (
      <Figure ratio={ratio} caption={caption} captionTone={captionTone}>
        <Image
          src={withBasePath(study.image)}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1024px) 46vw, 92vw"
          className="object-cover"
        />
      </Figure>
    );
  }

  return (
    <Figure ratio={ratio} caption={caption} captionTone={captionTone}>
      {fallback}
    </Figure>
  );
}

function caseTitleFor(study: CaseStudy): string {
  if (!study.title) return study.category;
  if (!study.category) return study.title;
  return study.title === study.category ? study.category : study.title;
}
