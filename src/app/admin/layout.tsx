/**
 * /admin — the private console.
 *
 * Its own layout, deliberately free of the public atmosphere and floating rail.
 * An app surface needs a fixed header and a scrollable document, not a
 * floating one, and the rail's section anchors mean nothing here.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main id="main">{children}</main>;
}