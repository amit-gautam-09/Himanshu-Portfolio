/**
 * Re-fits each card trace to its card's measured height.
 *
 * The SVG ships from the build at the card's designed height; cards whose
 * content makes them taller get their geometry REGENERATED here, never
 * scaled, so the via ring stays circular and the chamfer stays at 45°.
 */
import { traceGeometry } from './trace-geometry.js';

function fit(svg) {
  const card = svg.closest('[data-trace-host]');
  if (!card) return;

  const h = Math.round(card.getBoundingClientRect().height);
  if (!h || Number(svg.dataset.fittedAt) === h) return;

  const g = traceGeometry(h, svg.dataset.compact === 'true');

  svg.setAttribute('height', String(g.height));
  svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  svg.dataset.fittedAt = String(h);

  svg.querySelectorAll('.trace__path, .trace__pulse').forEach((p) => p.setAttribute('d', g.d));
  svg.querySelectorAll('.trace__via, .trace__via-core').forEach((c) => {
    c.setAttribute('cx', String(g.viaCx));
    c.setAttribute('cy', String(g.viaCy));
  });

  const brk = svg.querySelector('.trace__break');
  if (brk) {
    const [a, b] = brk.querySelectorAll('line');
    const r = 7;
    a?.setAttribute('x1', String(g.viaCx - r)); a?.setAttribute('y1', String(g.viaCy - r));
    a?.setAttribute('x2', String(g.viaCx + r)); a?.setAttribute('y2', String(g.viaCy + r));
    b?.setAttribute('x1', String(g.viaCx + r)); b?.setAttribute('y1', String(g.viaCy - r));
    b?.setAttribute('x2', String(g.viaCx - r)); b?.setAttribute('y2', String(g.viaCy + r));
  }
}

const traces = [...document.querySelectorAll('.trace')];
if (traces.length) {
  const run = () => traces.forEach(fit);
  run();

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(run);
    traces.forEach((t) => {
      const host = t.closest('[data-trace-host]');
      if (host) ro.observe(host);
    });
  } else {
    addEventListener('resize', run, { passive: true });
  }

  // Webfonts land after first paint and change card height.
  if (document.fonts?.ready) document.fonts.ready.then(run);
}
