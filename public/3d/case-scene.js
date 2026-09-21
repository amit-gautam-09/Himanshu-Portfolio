/**
 * Case-study scenes — S2 through S5, inside a FramedScene.
 *
 * Progressive enhancement, same contract as the hero: the frame is already
 * drawn and captioned before this runs, and if WebGL is missing or the
 * visitor prefers reduced motion the frame simply stays as it is. No spinner.
 *
 * These scenes do NOT scroll-animate. The hero earns its scroll link because
 * the explode is the argument; a case-study scene is an illustration, so it
 * gets a slow turntable the visitor can interrupt by dragging, and nothing
 * else. One idea per page.
 *
 * SCROLL OWNERSHIP: every three-d-stage embedded in page flow inherits
 * OrbitControls' defaults, which capture the wheel and set
 * `touch-action: none`. Both are released here exactly as the hero does it,
 * or the page cannot be scrolled past the canvas.
 */
import { createScenes } from './builders.js';
import { frameBox, aspectOf } from './fit-camera.js';

const SCENES = {
  's2-pico-satellite': 'buildS2',
  's3-mains-power-stage': 'buildS3',
  's4-charger-board': 'buildS4',
  's5-carrier-board': 'buildS5'
};

const host = document.querySelector('[data-scene]');
const mount = host?.querySelector('[data-scene-mount]');
const builderName = SCENES[host?.dataset.scene];

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (host && mount && builderName && !reduced && webglAvailable()) {
  init().catch(() => {
    // The frame and its caption are the fallback. Leave them alone.
    mount.replaceChildren();
  });
}

async function init() {
  const stage = document.createElement('three-d-stage');
  stage.setAttribute('name', host.dataset.scene);
  stage.setAttribute('background', '#0C0E12');
  mount.appendChild(stage);

  await customElements.whenDefined('three-d-stage');
  const { THREE } = await stage.ready;

  const sr = stage.shadowRoot;
  sr?.querySelector('.toolbar')?.remove();
  sr?.querySelector('.note')?.remove();

  const scenes = createScenes(THREE);
  const model = scenes[builderName]();
  stage.setObject(model);

  const camera = stage._camera;
  const controls = stage._controls;

  // The page owns the wheel and the vertical swipe. See the module comment.
  controls.enableZoom = false;
  controls.enablePan = false;
  const canvas = stage._renderer?.domElement;
  if (canvas) canvas.style.touchAction = 'pan-y';

  // A long lens for the same reason the hero uses one: these are drawings of
  // boards, and a wide angle bends the board edges.
  camera.fov = 28;
  camera.updateProjectionMatrix();

  // Keep the object above the horizon; a board seen from underneath is not a
  // view of a board.
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;

  // Fit the box, not the sphere. setObject() framed on the sphere against the
  // vertical fov and left the board overflowing a 16:9 frame.
  const DIR = new THREE.Vector3(1, 0.62, 1.25).normalize();
  const refit = () => {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    if (box.isEmpty()) return;
    frameBox(THREE, camera, controls, box, DIR, aspectOf(mount, camera), 1.12);
  };
  refit();
  // The frame is sized by its own layout, so it goes from nothing to its real
  // box during this function. Re-fit whenever that box moves.
  if ('ResizeObserver' in window) new ResizeObserver(refit).observe(mount);

  // Slow turntable until the visitor touches it, then it stops for good.
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
  });
}
