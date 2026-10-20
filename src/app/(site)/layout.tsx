import { Atmosphere } from "@/components/Atmosphere";
import { SiteNavigation } from "@/components/SiteNavigation";

/**
 * Public site chrome — applies to `/` and anything else in this route group.
 *
 * Kept out of the root layout so the private /admin console does not inherit
 * the atmosphere, the floating rail, or the mobile dock. The route group does
 * not affect the URL, so the public page is still served at `/`.
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