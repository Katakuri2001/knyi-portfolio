import { Suspense } from "react";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { ThirdPartyTags } from "@/components/analytics/ThirdPartyTags";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteNavigation } from "@/components/SiteNavigation";

/**
 * Public site chrome — applies to `/` and anything else in this route group.
 *
 * Kept out of the root layout so the private /admin console does not inherit
 * it. The route group does not affect the URL, so the public page is still
 * served at `/`.
 *
 * The analytics provider and the consent banner live here because they are
 * site-wide: the tracker needs to see a route change to send one page view
 * per path, and consent must be decided before any tracker loads.
 *
 * The provider is wrapped in Suspense because it reads the search params —
 * without the boundary the whole page would be forced out of static
 * rendering.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Atmosphere />
      <SiteNavigation />

      <Suspense fallback={null}>
        <AnalyticsProvider />
      </Suspense>
      <ThirdPartyTags />
      <ConsentBanner />

      {/* No left padding here — each section owns its gutter via .shell, and
          full-bleed dark/sunken bands run to the viewport edges. The mobile
          dock needs the bottom reserve. */}
      <main
        id="main"
        className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0"
      >
        {children}
      </main>
    </>
  );
}
