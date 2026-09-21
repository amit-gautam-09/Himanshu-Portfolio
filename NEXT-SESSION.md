# State of play — 2026-09-22

The site is **complete and deployed**. Everything below the next two sections
is the record of how it was built and the traps that cost time; read it before
changing the 3D, the grid or the hit targets.

Repo: `https://github.com/amit-gautam-09/Himanshu-Portfolio`

---

## Status: BUILT AND PUSHED — not yet deployed

The one outstanding action is **deploying to Vercel**, and it needs a human:
it starts with a browser login. Nothing else is blocking.

`main` is at `4a3f92d`, working tree clean, local and remote in sync.

### Deploy to Vercel — pick up exactly here

Verified 2026-09-22 against a **fresh clone**: `npm ci && npm run build`
produces all 11 pages including `404.html`, so the build will not surprise
Vercel. Node is pinned to `22.x` in `package.json` `engines`.

1. vercel.com → Sign Up / Log In → **Continue with GitHub**.
2. **Add New… → Project** → import **`Himanshu-Portfolio`**. If it is not
   listed, **Adjust GitHub App Permissions** and grant that repo.
3. Confirm the detected settings and change nothing:
   Framework **Astro**, Root Directory **`./`**, Build `npm run build`,
   Output `dist`. **Root Directory must stay `./`** — the repo root IS the
   site, there is no `site/` folder inside it. That is the field that goes
   wrong. No environment variables; the site is static.
4. **Deploy** (~1–2 min), then check: hero explodes on scroll, `/work` filter
   chips actually filter, a case study's 3D board spins, `/contact` WhatsApp
   opens a chat, `/nope` shows the broken-trace 404.
5. **Settings → Domains** → add `himanshugautam.world` and `www.` (accept the
   redirect), then create the DNS records **Vercel shows** at the registrar.

**Expected and correct:** until the domain is attached, canonical, OG and
sitemap URLs all read `https://himanshugautam.world` even on the
`.vercel.app` address. It is set once, in `astro.config.mjs`.

### The Vercel agent plugin was NOT installed

`npx --yes plugins add vercel/vercel-plugin` was run on 2026-09-22 and left at
its `Install? [Y/n]` prompt unanswered — `~/.claude/plugins/installed_plugins.json`
is unchanged. The installer package is `plugins` (vercel-labs) but it resolved
the plugin itself from `github.com/vercel/vercel-plugin`. It would install at
**user scope** — 37 skills, 5 commands, hooks and an MCP server active in
every project on this machine. Re-run it if that is wanted; **the deployment
needs none of it**.

Note for whoever picks this up: I cannot run that command. The sandbox blocks
`npx` of an unvetted package as "Code from External". The user must run it
with a `!` prefix.

---

## Everything that is finished

All five sheets, all eleven routes, building clean, verified at 1440 and 390.

| Route | Sheet | Notes |
|---|---|---|
| `/` | 1 Home | pinned hero, scroll-linked six-layer explode, metric count-up |
| `/work` | 3 Work index | capability filter, counts derived from the data |
| `/work/<5 slugs>` | 2 Case study | one template, five boards, S2–S5 scenes |
| `/about` | 4 About | timeline, capability matrix, depth markers |
| `/contact` | 5 Contact | WhatsApp + email, **no form** (client decision) |
| `/cv` | — | a real page, not a redirect |
| `/404` | — | broken-trace treatment |
| `/sitemap.xml`, `/robots.txt` | — | sitemap generated from the routes |

JSON-LD (Person) and Open Graph tags ship on every page from `Sheet.astro`.

```bash
cd site
npm install
npm run build
npm run preview   # http://localhost:4321 — test against THIS, never `npm run dev`
```

### Deployment

Static output, no adapter, no server runtime — the contact page reaches
WhatsApp and email directly, so there is nothing to run. Three paths are
committed and any one works:

- **GitHub Pages** — `.github/workflows/deploy.yml`, builds on push to `main`.
  Enable Pages → Source: GitHub Actions. With the custom domain set, no `base`
  is needed; on a project subpath you must set `base` in `astro.config.mjs`.
- **Netlify** — `netlify.toml`.
- **Vercel** — `vercel.json`.

`astro.config.mjs` has `site: 'https://himanshugautam.world'`, which is what
canonical URLs, the sitemap and OG tags derive from. Change it there, once.

### What is deliberately NOT built

- **`/lab` and `/lab/[slug]`.** The schema hides `/lab` from nav until it has
  at least one entry, and the client has none. `nav` already omits it. This is
  the schema's own rule, not an omission.
- **The contact form.** #3c draws rest and error states; the client chose
  WhatsApp + email instead on 2026-09-21. That is why there is no adapter.
- **Photographs, anywhere.** None exist that are publishable. Three of five
  boards are barred from showing any regardless.
- **Build-time 3D stills.** The scenes degrade to a captioned empty frame,
  which is honest, but a rendered still would be better.

---

## The session-2 "3D renders far too small" bug is CLOSED

Two separate things were tangled together under one symptom.

**The reported evidence never reproduced.** Session 2 measured
`closed.radius ≈ 0.80` against a geometry that really measures `0.0754`. Both
the offline rig and the live page now agree on `0.0754`. That capture was a
**stale cached module** — `/3d/*.js` are unhashed public assets, so the browser
was running a pre-fix `hero-stage.js`. None of the three suspects listed in the
old notes (`sphereOf` over-measuring, the `enig_pads_top` offset, a stale
`matrixWorld`) was the cause; all three are eliminated, and the offline rig
proves the closed pose is pose-identical to `buildS1(false)` to 1e-8.

**But the framing WAS wrong, for a different reason.** `setObject()` fits the
camera to the bounding **sphere** against the **vertical** FOV. Correct for the
near-square scene harness; wrong for a 1000x408 hero. The stackup is wide and
flat, so its sphere is mostly air, and the board landed ~275px wide where the
drawing it replaces occupies ~640px — the canvas visibly shrank the object on
swap.

Fixed in `public/3d/hero-stage.js`:

- The camera now fits the object's **projected bounding box** to *both* frustum
  axes (`fitDistance()`), recomputed per frame from the interpolated box, so a
  resize re-fits instead of cropping.
- The lens is **20°**, not the component's 45°. Fitting tight at 45° put the
  camera barely clear of the near corner and the board rendered as a wedge.
- The two poses are lerped as **boxes**, which is exact here: the parts
  translate linearly in y, so min/max interpolate exactly.

Verified against the built site: rest `dist 0.3373`, fully exploded
`dist 0.6551`, aspect 2.451, `target` tracks the box centre.

**One more bug surfaced while checking this, and is fixed.** `apply()` could
run before the mount had been laid out, fitting against `camera.aspect === 1`
and pushing the camera to `0.478` — the stackup at half size — with nothing to
recompute it, since no scroll or resize followed. It reproduced on some loads
and not others. `fitDistance()` now measures the aspect off the canvas box
rather than trusting the camera, and a `ResizeObserver` on the mount re-fits
whenever the stage changes shape. Three loads at different delays now all
report `0.3373`.

---

## The explode is now pinned (approved 2026-09-21)

Framing the scene correctly exposed a second, larger problem: **the explode was
never visible.** Measured at 1440x900 with the old mapping:

| scroll | explode `t` | stage on screen |
|---|---|---|
| 198 | 0.00 | top -53, bottom 355 |
| 370 | 0.50 | top -225, bottom **183** |
| 545 | 1.00 | bottom **8** — gone |

The fully exploded pose — the flow doc's *"one held moment — let it breathe"* —
did not exist on screen. No scroll mapping can fix that: the exploded stack is
~358px tall in a 408px stage.

`.hero__pin` (stage **and** copy) is now `position: sticky` over a 600px
`.hero__runway`, and the explode maps against the **runway**, not the hero's
height — mapping against the hero includes the runway and chases its own tail.
Measured after the change, at every scroll position from 150 to 600 the stage
holds at `top 24, bottom 432`, `t` runs a clean 0 → 1, and the mount dims to
0.35 as the pin releases and Positioning enters.

Both the pin and the runway are gated on `is-pinned`, which `hero-stage.js`
adds only when the scene takes over, and on `@media (min-height: 720px)`. With
no JS, no WebGL, reduced motion, or a short viewport, the hero is exactly the
block the reference draws and the mapping falls back to the hero's extent.

---

## Sheet 3 — Work index, built

`src/pages/work.astro`, against reference #3a. Measured against the reference:
content column x=512, cards at the page margin x=72 spanning 1296, scope panel
y=280 (ref 278) h=262 (ref 252), index card h=214 (ref 212).

New pieces:

- `FilterChips.astro` (inventory 4.3) — real `<button>`s in a `role="group"`,
  active chip `--live` fill / `--void` text, counts suffixing every label.
- `scripts/work-filter.js` — hides cards with the `hidden` attribute so they
  leave the accessibility tree too, announces the count through a polite live
  region, and no URL state (this filters a list, it is not navigation).
  Pressing the active chip again clears the filter.
- `BoardCard` gained `index` / `indexChip`, `capabilities`, `featured` and
  `milestone`.

**Counts are DERIVED from the board data, never authored.** Verified: every
chip reveals exactly the number it promises, all seven of them, and toggling
off returns to 5.

### Sheet 3's card is a different card

The reference draws the index card with LESS than the home card: the head row
takes one secondary chip ("Photographs available", or a short "Confidential"),
the standards row is dropped entirely, and a capability footer is added. That
footer prints the same words the filter chips carry, so the list is the legend
for the filter. `index` turns all three on together.

### Deviations from #3a, for sign-off

1. **`Simulation · 2`, not 3.** The reference's chip says 3, but its own card
   footers only ever claim Simulation on U2 — and U5 makes 2. The reference
   contradicts itself here, so the count follows the data. A chip that
   promises three boards and reveals two is a bug a visitor can see.
2. **U5 keeps its capability footer.** The reference draws none on the
   featured card. But U5 *is* counted by Power, Manufacturing and Simulation,
   so without the footer it appears under a filter with nothing on the card
   explaining why.
3. **U1's role.** The reference reads "Sole electronics engineer · 2023"; the
   shared data has no year, and `role` is used on Sheet 1 too. Left alone.
4. **The approved quotation is unused.** 07 §6 assigns *"What I cannot do is
   hand over the designs themselves, and I would not want to work somewhere
   that wanted me to"* to the ScopeNote on `/work`. The reference's panel copy
   does not contain it. Followed the reference; the quote is still available.
5. **No mobile artboard exists for 3a.** Follows #1b's rules: rail content
   moves above, one column, mobile chip subsets.

### A pre-existing Sheet 1 bug this surfaced

**`.iso-grid` never collapsed below the breakpoint.** The rail and gap are
hidden at 900px, but the 12 tracks survived and `.content` stayed pinned to
`grid-column: 5 / span 8`. At 390 that rendered the positioning paragraph
**225px wide, indented 145px**, with full-width content directly above and
below it. It was in the "entire 390 layout" item nobody had checked. Fixed in
`base.css` beside the grid definition, so every sheet inherits it.

Also caught in my own new CSS: `.work-boards { padding: 28px 0 72px }` sits on
the `.bleed` element, and the shorthand reset its `padding-inline` to 0,
floating the cards 12px outside the page margin. Use `padding-block` on
anything that is also a `.bleed`.

---

## The scene no longer eats the page scroll

Reported from a real browser, not caught by any probe: with the pointer over
the stackup, the wheel zoomed the camera and the page did not move. The object
is 1000x408 in the middle of the hero, so that is most of the screen.

`OrbitControls` owns the wheel — its handler calls `preventDefault()` and
dollies — and `connect()` also sets `touch-action: none` on the canvas, so a
swipe over the stackup could not scroll the page on a phone either. Both are
defaults nobody chose.

Now, in `hero-stage.js`:

- `controls.enableZoom = false` — the handler returns *before* `preventDefault`,
  so the wheel reaches the document. Zoom was never in the spec.
- `controls.enablePan = false`
- canvas `touch-action: pan-y` — horizontal drag orbits, vertical swipe scrolls
- azimuth and polar clamped to DIR ±25°, which is what 05 §S1 asks for
  ("drag orbits ±25°"). Verified: a 120px drag lands exactly on 13.66°, the
  38.66° base minus 25°
- `apply()` re-derives the camera DIRECTION from the camera each frame instead
  of forcing DIR, so **an orbit survives the next scroll**. Before, scroll and
  drag fought: any scroll snapped the view back

Verified with real CDP input events (`--wheel`, `--drag` in `tools-shot.mjs`):
wheel over the canvas now moves the page 0 → 300 while the camera distance
tracks the explode, and an orbit to 13.66° is still 13.66° after scrolling.

**Lesson for sheets 2-5:** every `three-d-stage` embed inherits these
defaults. Any scene placed in the page flow needs the same four lines, or it
will trap the scroll.

---

## Browser automation: use the CDP harness, not the extension

The Chrome extension **would not connect** this session (`list_connected_browsers`
returned empty with Chrome running and focused). Do not spend time on it.

What replaced it, and what produced every measurement above:

```
site/tools-shot.mjs        # zero-dependency: Node 24 global WebSocket + CDP
node tools-shot.mjs --url http://localhost:4321/ --w 1440 --h 900 \
  --out a.png [--scroll 412] [--eval "expr"] [--wait 2500] [--reduced] [--mobile]
```

It launches headless Chrome with `--use-angle=swiftshader
--enable-unsafe-swiftshader` (WebGL renders correctly), sets exact viewport
metrics via `Emulation.setDeviceMetricsOverride`, can emulate
`prefers-reduced-motion`, scrolls, evaluates any expression in the page and
prints the JSON, then screenshots. It is faster and far more reliable than
driving a visible window, and it needs no window focus — **the session-2
gotchas below no longer apply.** It is a dev tool living beside the project,
not part of the site; `astro build` ignores it.

The design reference renders headlessly too. `Portfolio Home.dc.html` lays its
turns out **horizontally** in a flex row, in reverse order (5a first, 1a at
x = 19522), so scroll to an id's `getBoundingClientRect().left`, not its top.

---

## Fixed in session 2 (all verified in-browser)

1. **Canvas was 1px tall.** Hiding the fallback with `[hidden]` collapsed
   `.hero__stage` to zero height; the mount is `inset: 0` against it, so the
   renderer latched at 1250×1. Now the fallback is hidden **in flow** via
   `.hero__fallback.is-replaced { visibility: hidden }`, and
   `hero-stage.js` toggles that class instead of `hidden`.

2. **`background="transparent"` is not a valid `THREE.Color`.** The component
   feeds the attribute straight to `new THREE.Color()`, which warned and fell
   back to opaque black over the `--void` ground. Now passes `#08090B` and
   then makes the canvas genuinely transparent via
   `stage._renderer.setClearAlpha(0)` + `stage.style.background = 'transparent'`,
   so the page's dot texture shows through as it did behind the SVG.

3. **Astro scoping — systematic, hit four places.** See below.

### The Astro scoping trap (will bite again on sheets 2–5)

A component's root element carries **its own** scope id, not the parent's. So a
parent rule like `.nav__logo--mobile { display: none }` compiles to
`.nav__logo--mobile[data-astro-cid-PARENT]` and **never matches**.

`:global()` alone is not enough either: a bare `:global(.x)` is specificity
(0,1,0) and loses to the child's own `.root[data-astro-cid]` at (0,2,0).

**The fix used throughout is an *anchored* `:global()`** — anchor it to an
element that does carry this component's scope, giving (0,3,0):

```css
.hero__fallback :global(.hero__svg--narrow) { display: none; }
```

Fixed in four places, each of which was visibly wrong:

| File | Symptom |
|---|---|
| `Nav.astro` | **both** logos rendered side by side in the nav |
| `index.astro` | **both** stackups rendered — hero stage was 608px (408 + 200) |
| `MetricCell.astro` | dimension line would not hide at 390 |
| `IsolationPanel.astro` | logo mark would not hide at 390 |

---

## Verified in session 2 (1440) — kept as the measured baseline

- **Barrier centre: 445.49px at a true 1440 client width.** The design
  reference draws it at 445. The derived formula is right.
- Hero stage exactly **408px** tall; one stackup, one logo
- `h1`: **104px**, Archivo, `font-stretch 78%`, weight 700, letter-spacing
  −3.64px (= −0.035em × 104)
- Board card `padding-left: 62px`; trace `height=296` fitted at 296; via `r=5`
  (circular, not ovalised)
- Power-on sequence ran and set `sessionStorage.hasSeenPowerOn = "1"`
- Renderer sizes correctly to 1000×408 once the page is visible
- CV button reads "Download CV (PDF, 53 KB)" — real file size

## Browser-automation gotchas — SUPERSEDED, kept only for a visible window

None of this applies to `tools-shot.mjs`, which is headless and needs no focus. It
matters only if you drive a real Chrome window again.

- **The Chrome window must be visible and focused.** If it is minimised or the
  tab is backgrounded, `document.visibilityState` is `hidden`, **rAF does not
  run**, the canvas latches at 1×1, and `computer:screenshot` times out with
  "renderer may be frozen". This is an environment artifact, *not* a product
  bug — the component's `_loop` calls `fit()` every frame and self-corrects the
  moment the page is shown.
- **`resize_window` silently no-ops when the window is maximised** — it reports
  success and nothing changes. Un-maximise first.
- Driving the window from PowerShell works and is what finally got a true 1440:

```powershell
$sig = '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint); [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
Add-Type -MemberDefinition $sig -Name W -Namespace N
$p = Get-Process chrome | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
[N.W]::ShowWindow($p.MainWindowHandle, 1)                      # un-maximise
[N.W]::MoveWindow($p.MainWindowHandle, 0, 0, 1469, 800, $true) # -> clientWidth 1440
[N.W]::SetForegroundWindow($p.MainWindowHandle)
```

On this machine (1536×864 @ DPR 1.25) a **1469px window gives exactly 1440
client width**. For the 390 artboard, account for the ~15px scrollbar and ~14px
window chrome the same way.

---

## Visual checklist — Sheet 1 is CLOSED

Every item measured against `npm run preview`, not read off a screenshot.

At **1440**:

- [x] `BrokenRule` ratio is exactly 3.00 (lead 299, tail 896)
- [x] Card hover: border `#23272E` → `#333942`, via stroke → `#F2A93B`, core
      fills `--void`, `trace-pulse` runs. `transform: none`, `box-shadow:
      none` — no lift, no scale, no shadow
- [x] Metric strip: line and value share `--d-slow` + `--e-settle`; heads snap
      at `--d-fast` delayed by `--d-slow - --d-fast`
- [x] Explode tracks scroll; recedes and dims as the metric strip enters —
      scroll 0/150/280/412/600/760, stage holds at `top 24, bottom 432`
- [x] Plated vias visible at rest, hidden once exploding
- [x] Nav link targets pass WCAG 2.5.8 by the spacing exception (centres
      63–72px apart)

At **390**:

- [x] Rail collapses to a 2-column spec strip (`165px 165px`) above the content
- [x] Barrier horizontal under the strip, annotated `8.0 mm`
- [x] Hero 44px; CTA full-width (350 of 390) and now 44px tall
- [x] Callouts: **#1b has no per-layer callouts** — it carries a bracket and
      the caption `1.60 mm overall · 6 layers`. That caption is real HTML and
      sits OUTSIDE `.hero__fallback`, so it survives the 3D swap. Earlier
      worry that the scene hides the mobile callouts was unfounded
- [x] Chip subsets match `#1b`: U1 shows Flown / XBee / Teensy, U2 shows
      Released / 380–400 VDC bus / 93 % @ 84 W + the confidentiality chip;
      standards chips dropped
- [x] Only the mobile logo renders; metric dimension lines hidden; iso-panel
      mark hidden

Cross-cutting:

- [x] Power-on: `pending` at load, still pending at +200ms, cleared the instant
      a key arrives, `hasSeenPowerOn` set; a second load in the same session is
      never pending. (Tested in a same-origin iframe — it shares
      `sessionStorage`, and a plain reload races the 1600ms timer.)
- [x] `prefers-reduced-motion`: no pin, no runway, hero back to 792px, SVG
      retained, **no three.js at all**, values printed, `--d-slow: 0ms`
- [x] Focus ring: 2px solid `#F2A93B` at 2px offset
- [x] Mobile nav disclosure opens and closes; panel targets are 44px

### Accessibility defects found and fixed

The PRD makes WCAG 2.2 AA a **Must** (G-2) and the TRD sets ≥24×24 (2.5.8).
Measured, four things missed, three of them contradicting comments that
claimed otherwise:

| Target | Was | Now |
|---|---|---|
| `.hero__cta` | 41px — handoff says "13px padding (≥44px hit target)" | `min-height: 44px` |
| `.nav__toggle` | 20×20; README claimed ≥44 | `::after { inset: -12px }` → 44×44, **no layout change** |
| `.nav__panel-link` | 41px; its own comment said `/* >=44px hit target */` | `min-height: 44px` |
| `.title-block__links a` | 316×**14** on 20px centres — fails 2.5.8 outright, and too close together for the spacing exception | `min-height: 24px` |

`.nav__brand` stays 140×20: it passes via the spacing exception (nothing else
within 24px) and growing it would push the nav row taller than the artboard.

Padding alone never reaches these floors, because it is added to the type's
own line box. State the floor.

---

## Client input — ALL RECEIVED, nothing is waiting on him

Signed off 2026-09-21: every decision in `README.md` → "Decisions that were not
designed", the Sheet 3 deviations, the hero pin and runway, and the 20° lens.
The Sheet 5 copy is approved as drafted.

Applied and live: `contact@hixome.com`, **no LinkedIn anywhere** (asked for and
declined — the reference draws one, its absence is deliberate),
`site: 'https://himanshugautam.world'`, `cv.updated: '2026-09-21'`, and the
WhatsApp number in `site.ts` as `contact.whatsapp`
(`https://wa.me/917678163826`; wa.me needs it with no `+`, spaces or dashes).

**Sheet 5 is therefore unblocked** — WhatsApp click-to-chat plus the email
address, no form, no backend, site stays `output: 'static'`.

### The assets do not exist, and that is now a design constraint

He has **no** CANSAT photography fit to publish, **no** bench-supply progress
photos, and **no** portrait. Consequences, all decided:

- **U1's photography claim was softened, not dropped.** "Flight photography
  available" / "Photographs available" sat beside three "Confidential" chips
  and read as *this one you can see* — a promise the case study would then
  fail. Both now read **"on request"**: true, still distinguishes U1 from the
  client work, promises the page nothing, and matches the register of
  "reasoning published, design not". Restore the reference wording and build a
  gallery if publishable photography ever arrives.
- **The site carries no photographs at all.** This costs less than it sounds:
  three of five boards are legally barred from showing any, so the case-study
  template was always going to work without images. Do not design Sheet 2
  around a hero image.
- **`/lab` is deferred, not built.** The schema hides it from nav until it has
  at least one entry, and there is none. `nav` already omits it. Leave it.
- **Sheet 4 must work without a portrait.** The docs call it optional and
  forbid a stock substitute, so build About on type and the timeline alone.

### Content still genuinely missing

Only one thing, and it is not blocking: the real dielectric numbers for S1.
He asked me to choose, so the approved six-layer build below is a **standard
published stackup, not a board of his** — and the page must say so. That is
the explicit second option doc 07 §8.3 allows.

---

## Sheet 4 — About, built

`src/pages/about.astro` + `src/data/about.ts` + `src/components/Timeline.astro`,
against reference #3b. Measured: title and content column x=512 y=129, rail
x=72, via x=524, spine `left:19px width:2px --rule`, work-auth panel 72/1296 —
all matching the reference.

**The prose typography landed exactly.** Paragraph tops 328 / 490 / 720 / 882
give gaps of 162 / 230 / 162 against the reference's 162 / 231 / 161, which
pins font-size 21, line-height 1.62 and the 26px paragraph margin. The
constant +37 offset against the reference is a box-metrics artifact (its `<p>`
boxes start higher off a larger line-height), not a visual difference.

Emphasis is load-bearing and is in the data, not the markup: paragraphs 1 and
4 carry `lead: true` and render `--silk`; 2 and 3 sit at `--silk-dim`. The
claim and the conclusion are foreground; the evidence between them is not.

### Timeline — how the ovalising trap is avoided

The note said: do not draw the spine as one long polyline with
`preserveAspectRatio: none`. The reference's own answer turns out to be
simpler than a workaround — **nothing scales at all**:

- the spine is a plain 2px `<div>` that stretches vertically;
- every via is its own fixed **16×16** SVG at natural size;
- the 45° entry and exit caps are fixed 60×24 and 60×30 SVGs.

`left: 19px` on the 2px spine centres it on 20, which is where the caps' paths
and every via centre land. Verified circular at 1440 and at 390.

Via states: `normal` = `--rule-2` ring, `notable` = `--live` ring (CANSAT
finalist, patent), `current` = `--live` ring with a filled `--live` core and
the date lifted to `--live`. Only one entry is ever `current`.

### DepthMarker finally used

It was built in session 1 and never rendered. About is what it was for.
Its labels were capitalised (`Owned`); #3b draws them lowercase, so they now
match — `studied` set in sentence case beside `owned` reads like an apology.

### Content note

07 §6 assigns an approved quotation to `/about`: *"I have deliberately
included a section on what I would do differently now…"*. It is **not** quoted
verbatim in #3b, but its substance is there — paragraph 2 makes the same claim
in different words ("the distance between how I designed that board and how I
would design it now is the most useful thing I can show you"). Followed the
reference. Nothing is missing, but if he wants the sentence itself, it belongs
at the head of that paragraph.

### The padding trap bit again

`.about-auth { padding: 44px 0 72px }` sits on a `.bleed` and the shorthand
reset its `padding-inline`, floating the work-authorisation panel 12px outside
the page margin — exactly what `.work-boards` did on sheet 3. **Third time:
use `padding-block` on anything that also carries `.bleed`.**

---

## S1 rebuilt as a real six-layer — DONE 2026-09-21

The hero drawing labels 35 µm top copper, 0.10 mm prepreg, 35 µm ground
plane, 0.71 mm core, 35 µm power plane, 35 µm bottom copper, and calls the
result "six-layer · 1.60 mm overall". Both claims are wrong:

- **Four copper layers, not six.** Fabs count copper, and this stack is top,
  ground, power, bottom. The `L1`–`L6` rail numbers count the dielectrics as
  layers, which no fab does.
- **They sum to 0.95 mm** (0.98 with soldermask), not 1.60 — out by 0.62 mm.

It matters because the metric strip claims `6 layers` and U4 is a "Six-layer
RK3399 carrier board". The hero exists to illustrate real six-layer work and
currently argues against it, to an audience of hardware engineers.

**Approved build** — a standard published 1.60 mm six-layer, summing exactly:

| Item | Each (mm) | Count | Total |
|---|---|---|---|
| Soldermask | 0.025 | 2 | 0.05 |
| Copper | 0.035 | 6 | 0.21 |
| Prepreg | 0.18 | 3 | 0.54 |
| Core | 0.40 | 2 | 0.80 |
| | | | **1.60** |

Order, bottom to top: mask, L6, prepreg, L5, core, L4, prepreg, L3, core, L2,
prepreg, L1, mask.

**It is a published generic stackup, not one of his boards, and the page must
say so** — that is the second option doc 07 §8.3 allows, and the client chose
it by delegating. A caption in the register of "Representative model. Not the
client's design." (which `FramedScene` already uses for S3–S5).

### What shipped

`StackupSVG.astro` now draws **11 bands** — 6 copper as thin foil between 3
prepregs and 2 cores — with a callout per band, `L1`–`L6` down the left on the
COPPER layers only, and a three-line summary that closes the arithmetic:
`1.60 mm overall` / `incl. 2 × 25 µm mask` / `representative build`.
`builders.js` carries the matching `S1_LAYERS` and thicknesses;
`hero-stage.js` has an 11-entry `LAYER_INDEX`.

Layer assignment is ordinary and defensible: L1/L3 reference the L2 ground
plane, L4/L6 reference the L5 power plane.

**The framing was preserved exactly**, which was the goal — scene units hold
the same ~0.0428 overall height, so:

| | before rebuild | after |
|---|---|---|
| rest `dist` | 0.3373 | **0.3372** |
| exploded `dist` | 0.6551 | **0.6551** |

Verified across scroll 0 / 280 / 412 / 600: vias visible only closed, pin
holds at `top 24, bottom 432`, mount dims to 0.35 on release. Offline rig
passes — 41 meshes, zero world-space delta against `buildS1(false)`.

### The bug this caused, and the fix

`buildS1` kept its **own copy** of the exploded gap (`0.022`) while
`hero-stage.js` kept another. Halving one for the taller stack and not the
other left the stack permanently half-open — the offline rig caught it in one
run, before a browser was involved. The constant now lives once, exported as
`S1_EXPLODED_GAP` from `builders.js` and imported by `hero-stage.js`.

**Watch for this shape elsewhere:** S2–S5 will each need an explode or cutaway
parameter, and the same duplication is available to make again.

### Callout column limit

The column runs out of viewBox at **~24 mono characters** — `35 µm · L6 bottom
copper` uses all of it. Two longer summary lines clipped silently on the first
attempt; the text column was shifted 8 units left and the summary split into
three short lines. Measure `getBoundingClientRect().right` against the SVG's
own right edge when adding labels.

---

## If you pick this up again

Nothing is blocking. In rough order of value:

1. **Build-time stills for the 3D scenes.** Each scene currently degrades to a
   captioned empty frame for no-WebGL, low-power and reduced-motion visitors.
   A rendered PNG per scene, shipped in the same commit as the scene, is what
   the PRD asks for.
2. **Lighthouse and axe-core passes** against the deployed URL. The budgets
   are in `04-TRD.md` §7; the acceptance criteria want ≥90 performance and
   ≥95 accessibility on mobile, and zero serious axe violations.
3. **Real-device testing**, especially Safari on iOS — the pinned hero and the
   `touch-action: pan-y` on the canvases are the two things most likely to
   behave differently there.
4. **OG images.** The tags ship; there is no image behind them yet.
5. **`/lab`**, once there is a first entry to put in it.

If photography ever arrives, U1 is the only board allowed to show it: restore
the reference's "Photographs available" wording and build the gallery.

---

