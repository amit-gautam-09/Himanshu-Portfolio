/**
 * Metric values count to their number as the measurement draws.
 *
 * Motion spec (06 §3, SCROLL 32%): "dimension lines draw outward, arrowheads
 * snap, numbers count on the same tween. Once. Never again." The line and the
 * arrowheads are CSS, driven by [data-revealed] from reveal.js; a number
 * cannot be tweened in CSS, so it is done here — on the SAME duration and the
 * SAME curve, read from the tokens rather than repeated, so the four things
 * stay one gesture if the tokens ever move.
 *
 * Every digit run in the value counts, so "380–400 VDC" counts both ends and
 * keeps its dash, its space and its unit. Non-numeric values are left alone.
 * The cells are `font-variant-numeric: tabular-nums`, so nothing reflows while
 * the digits change.
 *
 * Under prefers-reduced-motion the value PRINTS: reveal.js marks everything
 * revealed on load and this module does nothing at all.
 *
 * Once, never again: each span is counted the first time it is revealed and
 * then forgotten. Re-entering the viewport does not replay it.
 */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cells = document.querySelectorAll('.metric[data-reveal]');

if (!reduced && cells.length && !!window.requestAnimationFrame) {
  const css = getComputedStyle(document.documentElement);

  // The token is authored `480ms`, but the build minifies it to `.48s`, and a
  // bare parseFloat then counts the whole value in half a millisecond. Read
  // the unit.
  const duration = (v, fallback) => {
    const s = String(v).trim();
    const n = parseFloat(s);
    if (!Number.isFinite(n)) return fallback;
    return /ms$/.test(s) ? n : /s$/.test(s) ? n * 1000 : n;
  };
  const ms = duration(css.getPropertyValue('--d-slow'), 480);

  // --e-settle, as its four control points. Kept in sync by name: if the
  // token is not a cubic-bezier() this falls back to the same shape.
  const curve = css.getPropertyValue('--e-settle').trim();
  const pts = curve.match(/-?\d*\.?\d+/g);
  const P = pts && pts.length === 4 ? pts.map(Number) : [0.16, 1, 0.3, 1];

  /** y of a cubic-bezier(x1,y1,x2,y2) at time t, by Newton on x. */
  const ease = (t) => {
    const [x1, y1, x2, y2] = P;
    const bez = (a, b, u) =>
      3 * a * u * (1 - u) * (1 - u) + 3 * b * u * u * (1 - u) + u * u * u;
    let u = t;
    for (let i = 0; i < 6; i++) {
      const x = bez(x1, x2, u) - t;
      if (Math.abs(x) < 1e-4) break;
      const d =
        3 * x1 * (1 - u) * (1 - 3 * u) + 3 * x2 * u * (2 - 3 * u) + 3 * u * u;
      if (Math.abs(d) < 1e-6) break;
      u -= x / d;
    }
    return bez(y1, y2, Math.min(Math.max(u, 0), 1));
  };

  const run = (span) => {
    const final = span.textContent;
    const numbers = final.match(/\d+/g);
    if (!numbers || ms <= 0) return; // a zeroed token means print, not count

    // Split into the fixed parts and the numbers, so only digits change.
    const parts = final.split(/\d+/);
    const targets = numbers.map(Number);
    const pad = numbers.map((n) => n.length);
    const t0 = performance.now();

    const frame = (now) => {
      const p = Math.min((now - t0) / ms, 1);
      const k = ease(p);
      let out = '';
      for (let i = 0; i < parts.length; i++) {
        out += parts[i];
        if (i < targets.length) {
          const v = Math.round(targets[i] * k);
          // Hold the final width from the first frame — tabular-nums keeps
          // the column steady, leading zeros keep the glyph count steady.
          out += String(v).padStart(pad[i], '0');
        }
      }
      span.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else span.textContent = final; // land exactly on the authored string
    };

    requestAnimationFrame(frame);
  };

  const seen = new WeakSet();
  const countIn = (cell) => {
    for (const span of cell.querySelectorAll('.metric__value span')) {
      // Only the span actually on screen at this breakpoint.
      if (seen.has(span) || !span.offsetParent) continue;
      seen.add(span);
      run(span);
    }
  };

  // reveal.js owns WHEN; this owns WHAT. Watching the attribute it sets keeps
  // the two in step without a second IntersectionObserver that could fire on
  // a different frame and split the gesture.
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.target.hasAttribute('data-revealed')) countIn(r.target);
    }
  });

  for (const cell of cells) {
    if (cell.hasAttribute('data-revealed')) countIn(cell);
    else mo.observe(cell, { attributes: true, attributeFilter: ['data-revealed'] });
  }
}
