# Himanshu Gautam — portfolio

An Astro static build of the ISOLATION design handoff. Five designed sheets,
eleven routes, no server runtime.

```bash
npm install
npm run build
npm run preview    # http://localhost:4321
```

**Test against `preview`, not `dev`.** The dev server's HMR client served a
stale copy of a page's scoped CSS during the build, which looked exactly like
a specificity bug and was not. `build && preview` is what ships.

`tools-shot.mjs` is a zero-dependency headless-Chrome harness used to measure
every layout in this repo against the design reference — exact viewports,
scroll, in-page eval, reduced-motion emulation, screenshots. Read its header.

## Structure

| Path | What |
|---|---|
| `src/pages/` | the eleven routes; `work/[slug].astro` generates all five case studies |
| `src/data/` | all content — `boards`, `cases`, `about`, `site` |
| `src/components/` | 22 components; the inventory in the handoff names most of them |
| `public/3d/` | vanilla ES modules, resolved by import map, not bundled |

## Deployment

Static, no adapter. GitHub Pages (`.github/workflows/deploy.yml`), Netlify
(`netlify.toml`) and Vercel (`vercel.json`) configs are all committed. The
canonical host is set once, in `astro.config.mjs`.

## Decisions that were not designed

**All signed off by the client on 2026-09-21.** Each is listed in
`09-COMPONENT-INVENTORY.md` §7 or follows from a gap in the artboards. They are
kept here as the record of what was decided and why, not as open questions.

1. **Mobile nav panel.** §7 lists this as undesigned. What ships is the minimum
   honest thing: a real disclosure button revealing the same four links in the
   nav's own type scale, built only from existing tokens, ≥44px hit targets. It
   invents no new visual language. `src/components/Nav.astro`.

2. **The breakpoint is 900px.** Only 1440 and 390 were designed. One switch
   point is used throughout, chosen so the rail + barrier + content grid has
   room before it collapses.

3. **Mobile chip curation.** The 390 artboard carries fewer chips per card than
   1440 (U1 drops "2 round boards", every board drops its standards chips). This
   is expressed as `specsMobile` / `standardsMobile` subsets in
   `src/data/boards.ts`; anything not named is hidden below the breakpoint
   rather than duplicated into a second markup tree. The confidentiality chip
   always survives — the dashed border is the signal (§9.1).

4. **Scroll mapping for the explode — and the pin it forced.** *Approved
   2026-09-21.* The motion spec's 0/8/22/32% are percentages of the designed
   page, which does not survive a page of unknown height. The ratios are
   preserved (8/32 = 0.25, 22/32 = 0.6875), position-mapped, no easing.

   They are anchored to a **scroll runway**, not to the hero's height. Anchored
   to the hero — the first attempt — the explode was never actually seen:
   measured at 1440x900, the stage's bottom edge was **8px from the top of the
   screen** at full explode, because the exploded stack is ~358px tall in a
   408px stage and leaves the viewport under any scroll at all. No mapping
   fixes that; only pinning does.

   So `.hero__pin` (stage **and** copy together) is `position: sticky` over a
   600px `.hero__runway`, and the explode maps against the runway. Stage and
   copy pin as one block because pinning the stage alone would slide the
   headline up through the drawing. Both are inert until `hero-stage.js` adds
   `is-pinned`, so with no JS, no WebGL, or reduced motion the hero is exactly
   the block the reference draws. Below 720px of viewport height the block
   cannot fit, so it stays in flow and the mapping falls back to the hero's
   extent.

5. **A 20° lens on the hero scene.** The vendored stage defaults to 45°, which
   is right for its near-square harness. Filling a 2.45:1 hero at 45° puts the
   camera barely clear of the near corner and the board renders as a wedge.
   20° holds the six layers parallel across the board, which is what the art
   direction asks for ("copper reads as sheet metal, not a printed line").

6. **Sheet 3's filter counts are derived, not authored.** `capabilityCounts()`
   computes each chip's number from the boards' own `capabilities`, so a chip
   can never promise more boards than pressing it reveals. This makes
   `Simulation` read **2** where the design reference draws 3 — the reference
   disagrees with its own card footers there, which claim Simulation on U2
   alone. See `NEXT-SESSION.md` for the full reconciliation.

7. **Sheet 3's card is a reduced card.** `index` drops the standards row,
   promotes one secondary chip into the head, and adds the capability footer.
   The full chip set belongs on the case study, where it has room to mean
   something. This is what #3a draws, not an invention.

8. **The hero stackup was rebuilt as a real six-layer.** *Client delegated the
   dielectric numbers 2026-09-21; this is what was chosen.* The handoff's
   drawing showed four copper layers — top, ground, power, bottom — with one
   prepreg and one core, numbered the dielectrics `L1`–`L6` to reach "six",
   and totalled **0.95 mm** against a stated 1.60 mm. Fabs count copper and
   this site's audience is hardware engineers, so the drawing now shows a real
   foil build: six copper layers, three prepregs, two cores, summing to 1.60 mm
   with soldermask. The numbers are a **standard published build, not one of
   his boards**, and the drawing says so — the second option 07 §8.3 allows.
   This is the one place the implementation overrides the design reference on
   engineering grounds rather than on a documented conflict.

---

## Discrepancies between the docs, and how each was resolved

The handoff README states: *"Where this README and the design reference
disagree, the design reference is the source of truth."* That rule decided
these.

1. **`Chip` variant `status-progress`.** The component inventory (1.3) specifies
   `--live` @45% border **plus a `--state-progress-wash` fill**. The design
   reference's U5 chip has the border and **no fill**. Followed the design
   reference; `--state-progress-wash` remains defined in `tokens.css` and unused.

2. **The logo's two arcs.** The inventory (1.1) says *never* recolour them to
   match — the warm/cool split is the mark. The design reference's work
   authorisation panel draws **both arcs in `--iso`**. Read as deliberate: that
   panel sits wholly on the isolated side of the barrier. Implemented as
   `Logo tone="iso"`, used by `IsolationPanel` only, with the default left as
   the split mark.

3. **Token vocabulary.** §9 names the ground tokens `--hv-void` / `--hv-substrate`
   / `--hv-hairline`; the inventory and design reference use `--void` / `--panel`
   / `--rule` for the same values. Each hex is declared once under the name the
   components consume, with the `--hv-*` names aliased onto it, so anything
   copied straight out of §9 still resolves. `--void-deep` (`#050608`) is used
   throughout the design reference but missing from §9; it is defined.

4. **Two copies of `Portfolio Home.dc.html`.** The bundle ships one at the
   project root and one in `design-reference/`. They contain all nine turns and
   differ only in turn ordering and one annotation caption
   (`1a — Home · 1440 desktop` vs `… 1440 × desktop (turn 1)`). The root copy —
   the one open at handoff — was used.

5. **`three-d-stage.js`'s own header comment** says the stage has *"NO
   environment map"* and to cap metalness near 0.38. That is stale boilerplate
   from the template it was built from. The delivered file **does** carry the
   procedural bench environment (`PMREMGenerator`, `scene.environment`) and the
   §9.1 rig exactly — key softbox 3.0, `--iso` fill 0.30, `--live` rim 0.22. The
   `pcb-lib.js` figures (copper `metalness 0.92`) are therefore correct as
   shipped, per §9.1. Nothing was changed.

---

## The 3D scene

`public/3d/` is served raw, not bundled: the stage resolves `three` through an
import map at runtime, so Vite must not touch it. The import map and its SRI
hashes are the harness's pinned set.

| File | Provenance |
|---|---|
| `three-d-stage.js` | **byte-identical** to the handoff |
| `pcb-lib.js` | **byte-identical** to the handoff |
| `builders.js` | S1–S5 builder bodies **byte-identical**; see below |
| `hero-stage.js` | new — the site's own wiring |

**Why `builders.js` exists.** The handoff's `scenes.js` is a self-executing
module that queries the `3D Scenes.html` harness DOM at import time (`#poseBox`,
`#btnAssembled`, the `[data-scene]` tabs) and throws on a page that has none.
The handoff itself calls the harness *"reference for wiring"* and says the site
embeds one scene per page. So the builder bodies are lifted verbatim and wrapped
in a `createScenes(THREE)` factory; only the harness wiring was dropped. Verified
with `diff`: lines 7–419 of `scenes.js` are unchanged.

**Three things `hero-stage.js` handles that are easy to get wrong:**

- **Plated vias.** `buildS1` draws the via barrels *only* in the assembled
  build — a continuous barrel through a separated stack would be a lie. The
  hero builds exploded and interpolates, so the barrels are taken from the
  assembled build and hidden as the stack opens. No geometry is duplicated.
- **Camera framing.** `setObject()` frames for the extent it is given. Framed
  for the exploded stack, the closed 1.60 mm board renders at 71% of frame.
  Both poses are measured and the camera is interpolated between them using the
  component's own formula, so each end matches what `setObject` would have
  chosen. This reaches for `stage._camera` / `stage._controls` and degrades
  gracefully if either disappears.
- **Reduced motion keeps the SVG and never loads three.js.** The requirement is
  that the stackup *"holds its default exploded pose with callouts visible"*.
  The SVG has the callouts; the 3D scene does not. Swapping it in would lose
  meaning rather than preserve it.

**Verified offline** (three.js 0.184, no DOM): all nine layer/mask/pad groups
resolve by name; at t=0 all 36 meshes — vias included — are pose-identical to
`buildS1(false)` to 0.00000000; S2–S5 all build.

### Not done here

Each scene still needs **a rendered still** generated at build time for the
no-WebGL / low-power / reduced-motion fallback, served in the same frame with
the same registration marks and caption. Home currently falls back to the SVG
cross-section, which is the right drawing for S1 but does not generalise to
S2–S5.

---

## Fidelity notes

- **Styling a child component's root needs an *anchored* `:global()`.** Astro
  gives a component's root element its OWN scope id, so a parent rule like
  `.nav__logo--mobile { display: none }` compiles to
  `.nav__logo--mobile[data-astro-cid-PARENT]` and never matches. A bare
  `:global(.x)` is not enough either — at (0,1,0) it loses to the child's own
  `.root[data-astro-cid]` at (0,2,0). Anchor it to an element carrying this
  component's scope:

  ```css
  .hero__fallback :global(.hero__svg--narrow) { display: none; }
  ```

  This was wrong in four places at once and each was visibly broken (two logos
  in the nav, two stackups in the hero). Watch for it on every sheet.

- **`TraceVia` is regenerated, never scaled.** The inventory is explicit that
  `height:100%` + `preserveAspectRatio:none` ovalises the via ring and flattens
  the 45° chamfer. Geometry lives in `src/scripts/trace-geometry.js`, shared by
  the build and by `trace-fit.js`, which re-derives the path at each card's
  measured height on load, resize and after webfonts land.
- **Mobile SVG labels are real HTML.** Build note 5: a 12px label in a 980-unit
  viewBox shown at 350px renders at ~5px. The 390 stackup drops its in-SVG
  callouts and puts "1.60 mm overall · 6 layers" beside the drawing.
- **Card hover changes border tone and the trace only.** No lift, no scale, no
  shadow. The amber pulse travels the trace via a normalised `pathLength`, so it
  follows the path at any card height.
- **The CV label is measured, not typed.** The design reads "Download CV (PDF,
  148 KB)" and the handoff flags that as a placeholder. `src/data/site.ts` stats
  the real PDF at build time — currently **53 KB**. It cannot drift.

---

## What is not built yet

Sheets 2–5, in the handoff's recommended order — Sheet 2 last, because the
signal-chain diagram is the hardest single component:

- **Sheet 3** Work index — scope note above the cards, filter chips with counts,
  U5 featured full-width with its dashed trace and milestone panel
- **Sheet 4** About — timeline (do **not** draw the spine as one long polyline
  with `preserveAspectRatio:none`; it ovalises the rings), capability matrix
  with `DepthMarker`s
- **Sheet 5** Contact — the form in both designed states
- **Sheet 2** Case study U2 — `SignalChain` as **one CSS grid with explicit row
  numbers**, barrier in column 2 spanning `grid-row: 1 / 12`, transformers on
  the same row as the stage they serve. Not pixel offsets — that drifted out of
  alignment in the first implementation.

`DepthMarker` is built and unused until Sheet 4. `TraceVia`'s `broken` state is
built and unused until there is a 404.

### Still open from inventory §7

- Case-study pages for U1, U3, U4, U5 (only U2 is designed; the template covers them)
- Mobile layouts for sheets 3–5
- Form success state
- Any page beyond the five sheets

### Content gaps

- `src/data/site.ts` has **placeholder** email and LinkedIn URLs.
- **CANSAT photographs.** U1 is his own work and flight photography exists; the
  card already carries the chip saying so. The handoff calls placing real photos
  there *"the single biggest credibility upgrade available to this site."* No
  other board may carry images.
- Fonts load from Google Fonts. Self-hosting is worth it — but Archivo's
  variable `wdth` axis is required, so do not substitute a static cut.
- three.js loads from unpkg with SRI. Consider vendoring for a production deploy.

---

## A note on the import

No import was needed. The complete handoff bundle was already on disk at
`../Claude Design Prompts Implementation-handoff/`, containing all 20 files.
The `claude_design` MCP requires `/design-login`, which only you can run — but
nothing was missing, so it was never used.
