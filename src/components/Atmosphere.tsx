/**
 * Static paper-and-light background. No client component, no state, no
 * animation: it renders once on the server and never re-paints. All styling
 * lives in globals.css so the layers can be tuned without touching this file.
 *
 * Layers, back to front: paper base (on .atmosphere), fine grain, laid-paper
 * fibre, one wide teal wash behind the hero, and a floor that falls off to
 * clean paper below it. Dark sections are opaque and cover it.
 */
export function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="atmosphere__grain" />
      <div className="atmosphere__fibre" />
      <div className="atmosphere__wash" />
      <div className="atmosphere__floor" />
    </div>
  );
}