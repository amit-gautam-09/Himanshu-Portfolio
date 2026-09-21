/**
 * Capability filter, sheet 3.
 *
 * Progressive enhancement: the markup ships every board visible and the
 * buttons inert. If this never runs, the page is a complete list of five
 * boards — which is the honest fallback, not a broken one.
 *
 * Filtering hides cards with the `hidden` attribute rather than a class, so
 * they leave the accessibility tree as well as the layout. The count is
 * announced through a polite live region: a sighted visitor sees four cards
 * become two, and a screen reader is told the same thing.
 *
 * No URL state. This filters what is already on the page; it is not
 * navigation, and it must not put six entries in the back button.
 */
const group = document.querySelector('[data-filters]');
const cards = [...document.querySelectorAll('[data-capabilities]')];
const status = document.querySelector('[data-filter-status]');

if (group && cards.length) {
  const chips = [...group.querySelectorAll('[data-filter]')];

  const apply = (facet) => {
    let shown = 0;
    for (const card of cards) {
      const list = (card.dataset.capabilities || '').split('|').filter(Boolean);
      const match = facet === '*' || list.includes(facet);
      card.hidden = !match;
      if (match) shown += 1;
    }

    for (const chip of chips) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === facet));
    }

    if (status) {
      status.textContent =
        facet === '*'
          ? `Showing all ${shown} boards.`
          : `Showing ${shown} of ${cards.length} boards: ${facet}.`;
    }
  };

  group.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-filter]');
    if (!chip || chip.disabled) return;
    // Pressing the active chip again clears the filter — otherwise the only
    // way back to everything is to find "All", and the pressed state looks
    // like a dead end.
    apply(chip.getAttribute('aria-pressed') === 'true' ? '*' : chip.dataset.filter);
  });
}
