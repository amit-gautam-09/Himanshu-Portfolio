/**
 * Measurement reveal — once per page.
 *
 * Marks [data-reveal] elements as revealed when they first enter view. The
 * extension lines draw, the arrowheads snap and the value lands on ONE
 * tween; the timing lives in the components' own CSS so the gesture stays
 * single.
 *
 * Under prefers-reduced-motion the components render at rest and the values
 * print rather than count, so this does nothing worth doing -- everything is
 * marked revealed immediately.
 */
const targets = document.querySelectorAll('[data-reveal]');

if (targets.length) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.setAttribute('data-revealed', ''));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-revealed', '');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.2 }
    );

    targets.forEach((el) => io.observe(el));
  }
}
