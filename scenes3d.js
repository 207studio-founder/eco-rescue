// 3D dioramas for 생태계 구조대 (three.js)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const loader = new THREE.TextureLoader();
const texCache = {};
function tex(src) {
  if (!texCache[src]) { const t = loader.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; texCache[src] = t; }
  return texCache[src];
}
const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, flatShading: true }, o));
function sprite(src, h, aspect) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(src), transparent: true, alphaTest: .05 }));
  s.scale.set(h * aspect, h, 1); s.center.set(.5, 0); return s;
}
function baseRig(host, { bg = 0xbfe9ff, fog = [30, 70] } = {}) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  r.setPixelRatio(Math.min(1.5, devicePixelRatio)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  host.appendChild(r.domElement); r.domElement.style.display = 'block'; r.domElement.style.width = '100%'; r.domElement.style.height = '100%';
  const sc = new THREE.Scene(); sc.background = new THREE.Color(bg); sc.fog = new THREE.Fog(bg, fog[0], fog[1]);
  const cam = new THREE.PerspectiveCamera(40, 1, .1, 200);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x9bd38a, 1.15));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.6); sun.position.set(8, 16, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22 }); sc.add(sun);
  const size = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(size); ro.observe(host); size();
  return { r, sc, cam, ro };
}
function tree(x, z, s = 1, color = 0x5fb85f) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.14 * s, .2 * s, .9 * s, 6), mat(0x9a6b45)); trunk.position.y = .45 * s; trunk.castShadow = true; g.add(trunk);
  const kind = Math.random();
  if (kind < .5) { for (let i = 0; i < 2; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry((.85 - i * .25) * s, 1.1 * s, 7), mat(color)); c.position.y = (1.2 + i * .55) * s; c.castShadow = true; g.add(c); } }
  else { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.75 * s, 0), mat(color === 0x5fb85f ? 0x7cc96a : color)); b.position.y = 1.35 * s; b.castShadow = true; g.add(b); }
  g.position.set(x, 0, z); g.rotation.y = Math.random() * 6; return g;
}
function flower(x, z) {
  const g = new THREE.Group(); const cols = [0xffd25a, 0xff8c9a, 0xffffff, 0xb9a6e8];
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .25), mat(0x4f9b52)); st.position.y = .12; g.add(st);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5), mat(cols[Math.floor(Math.random() * 4)])); h.position.y = .27; g.add(h);
  g.position.set(x, 0, z); return g;
}
function car(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, .5, .9), mat(color, { roughness: .5 })); body.position.y = .45; body.castShadow = true; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(.9, .42, .8), mat(0xfaf6ea, { roughness: .4 })); cab.position.set(-.1, .88, 0); cab.castShadow = true; g.add(cab);
  const win = new THREE.Mesh(new THREE.BoxGeometry(.92, .26, .82), mat(0x8fd6f0, { roughness: .2 })); win.position.set(-.1, .9, 0); g.add(win);
  for (const [x, z] of [[.55, .45], [-.55, .45], [.55, -.45], [-.55, -.45]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .14, 12), mat(0x3b3b44)); w.rotation.x = Math.PI / 2; w.position.set(x, .2, z); g.add(w); }
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(.05, .12, .7), mat(0xfff3b0, { emissive: 0xfff3b0, emissiveIntensity: .6 })); lamp.position.set(.86, .5, 0); g.add(lamp);
  return g;
}
function animate(loop, host, cleanup) {
  const clock = new THREE.Clock(); let alive = true;
  (function f() { if (!alive) return; if (!document.body.contains(host)) { alive = false; cleanup(); return; } loop(Math.min(.05, clock.getDelta()), clock.elapsedTime); requestAnimationFrame(f); })();
  return () => { alive = false; cleanup(); };
}
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const back = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

/* ============ 생태통로 diorama ============ */
export function bridgeScene(host, { onBlocked, onBuilt, onAllCrossed, sfx = () => { } } = {}) {
  const { r, sc, cam, ro } = baseRig(host, { bg: 0xbfe9ff, fog: [26, 60] });
  cam.position.set(0, 11, 17); cam.lookAt(0, 0, 0);
  // ground: near & far forest
  const grassM = mat(0x9ed58a, { flatShading: false });
  for (const z of [-7.5, 7.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 12), grassM); p.position.set(0, -.5, z); p.receiveShadow = true; sc.add(p); }
  const road = new THREE.Mesh(new THREE.BoxGeometry(60, .9, 3.2), mat(0x8d8d98, { flatShading: false })); road.position.set(0, -.5, 0); road.receiveShadow = true; sc.add(road);
  for (let x = -30; x < 30; x += 2.2) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.1, .02, .12), mat(0xffffff)); l.position.set(x, -.04, 0); sc.add(l); }
  for (const z of [-1.75, 1.75]) { const curb = new THREE.Mesh(new THREE.BoxGeometry(60, .25, .25), mat(0xe9e2cf)); curb.position.set(0, .0, z); sc.add(curb); }
  // forest
  for (let i = 0; i < 70; i++) { const side = i % 2 ? 1 : -1; const x = (Math.random() - .5) * 46; const z = side * (3 + Math.random() * 9); if (Math.abs(x) < 3.5 && side > 0 && z < 7) continue; if (Math.abs(x) < 3 && side < 0 && z > -6) continue; sc.add(tree(x, z, .8 + Math.random() * .7)); }
  for (let i = 0; i < 90; i++) { const side = i % 2 ? 1 : -1; sc.add(flower((Math.random() - .5) * 40, side * (2.3 + Math.random() * 9))); }
  // far meadow target
  const target = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, .06, 32), mat(0xc6ef9f, { flatShading: false })); target.position.set(0, .01, -6.6); target.receiveShadow = true; sc.add(target);
  // cars
  const cars = [];
  [[0xff8c7a, 1, .8, 0], [0x8fd6f0, 1, .8, 14], [0xffd25a, -1, -.8, 6], [0xb9a6e8, -1, -.8, 20]].forEach(([c, dir, z, off]) => { const m = car(c); m.position.set(-26 + off, 0, z); m.rotation.y = dir > 0 ? 0 : Math.PI; m.userData = { dir, speed: 7 + Math.random() * 2 }; sc.add(m); cars.push(m); });
  // animals
  const names = [['a_deer', 2.0], ['a_raccoon', 1.6], ['a_boar', 1.6], ['a_badger', 1.45], ['a_squirrel', 1.45]];
  const animals = names.map(([n, h], i) => { const s = sprite(`img/${n}.webp`, h, 1.15); s.position.set(-3.6 + i * 1.8, 0, 4.4 + (i % 2) * .6); s.userData = { home: s.position.clone(), t: 0, phase: Math.random() * 6, state: 'wait', delay: i * .55 }; sc.add(s); return s; });
  // bridge (hidden until built)
  const bridge = new THREE.Group(); bridge.position.set(0, 0, 0); sc.add(bridge);
  const archShape = new THREE.Shape(); archShape.moveTo(-3.4, -.1); archShape.lineTo(-3.4, 2.4); archShape.quadraticCurveTo(0, 2.9, 3.4, 2.4); archShape.lineTo(3.4, -.1); archShape.lineTo(2.2, -.1); archShape.quadraticCurveTo(0, 2.0, -2.2, -.1); archShape.closePath();
  const archGeo = new THREE.ExtrudeGeometry(archShape, { depth: 4.2, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 2, steps: 1 });
  archGeo.translate(0, 0, -2.1); archGeo.rotateY(Math.PI / 2);
  const arch = new THREE.Mesh(archGeo, mat(0xd9c7a0)); arch.castShadow = true; arch.receiveShadow = true; bridge.add(arch);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, .35, 7.2), mat(0x8fd17a)); deck.position.set(0, 2.62, 0); deck.castShadow = true; deck.receiveShadow = true; bridge.add(deck);
  // ramps
  for (const s of [1, -1]) { const ramp = new THREE.Mesh(new THREE.BoxGeometry(4.6, .35, 3.6), mat(0x8fd17a)); ramp.position.set(0, 1.35, s * 4.9); ramp.rotation.x = s * .62; ramp.castShadow = true; ramp.receiveShadow = true; bridge.add(ramp); }
  for (let i = 0; i < 4; i++) { const tr = tree(i % 2 ? 1.95 : -1.95, i < 2 ? -3.2 : 3.2, .45, 0x6cc070); tr.position.y = 2.78; bridge.add(tr); }
  for (let i = 0; i < 16; i++) { const f = flower(-1.8 + Math.random() * 3.6, -3.2 + Math.random() * 6.4); f.position.y = 2.79; bridge.add(f); }
  // side fences guiding
  for (const x of [-2.25, 2.25]) for (let z = -3.4; z <= 3.4; z += .85) { const p = new THREE.Mesh(new THREE.BoxGeometry(.1, .45, .1), mat(0x9a6b45)); p.position.set(x, 3.0, z); bridge.add(p); }
  bridge.scale.set(1, 0.001, 1); bridge.visible = false;

  let built = false, buildT = 0, crossed = 0, blockedShown = false, tryT = 0;
  const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 4.4), new THREE.Vector3(0, 0, 6.6), new THREE.Vector3(0, 2.8, 3.2), new THREE.Vector3(0, 2.8, -3.2), new THREE.Vector3(0, 0, -6.6), new THREE.Vector3(0, 0, -6.4)]);
  const api = {
    build() { if (built) return; built = true; bridge.visible = true; buildT = 0; sfx('unlock'); },
  };
  // camera moves
  let camT = 0;
  const stop = animate((dt, t) => {
    // cars
    cars.forEach(c => { const u = c.userData; c.position.x += u.dir * u.speed * dt; if (u.dir > 0 && c.position.x > 28) c.position.x = -28; if (u.dir < 0 && c.position.x < -28) c.position.x = 28; c.position.y = Math.abs(Math.sin(t * 12 + c.position.x)) * .03; });
    // blocked attempt: deer tries to cross before bridge
    if (!built) {
      tryT += dt; const d = animals[0];
      const k = (tryT % 6) / 6; // 0..1 cycle
      if (k > .35 && k < .55) { d.position.z = d.userData.home.z - Math.sin((k - .35) / .2 * Math.PI) * 1.8; if (!blockedShown && k > .44) { blockedShown = true; sfx('beep'); onBlocked && onBlocked(); } }
      else d.position.z = d.userData.home.z;
      if (k < .1) blockedShown = false;
    } else {
      buildT += dt;
      const g = Math.min(1, buildT / 1.4); bridge.scale.set(1, Math.max(.001, back(g)), 1);
      if (buildT > 1.6) animals.forEach((a, i) => {
        const u = a.userData;
        if (u.state === 'wait' && buildT > 1.6 + u.delay) { u.state = 'go'; u.t = 0; u.start = a.position.clone(); }
        if (u.state === 'go') {
          u.t += dt / 4.2; const p = path.getPointAt(Math.min(1, u.t)); a.position.set(p.x + (i - 2) * .7, p.y + Math.abs(Math.sin(u.t * 40)) * .12, p.z + (i % 2) * .3);
          if (u.t >= 1) { u.state = 'done'; crossed++; sfx('correct'); if (crossed === animals.length) onAllCrossed && onAllCrossed(); }
        }
      });
      if (buildT > 1.45 && !api._b) { api._b = true; onBuilt && onBuilt(); }
    }
    animals.forEach(a => { if (a.userData.state !== 'go') a.position.y = Math.abs(Math.sin(t * 4 + a.userData.phase)) * .08; });
    // camera
    camT += dt; const ang = built ? Math.min(1, buildT / 3) : 0;
    const base = new THREE.Vector3(Math.sin(t * .2) * 1.5, 11, 17);
    const close = new THREE.Vector3(15, 9.5, 3.5);
    cam.position.lerpVectors(base, close, ease(ang)); cam.lookAt(0, 1.6 * ease(ang), -0.5 * ease(ang));
    r.render(sc, cam);
  }, host, () => { ro.disconnect(); r.dispose(); });
  api.stop = stop; return api;
}

/* ============ 산양 울타리 diorama ============ */
export function fenceScene(host, { onCut, onFree, sfx = () => { } } = {}) {
  const { r, sc, cam, ro } = baseRig(host, { bg: 0xdff3ff, fog: [24, 55] });
  cam.position.set(-1, 6.5, 11); cam.lookAt(.5, .6, 0);
  // snowy slope (left/up) to green valley (right/down)
  const geo = new THREE.PlaneGeometry(50, 30, 60, 36); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cols = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = Math.max(-1.5, -x * .18) + Math.sin(x * .7) * .15 + Math.cos(z * .6) * .15;
    pos.setY(i, y);
    const snow = x < 1.2 + Math.sin(z * .8) * .5; const c = snow ? new THREE.Color(0xf7fbff) : new THREE.Color(0x9ed58a).offsetHSL(0, 0, (Math.random() - .5) * .05);
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true })); land.receiveShadow = true; sc.add(land);
  const hY = x => Math.max(-1.5, -x * .18);
  for (let i = 0; i < 40; i++) { const x = -20 + Math.random() * 14, z = -14 + Math.random() * 12; const t = tree(x, z, .8 + Math.random() * .6, 0x4f9b78); t.position.y = hY(x); t.children.forEach(c => { if (c.geometry.type !== 'CylinderGeometry') c.material = mat(0xeaf6ff); }); sc.add(t); }
  for (let i = 0; i < 30; i++) { const x = 8 + Math.random() * 14, z = -14 + Math.random() * 14; const t = tree(x, z, .7 + Math.random() * .6); t.position.y = hY(x); sc.add(t); }
  for (let i = 0; i < 60; i++) { const x = 2.5 + Math.random() * 12, z = -8 + Math.random() * 14; const f = flower(x, z); f.position.y = hY(x); sc.add(f); }
  // snowflakes
  const flakes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 900 }, (_, i) => i % 3 === 1 ? Math.random() * 12 : (Math.random() - .5) * 30), 3)), new THREE.PointsMaterial({ color: 0xffffff, size: .12 })); sc.add(flakes);
  // fence: 3 panels along z at x=1.6
  const fx = 1.6, panels = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(); const z0 = -3 + i * 2.2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.2, 6), mat(0x6f6f78)); post.position.set(0, 1.1, -1.1); g.add(post);
    const net = new THREE.Group(); const nm = mat(0x6a6a78, { flatShading: false, emissive: 0x000000 });
    for (let k = 0; k <= 6; k++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 2.2), nm); bar.position.set(0, .15 + k * .3, 0); net.add(bar); }
    for (let k = 0; k <= 7; k++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.85, .05), nm); bar.position.set(0, 1.05, -1.1 + k * .314); net.add(bar); }
    g.add(net);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 2.2), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0, 1.1, 0); g.add(hit);
    g.position.set(fx, hY(fx), z0); g.userData = { hit, cut: false, fall: 0 }; hit.userData.panel = g; sc.add(g); panels.push(g);
  }
  const endPost = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.2, 6), mat(0x6f6f78)); endPost.position.set(fx, hY(fx) + 1.1, 3.6 - 1.1 + 1.1); sc.add(endPost);
  // goral
  const goral = sprite('img/sp_goral.webp', 2.3, 1.2); goral.position.set(-2.4, hY(-2.4), -.8); sc.add(goral);
  let free = false, walkT = 0, cutN = 0;
  const ray = new THREE.Raycaster(), m = new THREE.Vector2();
  const onDown = e => {
    const rc = r.domElement.getBoundingClientRect(); m.x = (e.clientX - rc.left) / rc.width * 2 - 1; m.y = -(e.clientY - rc.top) / rc.height * 2 + 1;
    ray.setFromCamera(m, cam); const hits = ray.intersectObjects(panels.map(p => p.userData.hit));
    if (hits.length) { const p = hits[0].object.userData.panel; if (!p.userData.cut) { p.userData.cut = true; cutN++; sfx('stamp'); onCut && onCut(cutN); if (cutN === 3) { free = true; setTimeout(() => sfx('key'), 300); } } }
  };
  r.domElement.addEventListener('pointerdown', onDown);
  const stop = animate((dt, t) => {
    const fp = flakes.geometry.attributes.position; for (let i = 0; i < fp.count; i++) { let y = fp.getY(i) - dt * .8; if (y < -1) y = 12; fp.setY(i, y); fp.setX(i, fp.getX(i) + Math.sin(t + i) * .002); } fp.needsUpdate = true;
    panels.forEach((p, i) => { const u = p.userData; if (u.cut && u.fall === 0) p.children[1].children.forEach(c => c.material.emissive && c.material.emissive.setRGB(0, 0, 0));
      if (u.cut && u.fall < 1) { u.fall = Math.min(1, u.fall + dt * 1.6); p.rotation.z = -ease(u.fall) * 1.45; p.position.y = hY(fx) - ease(u.fall) * .2; } if (!u.cut) p.children[1].children[0].material.emissive.setRGB(.35 + Math.sin(t * 5) * .25, .12, .05); });
    if (free) {
      walkT += dt / 3.2; const k = Math.min(1, walkT); const x = -2.4 + ease(k) * 8.4;
      goral.position.set(x, hY(x) + Math.abs(Math.sin(walkT * 30)) * .15, -.8);
      if (k >= 1 && !free.done) { free = { done: true }; onFree && onFree(); }
    } else goral.position.y = hY(-2.4) + Math.abs(Math.sin(t * 3)) * .05;
    cam.position.x = -3 + Math.sin(t * .25) * 1.2; cam.lookAt(1, 1, 0);
    r.render(sc, cam);
  }, host, () => { ro.disconnect(); r.domElement.removeEventListener('pointerdown', onDown); r.dispose(); });
  return { stop };
}
