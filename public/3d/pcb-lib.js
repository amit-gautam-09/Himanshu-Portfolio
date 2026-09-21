// Shared PCB material palette and geometry helpers for the S1–S5 scenes.
// Colours are the ISOLATION §9 material tokens; roughness/metalness follow
// §9.1. The stage carries an environment map, so metalness 1.0 is correct.

export function makeMaterials(T) {
  return {
    soldermask: new T.MeshStandardMaterial({ name: 'soldermask', color: 0x16241E, roughness: 0.55, metalness: 0.0 }),
    copper:     new T.MeshStandardMaterial({ name: 'copper',     color: 0xC2713F, roughness: 0.48, metalness: 0.92 }),
    enig:       new T.MeshStandardMaterial({ name: 'enig_pad',   color: 0xD9B25F, roughness: 0.18, metalness: 1.0 }),
    prepreg:    new T.MeshStandardMaterial({ name: 'prepreg',    color: 0x8A7A52, roughness: 0.70, metalness: 0.0 }),
    fr4:        new T.MeshStandardMaterial({ name: 'fr4_core',   color: 0xB79A63, roughness: 0.68, metalness: 0.0 }),
    // Brushed aluminium and a nickel-plated cell can are rough, not mirror.
    // High roughness keeps albedo dominant so they stay neutral under the
    // cool fill instead of taking its hue (see 02-BRAND §9.1).
    aluminium:  new T.MeshStandardMaterial({ name: 'aluminium',  color: 0x9AA2AB, roughness: 0.62, metalness: 0.72 }),
    steel:      new T.MeshStandardMaterial({ name: 'steel_can',  color: 0xB8BDC4, roughness: 0.58, metalness: 0.65 }),
    plastic:    new T.MeshStandardMaterial({ name: 'plastic',    color: 0x22262D, roughness: 0.62, metalness: 0.0 }),
    nylon:      new T.MeshStandardMaterial({ name: 'nylon',      color: 0xD7D2C4, roughness: 0.78, metalness: 0.0 }),
    ferrite:    new T.MeshStandardMaterial({ name: 'ferrite',    color: 0x2A2A2F, roughness: 0.80, metalness: 0.0 }),
    iso:        new T.MeshStandardMaterial({ name: 'iso_trace',  color: 0x79D2E6, roughness: 0.30, metalness: 0.4, emissive: 0x2E7E92, emissiveIntensity: 0.55 })
  };
}

// A rectangular board slab, optionally with rectangular holes (milled slots).
export function boardSlab(T, { w, d, t, holes = [], name, material }) {
  const s = new T.Shape();
  const hw = w / 2, hd = d / 2;
  s.moveTo(-hw, -hd); s.lineTo(hw, -hd); s.lineTo(hw, hd); s.lineTo(-hw, hd); s.closePath();
  holes.forEach(([cx, cz, hwid, hdep, angle = 0]) => {
    const p = new T.Path();
    const pts = [[-hwid / 2, -hdep / 2], [hwid / 2, -hdep / 2], [hwid / 2, hdep / 2], [-hwid / 2, hdep / 2]]
      .map(([x, z]) => [
        cx + x * Math.cos(angle) - z * Math.sin(angle),
        cz + x * Math.sin(angle) + z * Math.cos(angle)
      ]);
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
    s.holes.push(p);
  });
  const g = new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  const mesh = new T.Mesh(g, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// A round board (the CANSAT outline), with an optional cable pass-through.
export function roundBoard(T, { r, t, name, material, notch = true }) {
  const s = new T.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  if (notch) {
    const p = new T.Path();
    p.absarc(r * 0.62, 0, r * 0.13, 0, Math.PI * 2, true);
    s.holes.push(p);
  }
  const g = new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 48 });
  g.rotateX(-Math.PI / 2);
  const mesh = new T.Mesh(g, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function box(T, { w, h, d, pos, name, material, rotY = 0 }) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), material);
  m.name = name;
  m.position.set(pos[0], pos[1] + h / 2, pos[2]);
  m.rotation.y = rotY;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function cyl(T, { r, h, pos, name, material, seg = 32, rotX = 0, rTop = null }) {
  const m = new T.Mesh(new T.CylinderGeometry(rTop ?? r, r, h, seg), material);
  m.name = name;
  m.position.set(pos[0], pos[1] + (rotX ? 0 : h / 2), pos[2]);
  m.rotation.x = rotX;
  m.castShadow = true;
  return m;
}

// An electrolytic can: body, crimped base, scored top.
export function canCap(T, { r, h, pos, name, mats }) {
  const g = new T.Group();
  g.name = name;
  const body = cyl(T, { r, h, pos: [0, 0, 0], name: name + '_body', material: mats.steel, seg: 40 });
  g.add(body);
  const crimp = cyl(T, { r: r * 1.04, h: h * 0.06, pos: [0, h * 0.06, 0], name: name + '_crimp', material: mats.plastic, seg: 40 });
  g.add(crimp);
  const score = new T.Mesh(new T.TorusGeometry(r * 0.52, r * 0.06, 8, 32), mats.plastic);
  score.name = name + '_score';
  score.rotation.x = -Math.PI / 2;
  score.position.y = h + 0.0004;
  g.add(score);
  g.position.set(pos[0], pos[1], pos[2]);
  return g;
}

// A finned extruded heatsink.
export function heatsink(T, { w, d, baseH, finH, fins, pos, name, material }) {
  const g = new T.Group();
  g.name = name;
  g.add(box(T, { w, h: baseH, d, pos: [0, 0, 0], name: name + '_base', material }));
  const finT = (d / fins) * 0.42;
  for (let i = 0; i < fins; i++) {
    const z = -d / 2 + (d / fins) * (i + 0.5);
    g.add(box(T, { w, h: finH, d: finT, pos: [0, baseH, z], name: `${name}_fin_${i + 1}`, material }));
  }
  g.position.set(pos[0], pos[1], pos[2]);
  return g;
}

// A dense field of 0402 passives — texture at distance, discrete parts up close.
export function passiveField(T, { count, bounds, y, name, mats, seed = 7 }) {
  const g = new T.Group();
  g.name = name;
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const [x0, x1, z0, z1] = bounds;
  for (let i = 0; i < count; i++) {
    const x = x0 + rnd() * (x1 - x0);
    const z = z0 + rnd() * (z1 - z0);
    const rot = rnd() > 0.5 ? 0 : Math.PI / 2;
    const p = new T.Group();
    p.name = `passive_${String(i + 1).padStart(3, '0')}`;
    p.add(box(T, { w: 0.0010, h: 0.0005, d: 0.0005, pos: [0, 0, 0], name: `${p.name}_body`, material: mats.plastic }));
    p.add(box(T, { w: 0.0002, h: 0.0005, d: 0.0005, pos: [-0.0005, 0, 0], name: `${p.name}_t1`, material: mats.enig }));
    p.add(box(T, { w: 0.0002, h: 0.0005, d: 0.0005, pos: [0.0005, 0, 0], name: `${p.name}_t2`, material: mats.enig }));
    p.position.set(x, y, z);
    p.rotation.y = rot;
    g.add(p);
  }
  return g;
}

// Centre a group on the origin with its base resting at y = 0.
export function seat(T, root, name) {
  const b = new T.Box3().setFromObject(root);
  const c = b.getCenter(new T.Vector3());
  root.position.set(-c.x, -b.min.y, -c.z);
  const wrap = new T.Group();
  wrap.name = name;
  wrap.add(root);
  return wrap;
}
