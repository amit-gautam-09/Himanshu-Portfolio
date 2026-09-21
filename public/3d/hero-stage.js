/**
 * Home hero — the S1 six-layer stackup, scroll-linked.
 *
 * Progressive enhancement. The StackupSVG is already painted and IS the
 * drawing: if WebGL is unavailable, or the visitor prefers reduced motion,
 * this module leaves it alone and does nothing. There is no spinner and no
 * loading state, ever.
 *
 * prefers-reduced-motion keeps the SVG deliberately: it holds the default
 * exploded pose with the dielectric callouts visible, so the layer count and
 * thicknesses still read. The three.js scene carries no callouts, so
 * swapping it in would lose meaning rather than preserve it.
 *
 * Scroll mapping (motion spec 02, position-mapped, NO easing):
 *     0%  assembled, 1.60 mm read as one object
 *     8%  layers begin separating
 *    22%  fully exploded
 *    32%  recedes and dims as the metric strip enters
 * Those percentages are of the designed page. They are anchored instead to
 * the hero's scroll RUNWAY — the distance the pinned block holds for —
 * which keeps the ratios (8:22:32 → 0.25 and 0.6875) and guarantees the
 * stack is still on screen when it finishes separating. Mapped against the
 * page, or against the hero's own height, the exploded pose only ever
 * existed above the top of the viewport.
 *
 * The scene is built ONCE, exploded, and interpolated. It is never rebuilt
 * or re-set on scroll, because setObject() re-frames the camera and that
 * would pop. Two consequences are handled explicitly below: the plated vias
 * and the camera framing.
 */
import { createScenes, S1_EXPLODED_GAP } from './builders.js';
import { fitDistance, aspectOf } from './fit-camera.js';

const EXPLODE_START = 0.25;
const EXPLODE_END = 0.6875;
/* Imported, never re-declared. Halved from 0.022 when the stack went from 6
   bands to 11: ten gaps at 0.011 spread the same ~0.11 that five gaps used
   to, so the exploded envelope — and the hero's framing with it — stays put. */
const S1_GAP = S1_EXPLODED_GAP;

/** Distance of each part above the bottom of the stack, in gap units. */
const LAYER_INDEX = {
  L6_bottom_copper: 0,
  soldermask_bottom: 0,
  prepreg_3: 1,
  L5_power_plane: 2,
  core_2: 3,
  L4_signal: 4,
  prepreg_2: 5,
  L3_signal: 6,
  core_1: 7,
  L2_ground_plane: 8,
  prepreg_1: 9,
  L1_top_copper: 10,
  soldermask_top: 10,
  enig_pads_top: 10
};

const hero = document.querySelector('[data-hero-stage]');
const fallback = hero?.querySelector('[data-hero-fallback]');
const mount = hero?.querySelector('[data-hero-mount]');
const runway = hero?.querySelector('[data-hero-runway]');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (hero && mount && !reduced && webglAvailable()) {
  init().catch(() => {
    // Leave the drawing exactly as it is. It is not a placeholder.
    mount.hidden = true;
    if (fallback) fallback.classList.remove('is-replaced');
  });
}

async function init() {
  const stage = document.createElement('three-d-stage');
  stage.setAttribute('name', 's1-six-layer-stackup');
  // A real colour, not "transparent": the component feeds this straight to
  // new THREE.Color(), which does not understand the keyword and silently
  // falls back to black. --void is the correct fallback for this ground.
  stage.setAttribute('background', '#08090B');
  mount.appendChild(stage);

  await customElements.whenDefined('three-d-stage');
  const { THREE } = await stage.ready;

  // The stage ships an authoring toolbar (OBJ + GLB export) and an orbit
  // hint. Both are right for the scene harness and wrong for the portfolio
  // hero, so they are suppressed here rather than by editing the vendored
  // file, which stays byte-identical to the handoff.
  const sr = stage.shadowRoot;
  sr?.querySelector('.toolbar')?.remove();
  sr?.querySelector('.note')?.remove();

  // The component clears opaque so exports composite correctly. Here the
  // stackup sits on the page's own dot texture, as the drawing it replaces
  // did, so the canvas is made genuinely transparent instead.
  stage._renderer?.setClearAlpha(0);
  stage.style.background = 'transparent';

  const { buildS1 } = createScenes(THREE);

  const model = buildS1(true); // built exploded; the gap is interpolated below
  const assembled = buildS1(false);

  // buildS1 draws the plated via barrels ONLY in the assembled build — a
  // continuous barrel through a separated stack would be a lie. Since the
  // interpolation at t=0 lands exactly on the assembled pose, and seat()
  // gives both builds the same origin, the assembled build's via group can
  // be reparented here and simply hidden as the stack opens. No geometry is
  // duplicated: these are the builder's own barrels.
  const vias = assembled.getObjectByName('plated_vias');
  const modelRoot = model.children[0];
  if (vias && modelRoot) modelRoot.add(vias);

  stage.setObject(model);

  // Record each part's exploded rest height once.
  const parts = [];
  model.traverse((o) => {
    const idx = LAYER_INDEX[o.name];
    if (idx !== undefined) parts.push({ obj: o, y: o.position.y, idx });
  });

  // Framing. setObject() frames on the bounding SPHERE, fitted to the
  // vertical field of view. That is right for the scene harness, which is
  // nearly square; it is wrong here. The hero stage is 1000x408 — 2.45:1 —
  // and the stackup is wide and flat, so its bounding sphere is mostly air:
  // fitting the sphere vertically left the board at about a quarter of the
  // width the drawing it replaces occupies, with the swap visibly shrinking
  // the object on load.
  //
  // So the camera is fitted to the object's PROJECTED BOUNDING BOX against
  // both axes of the frustum instead. Each corner is resolved onto the
  // camera basis and the distance taken that satisfies the tighter of the
  // horizontal and vertical constraints. Both poses are measured, and the
  // distance is recomputed per frame from the interpolated box, so the move
  // between them is continuous and a resize re-fits rather than crops.
  const camera = stage._camera;
  const controls = stage._controls;
  const DIR = new THREE.Vector3(1, 0.55, 1.25).normalize();
  const UP = new THREE.Vector3(0, 1, 0);

  // A long lens, not the component's 45° default. Filling a 2.45:1 stage at
  // 45° puts the camera barely clear of the near corner, and the stackup
  // renders as a wedge — the near edge several times the far one. The art
  // direction is a drafting view ("camera slightly above the board plane",
  // copper reading as sheet metal), so the object wants to be far away
  // through a narrow lens: at 20° the six layers stay parallel across the
  // whole board and the object still fills the frame.
  camera.fov = 20;
  camera.updateProjectionMatrix();

  // The page owns the wheel. OrbitControls' wheel handler calls
  // preventDefault() and dollies the camera, so a visitor scrolling with the
  // pointer over the stackup zoomed the scene and the page stayed put — the
  // object is 1000x408 in the middle of the hero, so that is most of the
  // screen. With enableZoom off the handler returns before preventDefault
  // and the wheel reaches the document untouched. Zoom was never in the
  // spec: scroll explodes, drag orbits.
  controls.enableZoom = false;
  controls.enablePan = false;

  // Same hijack on touch: connect() sets `touch-action: none` on the canvas,
  // which stops a swipe over the stackup from scrolling the page at all.
  // The gesture the scene wants is a horizontal drag, so vertical panning
  // goes back to the browser.
  const canvas = stage._renderer?.domElement;
  if (canvas) canvas.style.touchAction = 'pan-y';

  // "drag orbits +/-25deg" (05 §S1). DIR sits at azimuth 38.7deg, so the
  // limits are that +/- 25deg. Without them the board can be spun edge-on or
  // viewed from underneath, neither of which is a drawing of a stackup.
  const baseAzimuth = Math.atan2(DIR.x, DIR.z);
  const ORBIT = (25 * Math.PI) / 180;
  controls.minAzimuthAngle = baseAzimuth - ORBIT;
  controls.maxAzimuthAngle = baseAzimuth + ORBIT;
  const basePolar = Math.acos(DIR.y);
  controls.minPolarAngle = Math.max(basePolar - ORBIT, 0.08);
  controls.maxPolarAngle = Math.min(basePolar + ORBIT, Math.PI / 2 - 0.02);

  // Breathing room around the fitted box. 1.14 keeps the exploded stack
  // clear of the caption and leaves the hero's copy some air.
  const FIT_MARGIN = 1.14;

  const boxOf = (obj) => {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    return box.isEmpty() ? null : box;
  };

  // t=0 pose, measured before anything is moved.
  for (const p of parts) p.obj.position.y = p.y - p.idx * S1_GAP;
  if (vias) vias.visible = true;
  const closedBox = boxOf(model);

  // back to the built pose
  for (const p of parts) p.obj.position.y = p.y;
  if (vias) vias.visible = false;
  const openBox = boxOf(model);

  const canFrame = !!(camera && controls && closedBox && openBox);

  const _box = new THREE.Box3();
  const _c = new THREE.Vector3();
  const _dir = new THREE.Vector3();

  // Swap the drawing for the canvas only once there is something to show,
  // and pin the hero at the same moment — the runway is dead height until
  // there is a scene whose explode needs somewhere to happen.
  if (fallback) fallback.classList.add('is-replaced');
  hero.classList.add('is-pinned');
  mount.hidden = false;

  let ticking = false;

  const apply = () => {
    ticking = false;
    // Map against the RUNWAY, which is exactly the distance the pinned
    // block holds for: the stack finishes separating while it is still on
    // screen. Mapping against hero.offsetHeight would include the runway
    // itself, so the explode could never catch up with it. The runway is 0
    // when the hero is not pinned (short viewport), and the hero's own
    // extent is the honest fallback there.
    const range = runway?.offsetHeight || hero.offsetHeight || innerHeight;
    const p = Math.min(Math.max(scrollY / range, 0), 1);

    // position-mapped, no easing
    const t = Math.min(
      Math.max((p - EXPLODE_START) / (EXPLODE_END - EXPLODE_START), 0),
      1
    );

    for (const part of parts) {
      part.obj.position.y = part.y - (1 - t) * part.idx * S1_GAP;
    }

    // Plated vias belong to the closed stack only.
    if (vias) vias.visible = t < 0.02;

    if (canFrame) {
      // The parts translate linearly in y, so lerping the two measured
      // boxes is exact, not an approximation.
      _box.min.lerpVectors(closedBox.min, openBox.min, t);
      _box.max.lerpVectors(closedBox.max, openBox.max, t);
      _box.getCenter(_c);
      const dist = fitDistance(
        THREE, _box, _c, DIR, camera.fov, aspectOf(mount, camera), FIT_MARGIN
      );

      // Scroll owns the distance and the target; the DRAG owns the
      // direction. Re-deriving it from the camera each time means an orbit
      // survives the next scroll instead of being snapped back to DIR —
      // which is what setting the position outright used to do, making the
      // two interactions fight.
      _dir.copy(camera.position).sub(controls.target);
      if (_dir.lengthSq() < 1e-12) _dir.copy(DIR);
      else _dir.normalize();

      controls.target.copy(_c);
      camera.position.set(
        _c.x + _dir.x * dist,
        _c.y + _dir.y * dist,
        _c.z + _dir.z * dist
      );
      camera.near = Math.max(dist / 100, 0.01);
      camera.far = dist * 100;
      camera.updateProjectionMatrix();
      controls.update();
    }

    // 22% -> 32%: recedes and dims as the metric strip enters.
    const recede = Math.min(Math.max((p - EXPLODE_END) / (1 - EXPLODE_END), 0), 1);
    mount.style.opacity = String(1 - recede * 0.65);
    mount.style.transform = `scale(${1 - recede * 0.06})`;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  };

  apply();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });

  // A window resize is not the only way the stage changes shape: it is also
  // sized by its own layout, and it goes from nothing to 1000x408 during
  // this very function. Re-fit whenever the canvas box actually moves.
  if ('ResizeObserver' in window) new ResizeObserver(onScroll).observe(mount);
}
