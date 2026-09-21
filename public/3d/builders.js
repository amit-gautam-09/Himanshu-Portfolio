/**
 * Scene builders S1-S5, lifted verbatim from the handoff's `scenes.js`.
 *
 * The only change is decoupling: the original is a self-executing module that
 * queries the `3D Scenes.html` harness DOM at import time (`#poseBox`,
 * `#btnAssembled`, the `[data-scene]` tabs) and would throw on a page that
 * has none. The harness is the reference for wiring; the site does its own,
 * embedding one scene per page. So the builder bodies below are unmodified —
 * they are simply wrapped in a factory that takes THREE and returns them.
 *
 * Geometry rules that must survive any edit:
 *   S1  six-layer stackup   own geometry, assembled/exploded toggle
 *   S2  pico satellite      his own work, real geometry permitted
 *   S3  mains power stage   abstracted, milled isolation slot is the focus
 *   S4  charger board       abstracted, 0402 density is the subject
 *   S5  carrier board       abstracted, cutaway on a shared hinge
 *
 * S3-S5 are a LEGAL constraint, not an aesthetic one: correct component
 * classes and topology, invented placement. No real footprints, routing or
 * silkscreen, ever.
 */
import {
  makeMaterials, boardSlab, roundBoard, box, cyl,
  canCap, heatsink, passiveField, seat
} from './pcb-lib.js';

/**
 * S1's exploded separation, in scene units. Exported because hero-stage.js
 * interpolates against it — it used to keep its own copy, and halving one
 * without the other left the stack permanently half-open. One number, one
 * home.
 */
export const S1_EXPLODED_GAP = 0.011;

export function createScenes(T) {
  const M = makeMaterials(T);

/* ────────── S1 · six-layer stackup ────────── */

/* A real foil-build six-layer: 6 copper, 3 prepreg, 2 core, mask both faces.
   The handoff's four-copper stack was labelled six-layer and totalled 0.95 mm
   against a stated 1.60 — fabs count copper, and this audience does too.

   Scene units hold the same overall height as before (~0.0428 for 1.60 mm),
   so the hero frames at the same scale. Proportions match the SVG's drawn
   ratio, which keeps prepreg:core honest and exaggerates copper — at true
   scale 35 µm beside a 0.40 mm core is a line, and the art direction wants
   copper reading as sheet metal. */
const TH = { copper: 0.00178, prepreg: 0.00416, core: 0.00892, mask: 0.00089 };
const S1W = 0.120, S1D = 0.080, CUT_X = 0.044, CUT_Z = 0.030;

/* Top to bottom. L1/L3 reference the L2 ground plane, L4/L6 the L5 power
   plane — an ordinary impedance-controlled assignment, not an invented one. */
const S1_LAYERS = [
  ['L1_top_copper', TH.copper, 'copper'],
  ['prepreg_1', TH.prepreg, 'prepreg'],
  ['L2_ground_plane', TH.copper, 'copper'],
  ['core_1', TH.core, 'fr4'],
  ['L3_signal', TH.copper, 'copper'],
  ['prepreg_2', TH.prepreg, 'prepreg'],
  ['L4_signal', TH.copper, 'copper'],
  ['core_2', TH.core, 'fr4'],
  ['L5_power_plane', TH.copper, 'copper'],
  ['prepreg_3', TH.prepreg, 'prepreg'],
  ['L6_bottom_copper', TH.copper, 'copper']
];

function routedSlab(w, d, t, name, material) {
  const s = new T.Shape();
  const hw = w / 2, hd = d / 2;
  s.moveTo(-hw, -hd);
  s.lineTo(hw, -hd);
  s.lineTo(hw, hd - CUT_Z);
  s.lineTo(hw - CUT_X, hd - CUT_Z);
  s.lineTo(hw - CUT_X, hd);
  s.lineTo(-hw, hd);
  s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 4 });
  g.rotateX(-Math.PI / 2);
  const m = new T.Mesh(g, material);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function padGrid(y, name) {
  const g = new T.Group();
  g.name = name;
  const geo = new T.CylinderGeometry(0.0030, 0.0030, 0.0013, 24);
  const pts = [
    [-0.046, -0.026], [-0.034, -0.026], [-0.022, -0.026], [-0.010, -0.026],
    [-0.046, -0.012], [-0.034, -0.012], [-0.022, -0.012], [-0.010, -0.012],
    [0.014, -0.028], [0.026, -0.028], [0.038, -0.028], [0.050, -0.028],
    [0.014, -0.014], [0.026, -0.014], [0.038, -0.014], [0.050, -0.014],
    [-0.046, 0.016], [-0.034, 0.016], [-0.022, 0.016], [-0.010, 0.016],
    [-0.046, 0.030], [-0.034, 0.030], [-0.022, 0.030], [-0.010, 0.030]
  ];
  pts.forEach(([x, z], i) => {
    const p = new T.Mesh(geo, M.enig);
    p.name = `enig_pad_${String(i + 1).padStart(2, '0')}`;
    p.position.set(x, y + 0.00065, z);
    p.castShadow = true;
    g.add(p);
  });
  return g;
}

function buildS1(exploded = true) {
  const gap = exploded ? S1_EXPLODED_GAP : 0;
  const root = new T.Group();
  let y = 0;
  const placed = [];
  for (let i = S1_LAYERS.length - 1; i >= 0; i--) {
    const [key, t, matKey] = S1_LAYERS[i];
    const slab = routedSlab(S1W, S1D, t, key, M[matKey]);
    slab.position.y = y;
    root.add(slab);
    placed.unshift({ base: y, top: y + t });
    y += t + gap;
  }
  const top = placed[0], bottom = placed[placed.length - 1];

  const maskTop = routedSlab(S1W - 0.0004, S1D - 0.0004, TH.mask, 'soldermask_top', M.soldermask);
  maskTop.position.y = top.top + 0.0001;
  root.add(maskTop);
  const maskBot = routedSlab(S1W - 0.0004, S1D - 0.0004, TH.mask, 'soldermask_bottom', M.soldermask);
  maskBot.position.y = bottom.base - TH.mask - 0.0001;
  root.add(maskBot);
  root.add(padGrid(top.top + TH.mask, 'enig_pads_top'));

  if (!exploded) {
    const vias = new T.Group();
    vias.name = 'plated_vias';
    const h = top.top - bottom.base;
    [[-0.030, 0.020], [0.012, 0.012], [0.046, 0.004], [-0.010, -0.012]].forEach(([x, z], i) => {
      const b = new T.Mesh(new T.CylinderGeometry(0.0013, 0.0013, h, 20, 1, true), M.copper);
      b.name = `via_barrel_${i + 1}`;
      b.position.set(x, bottom.base + h / 2, z);
      vias.add(b);
    });
    root.add(vias);
  }
  return seat(T, root, exploded ? 'S1_stackup_exploded' : 'S1_stackup_assembled');
}

/* ────────── S2 · pico satellite (CANSAT) — own work, real geometry ────────── */

function cansatBoard(r, t, name, populate) {
  const g = new T.Group();
  g.name = name;
  const b = roundBoard(T, { r, t, name: `${name}_substrate`, material: M.soldermask });
  g.add(b);
  const ring = new T.Mesh(new T.TorusGeometry(r - 0.0015, 0.0006, 8, 64), M.copper);
  ring.name = `${name}_ground_ring`;
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = t + 0.0004;
  g.add(ring);
  // Mounting pads at 3 standoff positions.
  [0, 120, 240].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const p = cyl(T, { r: 0.0035, h: 0.0008, pos: [Math.cos(a) * (r - 0.006), t, Math.sin(a) * (r - 0.006)], name: `${name}_mount_pad_${i + 1}`, material: M.enig, seg: 24 });
    g.add(p);
  });
  populate(g, t);
  return g;
}

function buildS2() {
  const root = new T.Group();
  const R = 0.0355, TB = 0.0016, SEP = 0.030;

  const lower = cansatBoard(R, TB, 'lower_board', (g, t) => {
    g.add(box(T, { w: 0.022, h: 0.0035, d: 0.016, pos: [-0.008, t, -0.006], name: 'imu_bno055', material: M.plastic }));
    g.add(box(T, { w: 0.014, h: 0.0030, d: 0.010, pos: [0.014, t, 0.010], name: 'barometer_bmp390', material: M.plastic }));
    g.add(canCap(T, { r: 0.0045, h: 0.010, pos: [0.016, t, -0.016], name: 'bulk_cap', mats: M }));
    g.add(box(T, { w: 0.010, h: 0.0060, d: 0.010, pos: [-0.020, t, 0.014], name: 'sd_socket', material: M.plastic }));
  });
  lower.position.y = 0;
  root.add(lower);

  const upper = cansatBoard(R, TB, 'upper_board', (g, t) => {
    g.add(box(T, { w: 0.030, h: 0.0040, d: 0.018, pos: [-0.004, t, 0.000], name: 'mcu_teensy_40', material: M.plastic }));
    g.add(box(T, { w: 0.024, h: 0.0055, d: 0.028, pos: [0.006, t, -0.018], name: 'xbee_module', material: M.plastic, rotY: 0.18 }));
    g.add(box(T, { w: 0.012, h: 0.0028, d: 0.008, pos: [-0.022, t, 0.018], name: 'regulator', material: M.plastic }));
  });
  upper.position.y = SEP;
  root.add(upper);

  // Threaded nylon standoffs at the three mount points.
  [0, 120, 240].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const x = Math.cos(a) * (R - 0.006), z = Math.sin(a) * (R - 0.006);
    root.add(cyl(T, { r: 0.0026, h: SEP - TB, pos: [x, TB, z], name: `standoff_${i + 1}`, material: M.nylon, seg: 20 }));
    root.add(cyl(T, { r: 0.0038, h: 0.0016, pos: [x, SEP + TB, z], name: `standoff_nut_${i + 1}`, material: M.nylon, seg: 6 }));
  });

  // Ribbon interconnect, with real slack between the decks.
  const path = new T.CatmullRomCurve3([
    new T.Vector3(0.020, TB + 0.001, 0.020),
    new T.Vector3(0.030, SEP * 0.42, 0.028),
    new T.Vector3(0.026, SEP * 0.86, 0.016),
    new T.Vector3(0.016, SEP - 0.001, 0.010)
  ]);
  const ribbon = new T.Mesh(new T.TubeGeometry(path, 40, 0.0035, 3, false), M.ferrite);
  ribbon.name = 'ribbon_interconnect';
  ribbon.scale.set(1, 1, 0.34);
  ribbon.castShadow = true;
  root.add(ribbon);

  // XBee whip antenna.
  const whip = cyl(T, { r: 0.0008, h: 0.052, pos: [0.018, SEP + 0.004, -0.024], name: 'xbee_whip_antenna', material: M.steel, seg: 12 });
  whip.rotation.z = -0.30;
  whip.rotation.x = 0.16;
  root.add(whip);
  root.add(cyl(T, { r: 0.0018, h: 0.004, pos: [0.018, SEP + 0.0055, -0.024], name: 'antenna_base', material: M.plastic, seg: 16 }));

  // Cylindrical envelope, shown as two guide rings only — the boards are the subject.
  [0.004, SEP + 0.020].forEach((y, i) => {
    const ring = new T.Mesh(new T.TorusGeometry(R + 0.006, 0.0005, 6, 72), M.nylon);
    ring.name = `envelope_guide_${i + 1}`;
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = y;
    root.add(ring);
  });

  return seat(T, root, 'S2_pico_satellite');
}

/* ────────── S3 · mains power stage (abstracted) ────────── */

function buildS3() {
  const root = new T.Group();
  const W = 0.150, D = 0.090, TB = 0.0016;

  // The milled isolation slot is the focal point of the composition.
  const board = boardSlab(T, {
    w: W, d: D, t: TB, name: 'board_substrate', material: M.soldermask,
    holes: [[-0.004, 0, 0.0080, 0.062, 0.22]]
  });
  root.add(board);

  // Routed slot walls read as exposed substrate.
  const slotWall = boardSlab(T, {
    w: 0.0092, d: 0.0632, t: TB - 0.0002, name: 'isolation_slot_wall', material: M.fr4,
    holes: [[0, 0, 0.0080, 0.0620]]
  });
  slotWall.position.set(-0.004, 0.0001, 0);
  slotWall.rotation.y = -0.22;
  root.add(slotWall);

  // Primary side — energised.
  root.add(canCap(T, { r: 0.0125, h: 0.030, pos: [-0.052, TB, -0.014], name: 'bulk_capacitor_C12', mats: M }));
  const choke = new T.Group();
  choke.name = 'boost_inductor_L1';
  choke.add(box(T, { w: 0.024, h: 0.018, d: 0.022, pos: [0, 0, 0], name: 'boost_inductor_core', material: M.ferrite }));
  for (let i = 0; i < 5; i++) {
    const wind = new T.Mesh(new T.TorusGeometry(0.0124, 0.0014, 8, 28, Math.PI * 1.15), M.copper);
    wind.name = `boost_inductor_winding_${i + 1}`;
    wind.rotation.y = Math.PI / 2;
    wind.position.set(-0.008 + i * 0.004, 0.009, 0);
    choke.add(wind);
  }
  choke.position.set(-0.026, TB, 0.020);
  root.add(choke);
  root.add(box(T, { w: 0.016, h: 0.0035, d: 0.012, pos: [-0.058, TB, 0.026], name: 'bridge_rectifier', material: M.plastic }));

  // The transformer is the only crossing, but it must not bury the slot:
  // narrowed and pushed to the far end so most of the slot reads as open void.
  const tx = new T.Group();
  tx.name = 'flyback_transformer_T1';
  tx.add(box(T, { w: 0.019, h: 0.024, d: 0.024, pos: [0, 0, 0], name: 'transformer_bobbin', material: M.plastic }));
  tx.add(box(T, { w: 0.021, h: 0.009, d: 0.026, pos: [0, 0.0075, 0], name: 'transformer_core_gap', material: M.copper }));
  tx.add(box(T, { w: 0.022, h: 0.007, d: 0.027, pos: [0, 0.0175, 0], name: 'transformer_core_top', material: M.ferrite }));
  tx.position.set(0.004, TB, -0.026);
  tx.rotation.y = -0.22;
  root.add(tx);

  // Secondary side — isolated.
  root.add(heatsink(T, { w: 0.030, d: 0.040, baseH: 0.004, finH: 0.020, fins: 7, pos: [0.046, TB, -0.012], name: 'heatsink', material: M.aluminium }));
  const conn = new T.Group();
  conn.name = 'output_connector';
  conn.add(box(T, { w: 0.026, h: 0.010, d: 0.010, pos: [0, 0, 0], name: 'connector_body', material: M.plastic }));
  for (let i = 0; i < 4; i++) {
    conn.add(box(T, { w: 0.0016, h: 0.008, d: 0.0016, pos: [-0.009 + i * 0.006, 0.010, 0], name: `connector_pin_${i + 1}`, material: M.enig }));
  }
  conn.position.set(0.054, TB, 0.030);
  root.add(conn);
  root.add(box(T, { w: 0.012, h: 0.0030, d: 0.009, pos: [0.030, TB, 0.028], name: 'opto_feedback', material: M.plastic }));
  root.add(passiveField(T, { count: 40, bounds: [0.022, 0.062, 0.004, 0.022], y: TB, name: 'secondary_passives', mats: M, seed: 19 }));

  return seat(T, root, 'S3_mains_power_stage');
}

/* ────────── S4 · charger board (abstracted) ────────── */

function buildS4() {
  const root = new T.Group();
  const W = 0.090, D = 0.058, TB = 0.0016;
  root.add(boardSlab(T, { w: W, d: D, t: TB, name: 'board_substrate', material: M.soldermask }));

  // Three NiMH cells on their side.
  for (let i = 0; i < 3; i++) {
    const cell = new T.Group();
    cell.name = `nimh_cell_${i + 1}`;
    const can = cyl(T, { r: 0.0072, h: 0.043, pos: [0, 0, 0], name: `nimh_cell_${i + 1}_can`, material: M.steel, seg: 32, rotX: Math.PI / 2 });
    cell.add(can);
    const nub = cyl(T, { r: 0.0026, h: 0.0016, pos: [0, 0, 0.0223], name: `nimh_cell_${i + 1}_terminal`, material: M.enig, seg: 16, rotX: Math.PI / 2 });
    cell.add(nub);
    cell.position.set(-0.014 + i * 0.016, TB + 0.0072, 0.004);
    root.add(cell);
  }

  // Input choke, toroidal.
  const tor = new T.Group();
  tor.name = 'input_choke';
  const core = new T.Mesh(new T.TorusGeometry(0.0080, 0.0032, 12, 40), M.ferrite);
  core.name = 'input_choke_core';
  core.rotation.x = -Math.PI / 2;
  core.castShadow = true;
  tor.add(core);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const w = new T.Mesh(new T.TorusGeometry(0.0035, 0.0008, 6, 14, Math.PI * 1.7), M.copper);
    w.name = `input_choke_winding_${i + 1}`;
    w.position.set(Math.cos(a) * 0.0080, 0, Math.sin(a) * 0.0080);
    w.rotation.y = -a;
    tor.add(w);
  }
  tor.position.set(-0.032, TB + 0.0032, -0.016);
  root.add(tor);

  // Four-switch bridge.
  const bridge = new T.Group();
  bridge.name = 'four_switch_bridge';
  [[-0.006, -0.006], [0.006, -0.006], [-0.006, 0.006], [0.006, 0.006]].forEach(([x, z], i) => {
    const q = new T.Group();
    q.name = `bridge_fet_Q${i + 1}`;
    q.add(box(T, { w: 0.0062, h: 0.0016, d: 0.0052, pos: [0, 0, 0], name: `bridge_fet_Q${i + 1}_body`, material: M.plastic }));
    q.add(box(T, { w: 0.0062, h: 0.0004, d: 0.0018, pos: [0, 0, 0.0031], name: `bridge_fet_Q${i + 1}_pad`, material: M.enig }));
    q.position.set(x, 0, z);
    bridge.add(q);
  });
  bridge.position.set(0.022, TB, -0.014);
  root.add(bridge);

  root.add(box(T, { w: 0.010, h: 0.0028, d: 0.008, pos: [0.006, TB, -0.022], name: 'charge_controller', material: M.plastic }));
  root.add(box(T, { w: 0.008, h: 0.0022, d: 0.006, pos: [-0.006, TB, -0.024], name: 'current_sense_amp', material: M.plastic }));
  root.add(box(T, { w: 0.014, h: 0.0080, d: 0.008, pos: [0.034, TB, 0.020], name: 'input_connector', material: M.plastic }));

  // The dense 0402 field — the density is the point.
  root.add(passiveField(T, { count: 130, bounds: [0.006, 0.042, -0.008, 0.016], y: TB, name: 'passive_field_0402', mats: M, seed: 11 }));
  root.add(passiveField(T, { count: 45, bounds: [-0.042, -0.020, 0.004, 0.024], y: TB, name: 'passive_field_input', mats: M, seed: 23 }));

  return seat(T, root, 'S4_charger_board');
}

/* ────────── S5 · six-layer carrier board (abstracted) ────────── */

function buildS5() {
  const root = new T.Group();
  const W = 0.140, D = 0.095;
  // Real per-layer thicknesses so a viewer can count six layers at the cut edge.
  const TC = 0.0012, TP = 0.0022, TCORE = 0.0075;
  const HINGE = -D / 2;              // shared edge the upper half stays attached to
  const COVER = D * 0.46;            // how much of the board the upper half spans

  // ── Lower half: L4 core, L5 power plane, L6 bottom copper + mask.
  const lower = new T.Group();
  lower.name = 'lower_stack_L4_L6';
  let y = 0;
  const addLower = (t, matKey, name) => {
    const s = boardSlab(T, { w: W, d: D, t, name, material: M[matKey] });
    s.position.y = y;
    lower.add(s);
    y += t;
  };
  addLower(0.0010, 'soldermask', 'L6_soldermask_bottom');
  addLower(TC, 'copper', 'L6_bottom_copper');
  addLower(TP, 'prepreg', 'L5_prepreg');
  addLower(TC, 'copper', 'L5_power_plane');
  addLower(TCORE, 'fr4', 'L4_core');
  const L3_Y = y;
  addLower(TC, 'copper', 'L3_ground_plane');
  const SIG_Y = y;
  root.add(lower);

  // Inner signal layer sits ON the ground plane and stops where the upper
  // half begins, so the exposed run is what the cutaway reveals.
  const sigD = D - COVER;
  const dielectric = boardSlab(T, { w: W - 0.0010, d: sigD - 0.0010, t: 0.0006, name: 'L3_prepreg_exposed', material: M.prepreg });
  dielectric.position.set(0, SIG_Y, D / 2 - sigD / 2);
  root.add(dielectric);

  // 90 Ω differential pairs, routed in the exposed window.
  const pairs = new T.Group();
  pairs.name = 'pcie_differential_pairs';
  const z0 = D / 2 - sigD + 0.010;
  const runs = [
    [[-0.050, z0 + 0.004], [-0.008, z0 + 0.004], [0.014, z0 + 0.026], [0.056, z0 + 0.026]],
    [[-0.050, z0 + 0.0105], [-0.004, z0 + 0.0105], [0.018, z0 + 0.0325], [0.056, z0 + 0.0325]],
    [[-0.050, z0 + 0.021], [-0.016, z0 + 0.021], [0.006, z0 + 0.043], [0.056, z0 + 0.043]],
    [[-0.050, z0 + 0.0275], [-0.012, z0 + 0.0275], [0.010, z0 + 0.0495], [0.056, z0 + 0.0495]]
  ];
  runs.forEach((pts, ri) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = new T.Vector3(pts[i][0], SIG_Y + 0.0009, pts[i][1]);
      const b = new T.Vector3(pts[i + 1][0], SIG_Y + 0.0009, pts[i + 1][1]);
      const seg = new T.Mesh(new T.BoxGeometry(0.0013, 0.0004, a.distanceTo(b)), M.iso);
      seg.name = `diff_pair_${ri + 1}_seg_${i + 1}`;
      seg.position.copy(a).lerp(b, 0.5);
      seg.lookAt(b);
      pairs.add(seg);
    }
  });
  root.add(pairs);

  // ── Upper half: L1/L2, hinged at the shared edge and lifted by roughly one
  // board thickness. A cutaway, not an explosion — the halves stay one object.
  const upper = new T.Group();
  upper.name = 'upper_stack_L1_L2_peeled';
  let uy = 0;
  const addUpper = (t, matKey, name) => {
    const s = boardSlab(T, { w: W, d: COVER, t, name, material: M[matKey] });
    s.position.set(0, uy, 0);
    upper.add(s);
    uy += t;
  };
  addUpper(TP, 'prepreg', 'L2_prepreg');
  addUpper(TC, 'copper', 'L1_top_copper');
  addUpper(0.0010, 'soldermask', 'L1_soldermask_top');
  const UTOP = uy;

  upper.add(box(T, { w: 0.050, h: 0.0042, d: 0.026, pos: [-0.030, UTOP, 0.002], name: 'system_on_module', material: M.plastic }));
  for (let i = 0; i < 16; i++) {
    upper.add(box(T, { w: 0.0014, h: 0.0006, d: 0.0022, pos: [-0.052 + i * 0.0030, UTOP, 0.016], name: `som_castellation_${i + 1}`, material: M.enig }));
  }
  [[0.040, -0.010], [0.058, -0.010]].forEach(([x, z], i) => {
    const sma = new T.Group();
    sma.name = `sma_connector_${i + 1}`;
    sma.add(box(T, { w: 0.0090, h: 0.0040, d: 0.0090, pos: [0, 0, 0], name: `sma_${i + 1}_flange`, material: M.aluminium }));
    sma.add(cyl(T, { r: 0.0031, h: 0.0080, pos: [0, 0.0040, 0], name: `sma_${i + 1}_barrel`, material: M.aluminium, seg: 24 }));
    sma.add(cyl(T, { r: 0.0007, h: 0.0090, pos: [0, 0.0045, 0], name: `sma_${i + 1}_pin`, material: M.enig, seg: 12 }));
    sma.position.set(x, UTOP, z);
    upper.add(sma);
  });
  const m2 = new T.Group();
  m2.name = 'm2_slot';
  m2.add(box(T, { w: 0.024, h: 0.0035, d: 0.0060, pos: [0, 0, 0], name: 'm2_slot_body', material: M.plastic }));
  for (let i = 0; i < 22; i++) {
    m2.add(box(T, { w: 0.0006, h: 0.0006, d: 0.0040, pos: [-0.0110 + i * 0.0010, 0.0035, 0], name: `m2_contact_${i + 1}`, material: M.enig }));
  }
  m2.position.set(0.014, UTOP, 0.014);
  upper.add(m2);

  // Pivot about the hinge edge: translate the pivot there, tilt, translate back.
  const hingePivot = new T.Group();
  hingePivot.name = 'peel_hinge';
  upper.position.z = COVER / 2;      // upper's own centre relative to the hinge
  hingePivot.add(upper);
  hingePivot.position.set(0, L3_Y + TC, HINGE);
  hingePivot.rotation.x = -0.26;
  root.add(hingePivot);

  return seat(T, root, 'S5_carrier_board');
}

const CAPTIONS = {
  S1: ['Six-layer stackup', '1.60 mm finished · edge routed to expose the stack · own geometry'],
  S2: ['Pico satellite (CANSAT)', 'Two round boards on nylon standoffs · own work, real geometry'],
  S3: ['Mains power stage', 'Representative model. Not the client\u2019s design.'],
  S4: ['Charger board', 'Representative model. Not the client\u2019s design.'],
  S5: ['Six-layer carrier board', 'Representative model. Not the client\u2019s design.']
};

  return { buildS1, buildS2, buildS3, buildS4, buildS5, CAPTIONS };
}
