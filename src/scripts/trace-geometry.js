/**
 * Geometry for the card trace and its via ring.
 *
 * Shared by TraceVia.astro (at build time) and trace-fit.js (in the browser),
 * so the drawn path is always regenerated at the card's real height rather
 * than scaled. Scaling is what ovalises the via ring and flattens the 45°
 * chamfer -- see component inventory 1.6.
 *
 * Derived from the 296px desktop card in the design reference:
 *   M16 16 L16 196 L32 212 L32 250, via at (32, 262) r5
 */

export const PRESETS = {
  /** 1440 artboard: 296px card. */
  full: { inset: 16, viaOffset: 34, viaR: 5, run: 38, width: 46 },
  /** 390 artboard. */
  compact: { inset: 14, viaOffset: 16, viaR: 4.5, run: 20, width: 40 }
};

export function traceGeometry(height, compact = false) {
  const { inset, viaOffset, viaR, run, width } = compact ? PRESETS.compact : PRESETS.full;

  const x1 = inset;
  const x2 = inset * 2;
  const viaCy = height - viaOffset;
  const endY = viaCy - viaR - 7;
  const kneeY = endY - run - inset;

  return {
    width,
    height,
    viaCx: x2,
    viaCy,
    viaR,
    // down the first inset, a 45° chamfer, a vertical run, then the via
    d: `M${x1} ${inset} L${x1} ${kneeY} L${x2} ${kneeY + inset} L${x2} ${endY}`
  };
}
