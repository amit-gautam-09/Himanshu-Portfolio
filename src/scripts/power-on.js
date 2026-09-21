/**
 * Power-on sequence controller. The CSS in styles/power-on.css does the
 * animating; this only decides when it ends.
 *
 * Runs once per session and is skippable: any scroll, pointer or key input
 * lands the page immediately at its resting state. `hasSeenPowerOn` is
 * session-scoped, so a new tab plays it again and a reload within the
 * session does not.
 *
 * The decision to START is made by an inline head script before first
 * paint -- see Sheet.astro -- so a returning visitor or anyone who prefers
 * reduced motion never sees a frame of it.
 */
const DURATION = 1600;
const root = document.documentElement;

if (root.dataset.powerOn === 'pending') {
  const land = () => {
    if (root.dataset.powerOn !== 'pending') return;
    delete root.dataset.powerOn;
    try {
      sessionStorage.setItem('hasSeenPowerOn', '1');
    } catch {
      /* private mode: it simply plays again next load */
    }
    removeEventListener('pointerdown', land);
    removeEventListener('keydown', land);
    removeEventListener('wheel', land);
    removeEventListener('touchstart', land);
  };

  setTimeout(land, DURATION);

  addEventListener('pointerdown', land, { once: true, passive: true });
  addEventListener('keydown', land, { once: true });
  addEventListener('wheel', land, { once: true, passive: true });
  addEventListener('touchstart', land, { once: true, passive: true });
}
