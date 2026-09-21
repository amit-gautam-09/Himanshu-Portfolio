/**
 * Fit a camera to an object's PROJECTED BOUNDING BOX, on both frustum axes.
 *
 * `three-d-stage.setObject()` frames on the bounding SPHERE against the
 * VERTICAL field of view. That is right for its own near-square harness and
 * wrong for every frame on this site: a board is wide and flat, so its
 * sphere is mostly air, and on a 16:9 or 2.45:1 frame the object lands far
 * too small — or, at a wide fov fitted tight, far too close and visibly bent.
 *
 * Fitting the box to both axes instead gives the tightest distance that
 * crops nothing. Extracted from the hero when the case-study scenes needed
 * the same thing: it was the one piece of camera maths worth having exactly
 * once.
 */

/** Camera basis for `dir`, matching what lookAt() builds. */
function basis(THREE, dir) {
  const UP = new THREE.Vector3(0, 1, 0);
  const x = new THREE.Vector3().crossVectors(UP, dir).normalize();
  const y = new THREE.Vector3().crossVectors(dir, x).normalize();
  return { x, y };
}

/**
 * @param aspect  measured off the canvas box, NOT read from camera.aspect —
 *                the camera can still be carrying 1:1 from a zero-sized
 *                mount on the first frame, which frames the object at half
 *                size and never recomputes.
 */
export function fitDistance(THREE, box, center, dir, fovDeg, aspect, margin = 1.14) {
  const { x: xAxis, y: yAxis } = basis(THREE, dir);
  const tanV = Math.tan((fovDeg * Math.PI) / 360);
  const tanH = tanV * (aspect || 1);
  const o = new THREE.Vector3();
  let dist = 0;

  for (let i = 0; i < 8; i++) {
    o.set(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z
    ).sub(center);
    // `dir` points from the target back to the camera, so this is depth
    // TOWARD the camera: a near corner needs the camera further away.
    const depth = o.dot(dir);
    const hx = Math.abs(o.dot(xAxis)) * margin;
    const hy = Math.abs(o.dot(yAxis)) * margin;
    dist = Math.max(dist, depth + hx / tanH, depth + hy / tanV);
  }
  return dist;
}

/** Measure an element's aspect, falling back to the camera's own. */
export function aspectOf(el, camera) {
  const w = el?.clientWidth;
  const h = el?.clientHeight;
  return w && h ? w / h : camera?.aspect || 1;
}

/** Place `camera` so `box` fits, preserving any orbit the visitor has made. */
export function frameBox(THREE, camera, controls, box, dir, aspect, margin) {
  const center = box.getCenter(new THREE.Vector3());
  const dist = fitDistance(THREE, box, center, dir, camera.fov, aspect, margin);

  // Scroll/layout owns the distance; a drag owns the direction. Re-deriving
  // it from the camera means an orbit survives the next re-frame.
  const current = new THREE.Vector3().copy(camera.position).sub(controls.target);
  const useDir = current.lengthSq() < 1e-12 ? dir : current.normalize();

  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(useDir, dist);
  camera.near = Math.max(dist / 100, 0.01);
  camera.far = dist * 100;
  camera.updateProjectionMatrix();
  controls.update();
  return dist;
}
