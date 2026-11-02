// Cozy voxel 3D world for 생태계 구조대 (three.js)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ---------- shared helpers ---------- */
const GEO = {}, MAT = {};
function rbox(w, h, d) { const k = [w, h, d].map(v => v.toFixed(3)).join(','); if (!GEO[k]) GEO[k] = new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.18); return GEO[k]; }
function mat(c, o) { const k = c + JSON.stringify(o || {}); if (!MAT[k]) MAT[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .78, metalness: 0 }, o || {})); return MAT[k]; }
function B(g, x, y, z, w, h, d, c, o) { const m = new THREE.Mesh(rbox(w, h, d), mat(c, o)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }

function inst(sc, list) { // list of [x,y,z,w,h,d,color]
  const groups = {};
  list.forEach(b => { const k = b.slice(3, 7).join(','); (groups[k] = groups[k] || []).push(b); });
  Object.values(groups).forEach(arr => { const [w, h, d, c] = arr[0].slice(3); const m = new THREE.InstancedMesh(rbox(w, h, d), mat(c), arr.length); const o = new THREE.Object3D();
    arr.forEach((b, i) => { o.position.set(b[0], b[1], b[2]); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.castShadow = true; m.receiveShadow = true; sc.add(m); });
}
const P = { grass: 0x8fd16a, grass2: 0x7cc45a, dirt: 0xc89a66, sand: 0xf4e1a6, sand2: 0xeed592, stone: 0xb9b6ad, stone2: 0xa29f97, wood: 0xb5835a, wood2: 0x9a6b45, leaf: 0x6cc35a, leaf2: 0x58b04c, leafL: 0x9bdc72, water: 0x5fd0d8, snow: 0xf5f9ff, road: 0x8f8f9b, white: 0xfffdf6 };

function rig(host, { sky = ['#bfeaff', '#eaf8ff'], fov = 32, shadow = 22 } = {}) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(1.75, devicePixelRatio)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.08; r.outputColorSpace = THREE.SRGBColorSpace;
  host.style.background = `linear-gradient(${sky[0]}, ${sky[1]})`; host.appendChild(r.domElement);
  Object.assign(r.domElement.style, { display: 'block', width: '100%', height: '100%', touchAction: 'none' });
  const sc = new THREE.Scene(); sc.fog = new THREE.Fog(new THREE.Color(sky[1]), 40, 90);
  const cam = new THREE.PerspectiveCamera(fov, 1, .1, 300);
  const hemi = new THREE.HemisphereLight(0xfffbea, 0xa9d98f, 1.25); sc.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d2, 1.55); sun.position.set(10, 18, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536); sun.shadow.radius = 4; sun.shadow.bias = -.0006;
  Object.assign(sun.shadow.camera, { left: -shadow, right: shadow, top: shadow, bottom: -shadow, near: 1, far: 60 }); sc.add(sun);
  const size = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(size); ro.observe(host); size();
  return { r, sc, cam, ro, sun };
}
function run(host, ctx, step) {
  const clock = new THREE.Clock(); let alive = true;
  (function f() {
    if (!alive) return;
    if (!document.body.contains(host)) { alive = false; ctx.ro.disconnect(); ctx.r.dispose(); try { ctx.r.forceContextLoss(); } catch (e) { } return; }
    step(Math.min(.05, clock.getDelta()), clock.elapsedTime); ctx.r.render(ctx.sc, ctx.cam); requestAnimationFrame(f);
  })();
  return () => { alive = false; };
}
function picker(ctx, targets, cb) {
  const ray = new THREE.Raycaster(), v = new THREE.Vector2();
  const el = ctx.r.domElement;
  const down = e => {
    const rc = el.getBoundingClientRect(); v.x = (e.clientX - rc.left) / rc.width * 2 - 1; v.y = -(e.clientY - rc.top) / rc.height * 2 + 1;
    ray.setFromCamera(v, ctx.cam); const hit = ray.intersectObjects(targets(), true)[0];
    if (hit) { let o = hit.object; while (o && !o.userData.pick) o = o.parent; if (o) cb(o, hit); }
  };
  el.addEventListener('pointerdown', down);
}
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const backOut = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

/* ---------- props ---------- */
function tree(kind = 0, s = 1) {
  const g = new THREE.Group();
  B(g, 0, .55 * s, 0, .38 * s, 1.1 * s, .38 * s, P.wood2);
  if (kind === 0) { // round cozy tree
    B(g, 0, 1.55 * s, 0, 1.5 * s, 1.1 * s, 1.5 * s, P.leaf); B(g, 0, 2.25 * s, 0, 1.05 * s, .7 * s, 1.05 * s, P.leafL);
    for (let i = 0; i < 3; i++) B(g, Math.cos(i * 2.1) * .55 * s, 1.75 * s, Math.sin(i * 2.1) * .55 * s, .2 * s, .2 * s, .2 * s, [0xff8d8d, 0xffc06a, 0xffe07a][i]);
  } else if (kind === 1) { // pine
    B(g, 0, 1.4 * s, 0, 1.5 * s, .7 * s, 1.5 * s, P.leaf2); B(g, 0, 2.0 * s, 0, 1.05 * s, .6 * s, 1.05 * s, P.leaf); B(g, 0, 2.5 * s, 0, .6 * s, .5 * s, .6 * s, P.leafL);
  } else { // palm
    for (let i = 0; i < 4; i++) B(g, i * .08 * s, (.5 + i * .55) * s, 0, .32 * s, .55 * s, .32 * s, i % 2 ? P.wood : P.wood2);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const l = B(g, .3 * s + Math.cos(a) * .7 * s, 2.55 * s, Math.sin(a) * .7 * s, 1.2 * s, .16 * s, .45 * s, P.leaf); l.rotation.y = -a; l.rotation.z = -.25; }
    B(g, .3 * s, 2.45 * s, .2 * s, .22 * s, .22 * s, .22 * s, 0x9a6b45);
  }
  g.rotation.y = Math.random() * 6; return g;
}
function flower(c) { const g = new THREE.Group(); B(g, 0, .15, 0, .06, .3, .06, 0x5aa04a); B(g, 0, .34, 0, .2, .12, .2, c); B(g, 0, .4, 0, .08, .06, .08, 0xfff1a8); return g; }
function bush() { const g = new THREE.Group(); B(g, 0, .3, 0, .9, .6, .8, P.leaf2); B(g, .2, .55, .1, .5, .35, .5, P.leaf); return g; }
function rock(s = 1) { const g = new THREE.Group(); B(g, 0, .25 * s, 0, .9 * s, .5 * s, .7 * s, P.stone); B(g, .15 * s, .55 * s, .05 * s, .5 * s, .3 * s, .45 * s, P.stone2); return g; }
function cloud() { const g = new THREE.Group(); [[0, 0, 0, 2.2, .9, 1.4], [1.1, .3, 0, 1.4, 1.1, 1.2], [-1, .2, .1, 1.3, .8, 1.1]].forEach(a => B(g, ...a, 0xffffff, { roughness: 1 })); g.traverse(m => { if (m.isMesh) m.castShadow = false; }); return g; }
function car(color) {
  const g = new THREE.Group();
  B(g, 0, .55, 0, 1.9, .6, 1.05, color, { roughness: .45 }); B(g, -.15, 1.05, 0, 1.05, .5, .92, 0xfdf8ec, { roughness: .4 });
  B(g, -.15, 1.06, 0, 1.08, .3, .95, 0x9fe0f2, { roughness: .15 });
  for (const [x, z] of [[.6, .5], [-.6, .5], [.6, -.5], [-.6, -.5]]) { const w = B(g, x, .25, z, .42, .42, .2, 0x3a3a46); }
  B(g, .96, .6, .3, .06, .14, .2, 0xfff3b0, { emissive: 0xfff3b0, emissiveIntensity: .7 }); B(g, .96, .6, -.3, .06, .14, .2, 0xfff3b0, { emissive: 0xfff3b0, emissiveIntensity: .7 });
  return g;
}
/* ---------- voxel animals ---------- */
function legs(g, pts, w, h, c) { const L = []; pts.forEach(([x, z]) => { const p = new THREE.Group(); p.position.set(x, h, z); B(p, 0, -h / 2, 0, w, h, w, c); g.add(p); L.push(p); }); return L; }
function animal(type) {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body); let L = [];
  const eye = (x, y, z) => { B(body, x, y, z, .1, .14, .06, 0x2b2522); B(body, x + .02, y + .03, z + .035, .04, .04, .02, 0xffffff); };
  const blush = (x, y, z) => B(body, x, y, z, .12, .06, .04, 0xffa3a3);
  if (type === 'deer') { // 고라니
    B(body, 0, .95, 0, 1.15, .6, .6, 0xc58d5c); B(body, .62, 1.35, 0, .55, .55, .5, 0xcf9a68); B(body, .92, 1.25, 0, .22, .2, .26, 0xe8c9a6); B(body, 1.02, 1.3, 0, .06, .08, .1, 0x2b2522);
    B(body, .5, 1.72, .17, .12, .3, .1, 0xcf9a68); B(body, .5, 1.72, -.17, .12, .3, .1, 0xcf9a68); B(body, .95, 1.08, .09, .05, .14, .05, 0xffffff); B(body, .95, 1.08, -.09, .05, .14, .05, 0xffffff);
    eye(.84, 1.43, .2); eye(.84, 1.43, -.2); B(body, -.6, 1.05, 0, .14, .2, .2, 0xffffff);
    L = legs(g, [[.38, .2], [.38, -.2], [-.38, .2], [-.38, -.2]], .17, .68, 0xa9744a);
  } else if (type === 'raccoon') { // 너구리
    B(body, 0, .7, 0, .9, .55, .62, 0x9c7a5c); B(body, .5, 1.0, 0, .55, .5, .55, 0xb08a68); B(body, .68, 1.02, 0, .24, .18, .58, 0x4a3a32); B(body, .8, .92, 0, .14, .14, .2, 0xe9d9c4); B(body, .88, .95, 0, .06, .06, .08, 0x2b2522);
    B(body, .45, 1.33, .18, .14, .16, .1, 0x6b5444); B(body, .45, 1.33, -.18, .14, .16, .1, 0x6b5444); eye(.8, 1.06, .17); eye(.8, 1.06, -.17);
    [[-.55, 0x9c7a5c], [-.75, 0x4a3a32], [-.95, 0x9c7a5c]].forEach(([x, c]) => B(body, x, .82, 0, .24, .26, .26, c));
    L = legs(g, [[.28, .18], [.28, -.18], [-.28, .18], [-.28, -.18]], .16, .42, 0x4a3a32);
  } else if (type === 'boar') { // 멧돼지
    B(body, 0, .8, 0, 1.25, .78, .78, 0x7b5a43); B(body, -.05, 1.22, 0, 1.0, .14, .4, 0x5e4433); B(body, .72, .82, 0, .4, .52, .6, 0x86644b); B(body, .98, .75, 0, .16, .28, .36, 0xe8a9a0);
    B(body, 1.02, .78, .08, .04, .06, .05, 0x5e3b33); B(body, 1.02, .78, -.08, .04, .06, .05, 0x5e3b33); B(body, .93, .62, .2, .06, .2, .06, 0xfffbe8); B(body, .93, .62, -.2, .06, .2, .06, 0xfffbe8);
    B(body, .6, 1.2, .24, .14, .2, .1, 0x5e4433); B(body, .6, 1.2, -.24, .14, .2, .1, 0x5e4433); eye(.9, 1.0, .2); eye(.9, 1.0, -.2); blush(.92, .88, .3);
    L = legs(g, [[.4, .24], [.4, -.24], [-.4, .24], [-.4, -.24]], .2, .42, 0x4f3a2c);
  } else if (type === 'badger') { // 오소리
    B(body, 0, .62, 0, 1.0, .5, .66, 0x8b8f99); B(body, .56, .72, 0, .48, .44, .52, 0xf5f2ea); B(body, .58, .74, .14, .5, .44, .12, 0x2f3038); B(body, .58, .74, -.14, .5, .44, .12, 0x2f3038);
    B(body, .82, .66, 0, .12, .12, .14, 0x2b2522); eye(.75, .8, .25); eye(.75, .8, -.25);
    L = legs(g, [[.3, .2], [.3, -.2], [-.3, .2], [-.3, -.2]], .18, .38, 0x2f3038);
  } else if (type === 'squirrel') { // 다람쥐
    B(body, 0, .55, 0, .5, .55, .42, 0xe0874a); B(body, .22, .95, 0, .44, .42, .42, 0xe89058); B(body, .2, .62, 0, .3, .35, .44, 0xfff0dc);
    B(body, .14, 1.22, .13, .1, .16, .08, 0xe0874a); B(body, .14, 1.22, -.13, .1, .16, .08, 0xe0874a); eye(.42, 1.0, .14); eye(.42, 1.0, -.14);
    B(body, -.38, .75, 0, .32, .7, .38, 0xe89058); B(body, -.48, 1.15, 0, .34, .4, .4, 0xf2a66c);
    L = legs(g, [[.12, .12], [.12, -.12], [-.1, .12], [-.1, -.12]], .13, .3, 0xc6703a);
  } else if (type === 'goral') { // 산양
    B(body, 0, 1.0, 0, 1.1, .62, .6, 0x8e8478); B(body, .62, 1.42, 0, .5, .5, .46, 0x9c9286); B(body, .86, 1.32, 0, .2, .24, .3, 0xd8d0c4); B(body, .5, 1.78, .12, .08, .24, .08, 0x2b2522); B(body, .5, 1.78, -.12, .08, .24, .08, 0x2b2522);
    B(body, .4, 1.4, .27, .16, .12, .08, 0x9c9286); B(body, .4, 1.4, -.27, .16, .12, .08, 0x9c9286); eye(.82, 1.5, .18); eye(.82, 1.5, -.18); B(body, .2, 1.36, 0, .2, .2, .62, 0x6e6458);
    L = legs(g, [[.36, .2], [.36, -.2], [-.36, .2], [-.36, -.2]], .17, .72, 0x5e554b);
  } else if (type === 'turtle') { // 꼬북이
    B(body, 0, .55, 0, 1.3, .5, 1.1, 0x5fae5a); B(body, 0, .85, 0, 1.0, .3, .85, 0x6fc066); B(body, 0, 1.03, 0, .6, .16, .5, 0x82d077);
    [[.3, .3], [-.3, .3], [.3, -.3], [-.3, -.3], [0, 0]].forEach(([x, z]) => B(body, x, 1.0, z, .2, .06, .2, 0x4f9b4b));
    B(body, 0, .38, 0, 1.2, .14, 1.0, 0xf3e3a3);
    const head = new THREE.Group(); head.position.set(.82, .82, 0); body.add(head);
    B(head, 0, 0, 0, .6, .55, .55, 0x9fd88a); B(head, .29, .06, .14, .08, .14, .06, 0x2b2522); B(head, .29, .06, -.14, .08, .14, .06, 0x2b2522); B(head, .31, .1, .16, .03, .04, .02, 0xffffff); B(head, .31, .1, -.12, .03, .04, .02, 0xffffff);
    B(head, .3, -.08, .21, .04, .05, .1, 0xffa3a3); B(head, .3, -.08, -.21, .04, .05, .1, 0xffa3a3); B(head, -.18, -.24, 0, .3, .16, .62, 0xff9a4a);
    g.userData.head = head;
    L = []; [[.45, .6], [.45, -.6], [-.45, .55], [-.45, -.55]].forEach(([x, z]) => { const p = new THREE.Group(); p.position.set(x, .45, z); B(p, 0, 0, z > 0 ? .15 : -.15, .45, .12, .4, 0x8fcf7c); g.add(p); L.push(p); });
  }
  g.userData.legs = L; g.userData.body = body; g.userData.type = type;
  return g;
}
function walkAnim(a, t, speed = 1) { const L = a.userData.legs; L.forEach((l, i) => l.rotation.z = Math.sin(t * 12 * speed + (i % 2 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * .5); a.userData.body.position.y = Math.abs(Math.sin(t * 12 * speed)) * .06; }
function idleAnim(a, t, ph = 0) { a.userData.legs.forEach(l => l.rotation.z *= .8); a.userData.body.position.y = Math.abs(Math.sin(t * 2.5 + ph)) * .04; }

/* ---------- water ---------- */
function water(size = 80, color = P.water) {
  const geo = new THREE.PlaneGeometry(size, size, 80, 80); geo.rotateX(-Math.PI / 2); const base = geo.attributes.position.array.slice();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: .18, metalness: .05, transparent: true, opacity: .9 })); m.receiveShadow = true;
  m.userData.tick = t => { const p = geo.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const x = base[i], z = base[i + 2]; p[i + 1] = Math.sin(x * .5 + t * 1.4) * .06 + Math.cos(z * .45 + t * 1.1) * .06; } geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); };
  return m;
}
function foamRing(r1, r2) { const m = new THREE.Mesh(new THREE.RingGeometry(r1, r2, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55 })); m.rotation.x = -Math.PI / 2; m.position.y = .08; return m; }
function island(rad = 6) { // stepped round island
  const g = new THREE.Group(); const L = [];
  for (let x = -rad; x <= rad; x++) for (let z = -rad; z <= rad; z++) {
    const d = Math.hypot(x, z * 1.15); if (d > rad + .3) continue;
    const top = d < rad - 1.6;
    L.push([x, -.25, z, 1, .9, 1, top ? ((x + z) % 2 ? P.grass : P.grass2) : ((x + z) % 2 ? P.sand : P.sand2)]);
    if (top && d < rad - 3.5) L.push([x, .45, z, 1, .5, 1, (x + z) % 2 ? P.grass : P.grass2]);
  }
  inst(g, L); return g;
}

/* =================== TITLE: cozy island =================== */
export function titleScene(host) {
  const ctx = rig(host, { sky: ['#9fdcff', '#e6f7ff'], fov: 30, shadow: 14 }); const { sc, cam } = ctx;
  const sea = water(90); sc.add(sea); const isl = island(5); isl.position.set(-1, 0, -1); sc.add(isl); const foam = foamRing(5.2, 6.1); foam.position.set(-1, .08, -1); sc.add(foam);
  [[-3, .65, -2, 2], [0, .65, -3.5, 2], [-4.5, .2, .5, 2], [1, 1.15, -1.5, 0], [-2, 1.15, -.5, 1]].forEach(([x, y, z, k]) => { const t = tree(k, k === 2 ? 1 : .8); t.position.set(x, y, z); isl.add(t); });
  for (let i = 0; i < 14; i++) { const f = flower([0xff8d9b, 0xffd25a, 0xffffff, 0xb9a6e8][i % 4]); const a = Math.random() * 6.28, d = 1 + Math.random() * 1.5; f.position.set(-1 + Math.cos(a) * d, .7, -1 + Math.sin(a) * d); sc.add(f); }
  // tent + flag
  const tent = new THREE.Group(); B(tent, 0, .45, 0, 1.6, .9, 1.4, 0xfff4dc); B(tent, 0, 1.05, 0, 1.2, .35, 1.5, 0x7cc9b8); B(tent, .81, .35, 0, .05, .6, .5, 0xff8c7a);
  B(tent, -.9, 1.4, .8, .07, 1.8, .07, P.wood2); B(tent, -.6, 2.05, .8, .55, .35, .04, 0xff8c7a); tent.position.set(-.5, .95, -2); sc.add(tent);
  // pier
  for (let i = 0; i < 5; i++) B(sc, 4.2 + i * .9, .25, -2.2, .85, .14, 1.2, i % 2 ? P.wood : P.wood2);
  for (let i = 0; i < 3; i++) B(sc, 4.6 + i * 1.6, 0, -1.55, .2, .8, .2, P.wood2);
  // turtle hero
  const tur = animal('turtle'); tur.scale.setScalar(1.5); tur.position.set(3.2, -.15, 5.2); tur.rotation.y = -.7; sc.add(tur);
  // jelly & trash floating
  const floaters = [];
  for (let i = 0; i < 6; i++) { const f = new THREE.Group(); if (i % 2) { B(f, 0, .2, 0, .5, .3, .5, 0xf7b6dc, { transparent: true, opacity: .85 }); for (let k = 0; k < 3; k++) B(f, -.15 + k * .15, -.05, 0, .05, .3, .05, 0xf7c6e6); } else { B(f, 0, .15, 0, .45, .4, .1, 0xffffff, { transparent: true, opacity: .8 }); B(f, -.12, .4, 0, .08, .15, .08, 0xffffff, { transparent: true, opacity: .8 }); B(f, .12, .4, 0, .08, .15, .08, 0xffffff, { transparent: true, opacity: .8 }); }
    const a = i * 1.05 + .3; f.position.set(Math.cos(a) * 9, 0, Math.sin(a) * 8 + 1); f.userData.p = Math.random() * 6; sc.add(f); floaters.push(f); }
  const clouds = []; for (let i = 0; i < 5; i++) { const c = cloud(); c.position.set(-18 + i * 9, 9 + (i % 2) * 1.5, -16 - (i % 3) * 3); c.scale.setScalar(1.2 + (i % 2) * .4); sc.add(c); clouds.push(c); }
  run(host, ctx, (dt, t) => {
    sea.userData.tick(t);
    tur.position.y = -.15 + Math.sin(t * 1.6) * .08; tur.rotation.z = Math.sin(t * 1.6) * .04; tur.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 3 + i) * .35); tur.userData.head.rotation.y = Math.sin(t * .8) * .25;
    floaters.forEach(f => { f.position.y = .05 + Math.sin(t * 1.5 + f.userData.p) * .12; f.rotation.y += dt * .3; });
    clouds.forEach(c => { c.position.x += dt * .5; if (c.position.x > 24) c.position.x = -24; });
    cam.position.set(Math.sin(t * .12) * 3 + 12, 11, 19 + Math.cos(t * .12) * 2); cam.lookAt(.8, .3, .8);
  });
}

/* =================== BEACH CLEANUP =================== */
export function beachScene(host, { onPick, onTurtleFree, onAllDone, sfx = () => { } } = {}) {
  const ctx = rig(host, { sky: ['#9fdcff', '#eafaff'], fov: 34, shadow: 16 }); const { sc, cam } = ctx;
  const sea = water(90); sea.position.set(0, -.42, -14); sc.add(sea);
  // beach terrain: sand slope
  const T0 = []; for (let x = -12; x <= 12; x++) for (let z = -6; z <= 8; z++) { const h = z < -3 ? -.4 : (z < 3 ? 0 : .5); T0.push([x, h - .45, z, 1, 1, 1, z >= 5 ? ((x + z) % 2 ? P.grass : P.grass2) : ((x + z) % 2 ? P.sand : P.sand2)]); } inst(sc, T0);
  for (let i = 0; i < 8; i++) { const side = i % 2 ? 1 : -1; const t = tree(i % 3 === 0 ? 2 : 0, .9); t.position.set(side * (10 + (i % 3) * .9), i < 4 ? .55 : .05, 6.5 - Math.floor(i / 2) * 3); sc.add(t); }
  for (let i = 0; i < 6; i++) { const r = rock(.8 + Math.random() * .4); r.position.set(-10 + i * 4, .05, -2 + (i % 2) * 1.2); sc.add(r); }
  // trash items (voxel)
  const types = [
    ['pet', g => { B(g, 0, .35, 0, .3, .7, .3, 0xbfe9ff, { transparent: true, opacity: .8 }); B(g, 0, .4, 0, .32, .22, .32, 0x4aa3e8); B(g, 0, .78, 0, .16, .1, .16, 0x2f7fd0); }],
    ['can', g => { B(g, 0, .3, 0, .34, .55, .34, 0xd9dde3, { metalness: .4, roughness: .35 }); B(g, 0, .3, 0, .36, .22, .36, 0xff8c7a); }],
    ['vinyl', g => { B(g, 0, .2, 0, .6, .35, .5, 0xffffff, { transparent: true, opacity: .75 }); B(g, -.15, .45, 0, .12, .2, .12, 0xffffff, { transparent: true, opacity: .75 }); B(g, .15, .45, 0, .12, .2, .12, 0xffffff, { transparent: true, opacity: .75 }); }],
    ['mask', g => { B(g, 0, .08, 0, .6, .12, .38, 0xf4f8ff); B(g, .38, .08, 0, .16, .04, .3, 0xffffff); B(g, -.38, .08, 0, .16, .04, .3, 0xffffff); }],
    ['straw', g => { const m = B(g, 0, .06, 0, .9, .08, .08, 0x7fc8ff); m.rotation.y = .6; }],
    ['line', g => { for (let i = 0; i < 5; i++) { const m = B(g, Math.cos(i) * .2, .04, Math.sin(i * 1.3) * .2, .5, .03, .03, 0xcfefff, { transparent: true, opacity: .9 }); m.rotation.y = i; } }],
    ['glass', g => { B(g, 0, .3, 0, .28, .55, .28, 0x8a5a2e, { transparent: true, opacity: .9, roughness: .2 }); B(g, 0, .65, 0, .12, .18, .12, 0x8a5a2e); }],
    ['paper', g => { B(g, 0, .15, 0, .55, .3, .4, 0xd0a06a); }],
    ['snack', g => { B(g, 0, .1, 0, .5, .14, .36, 0x7fd0ff); B(g, 0, .17, 0, .3, .04, .2, 0xffd25a); }],
  ];
  const spots = [[-8, 1], [-5.5, -1.5], [-3, 2], [-1, -.5], [1.5, 1.8], [3.5, -1.2], [6, 1], [8.5, -.5], [-6.8, 3.5], [5, 3.4], [-2.2, 4], [2.6, 4.2]];
  const items = spots.map(([x, z], i) => { const [k, mk] = types[i % types.length]; const g = new THREE.Group(); mk(g); g.scale.setScalar(1.7); g.position.set(x, z >= 3 ? .55 : .05, z); g.rotation.y = Math.random() * 6; g.userData = { pick: true, kind: k, trash: true }; sc.add(g);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.55, .7, 24), new THREE.MeshBasicMaterial({ color: 0xffd25a, transparent: true, opacity: .8 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; g.add(ring); g.userData.ring = ring; return g; });
  // turtle tangled in net
  const tur = animal('turtle'); tur.scale.setScalar(1.3); tur.position.set(.5, .05, -2.6); tur.rotation.y = .9; sc.add(tur);
  const net = new THREE.Group(); for (let i = 0; i < 6; i++) { const a = B(net, 0, .45 + i * .14, 0, 2.0, .08, .08, 0xff9f5a); a.rotation.y = i * .55; const b2 = B(net, 0, .55 + i * .1, 0, .08, .08, 1.8, 0x6fb7d6); b2.rotation.y = i * .7 + .3; } const hitN = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 2.2), new THREE.MeshBasicMaterial({ visible: false })); hitN.position.y = .7; net.add(hitN);
  net.position.copy(tur.position); net.scale.setScalar(1.3); net.userData = { pick: true, net: true, hp: 5 }; sc.add(net);
  let picked = 0, freed = false, turT = 0; const total = items.length;
  const flying = [];
  picker(ctx, () => [...items.filter(i => !i.userData.done), ...(freed ? [] : [net])], (o) => {
    if (o.userData.net) { o.userData.hp--; sfx('stamp'); o.scale.setScalar(1.3 * (.8 + o.userData.hp * .04)); o.rotation.y += .4; if (o.userData.hp <= 0) { freed = true; sc.remove(net); sfx('splash'); onTurtleFree && onTurtleFree(); check(); } return; }
    o.userData.done = true; picked++; sfx('pickup'); flying.push({ o, t: 0, from: o.position.clone() }); onPick && onPick(o.userData.kind, picked, total); check();
  });
  function check() { if (picked === total && freed) setTimeout(() => { sfx('build_done'); onAllDone && onAllDone(); }, 600); }
  run(host, ctx, (dt, t) => {
    sea.userData.tick(t);
    items.forEach((g, i) => { if (!g.userData.done) { g.userData.ring.material.opacity = .45 + Math.sin(t * 4 + i) * .35; g.position.y = (g.position.z >= 3 ? .55 : .05) + Math.abs(Math.sin(t * 2 + i)) * .06; } });
    flying.forEach(f => { f.t += dt * 1.8; const k = Math.min(1, f.t); f.o.position.set(f.from.x + (cam.position.x - f.from.x) * k * .6, f.from.y + Math.sin(k * Math.PI) * 3 + k * 4, f.from.z + (cam.position.z - f.from.z) * k * .6); f.o.scale.setScalar(1 - k * .9); if (k >= 1) f.o.visible = false; });
    if (!freed) { tur.rotation.z = Math.sin(t * 9) * .06; tur.userData.head.rotation.y = Math.sin(t * 5) * .3; }
    else { turT += dt; tur.position.z -= dt * 1.6; tur.position.y = .05 - Math.min(.6, turT * .3); tur.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 8 + i) * .5); tur.rotation.z = 0; }
    cam.position.set(Math.sin(t * .15) * 1.5, 13, 13); cam.lookAt(0, 0, .6);
  });
}

/* =================== ECO-BRIDGE BUILDER =================== */
export function bridgeBuild(host, { onInv, onStage, onDone, sfx = () => { } } = {}) {
  const ctx = rig(host, { sky: ['#a8e2ff', '#effaff'], fov: 33, shadow: 18 }); const { sc, cam } = ctx;
  // ground: near side z>2, far side z<-2, road between
  const T1 = []; for (let x = -14; x <= 14; x++) for (let z = -9; z <= 9; z++) { if (Math.abs(z) <= 1) continue; const c = (x + z) % 2 ? P.grass : P.grass2; T1.push([x, -.5, z, 1, 1, 1, Math.abs(z) === 2 ? 0xd9d2c0 : c]); }
  for (let x = -14; x <= 14; x++) { T1.push([x, -.6, 0, 1, .9, 3, P.road]); if (x % 2 === 0) T1.push([x, -.13, 0, .55, .04, .12, 0xffffff]); } inst(sc, T1);
  // forests (keep center clear)
  for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1; let x = -13 + Math.random() * 26; if (Math.abs(x) < 3.5) x += x < 0 ? -3.5 : 3.5; const z = side * (5 + Math.random() * 3.5); const t = tree(i % 3 === 0 ? 1 : 0, .8 + Math.random() * .35); t.position.set(x, 0, z); sc.add(t); }
  for (let i = 0; i < 30; i++) { const f = flower([0xff8d9b, 0xffd25a, 0xffffff, 0xb9a6e8][i % 4]); f.position.set(-12 + Math.random() * 24, 0, (i % 2 ? 1 : -1) * (2.6 + Math.random() * 6)); sc.add(f); }
  for (let i = 0; i < 6; i++) { const b = bush(); b.position.set(-12 + i * 5, 0, -3 - (i % 2)); sc.add(b); }
  // cars
  const cars = [[0xff8c7a, 1, .7, 0], [0x8fd6f0, 1, .7, 15], [0xffd25a, -1, -.7, 7], [0xb9a6e8, -1, -.7, 21]].map(([c, d, z, off]) => { const m = car(c); m.position.set(-16 + off, 0, z); m.rotation.y = d > 0 ? 0 : Math.PI; m.userData.d = d; sc.add(m); return m; });
  // materials to gather (near side)
  const res = [];
  const mkLog = (x, z) => { const g = new THREE.Group(); const l = B(g, 0, .25, 0, 1.4, .45, .45, P.wood); B(g, .71, .25, 0, .04, .4, .4, 0xe7c08e); B(g, -.71, .25, 0, .04, .4, .4, 0xe7c08e); g.rotation.y = Math.random() * 3; g.position.set(x, 0, z); g.userData = { pick: true, res: 'wood', n: 2 }; return g; };
  const mkRock = (x, z) => { const g = rock(1); g.position.set(x, 0, z); g.userData = { pick: true, res: 'stone', n: 2 }; return g; };
  const mkSoil = (x, z) => { const g = new THREE.Group(); B(g, 0, .2, 0, .9, .4, .9, P.dirt); B(g, 0, .45, 0, .9, .14, .9, P.grass); B(g, .2, .6, .1, .12, .2, .12, 0x5aa04a); g.position.set(x, 0, z); g.userData = { pick: true, res: 'soil', n: 2 }; return g; };
  [[-6, 3.6], [-4.4, 6.2], [5.2, 3.4], [7, 5.8], [-8.5, 4.6]].forEach(p => res.push(mkLog(...p)));
  [[-2.6, 6.8], [3.4, 6.6], [-7, 7.4], [8.6, 3.8]].forEach(p => res.push(mkRock(...p)));
  [[-9.6, 2.8], [9.8, 2.9], [-1.4, 8.4], [1.6, 8.3], [6.2, 8.2]].forEach(p => res.push(mkSoil(...p)));
  res.forEach(r => { sc.add(r); const ring = new THREE.Mesh(new THREE.RingGeometry(.7, .85, 24), new THREE.MeshBasicMaterial({ color: 0xffd25a, transparent: true, opacity: .8 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; r.add(ring); r.userData.ring = ring; });
  const inv = { wood: 0, stone: 0, soil: 0 }, need = { stone: 8, wood: 10, soil: 10 };
  // blueprint cells: [x, y, z, material]
  const cells = [];
  for (const z of [-2, 2]) for (const y of [0, 1]) for (const x of [-.5, .5]) cells.push([x, y, z, 'stone', 0]);
  for (let z = -2; z <= 2; z++) for (const x of [-.5, .5]) cells.push([x, 2, z, 'wood', 1]);
  for (let z = -2; z <= 2; z++) for (const x of [-.5, .5]) cells.push([x, 3, z, 'soil', 2]);
  const colorOf = { stone: P.stone, wood: P.wood, soil: P.grass };
  const ghosts = cells.map(([x, y, z, m, st]) => { const g = new THREE.Mesh(rbox(.98, .98, .98), new THREE.MeshStandardMaterial({ color: colorOf[m], transparent: true, opacity: .0, depthWrite: false })); g.position.set(x, y, z); g.userData = { pick: true, cell: true, m, st, placed: false }; g.castShadow = false; sc.add(g); return g; });
  let stage = -1, phase = 'gather', doneT = -1;
  const stageNames = ['1단계: 돌로 튼튼한 기둥 세우기', '2단계: 나무로 다리 바닥 깔기', '3단계: 흙을 덮어 숲길 만들기'];
  function setStage(s) { stage = s; onStage && onStage(s, s < 3 ? stageNames[s] : '완성!'); }
  const animals = ['deer', 'raccoon', 'boar', 'badger', 'squirrel'].map((k, i) => { const a = animal(k); a.position.set(-7 + i * 1.3, 0, 4.2 + (i % 2) * .6); a.rotation.y = -Math.PI / 2; a.userData.ph = Math.random() * 6; a.userData.delay = i * .7; sc.add(a); return a; });
  const deco = new THREE.Group(); sc.add(deco); deco.visible = false;
  // ramps + plants on bridge (revealed at completion)
  for (const s of [1, -1]) for (let k = 0; k < 3; k++) for (const x of [-.5, .5]) B(deco, x, .5 + k - .5, s * (3 + (2 - k)), 1, 1 + 0, 1, k === 2 ? P.grass : P.dirt);
  for (const [x, z] of [[-.6, -1.6], [.6, 1.4], [-.5, .3]]) { const t = tree(0, .45); t.position.set(x, 3.5, z); deco.add(t); }
  for (let i = 0; i < 8; i++) { const f = flower([0xff8d9b, 0xffd25a, 0xffffff][i % 3]); f.position.set(-.8 + Math.random() * 1.6, 3.5, -2.3 + Math.random() * 4.6); deco.add(f); }
  const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 5.5), new THREE.Vector3(0, 0, 5.2), new THREE.Vector3(0, 1.5, 4.1), new THREE.Vector3(0, 3.5, 2.6), new THREE.Vector3(0, 3.5, -2.6), new THREE.Vector3(0, 1.5, -4.1), new THREE.Vector3(0, 0, -5.4), new THREE.Vector3(0, 0, -6.4)]);
  const flying = [];
  picker(ctx, () => phase === 'gather' ? res.filter(r => !r.userData.done) : ghosts.filter(g => !g.userData.placed && g.userData.st === stage), (o) => {
    if (o.userData.res) {
      const k = o.userData.res; if (inv[k] >= need[k]) { sfx('wrong', .3); return; }
      o.userData.done = true; inv[k] = Math.min(need[k], inv[k] + o.userData.n); sfx('pickup'); flying.push({ o, t: 0, from: o.position.clone() }); onInv && onInv(inv, need);
      if (inv.wood >= need.wood && inv.stone >= need.stone && inv.soil >= need.soil) { phase = 'build'; setTimeout(() => { setStage(0); sfx('key'); }, 500); }
    } else if (o.userData.cell) {
      if (inv[o.userData.m] <= 0) return; inv[o.userData.m]--; onInv && onInv(inv, need);
      o.userData.placed = true; o.userData.pt = 0; o.material = mat(colorOf[o.userData.m]); o.castShadow = true; o.receiveShadow = true; sfx('place');
      if (o.userData.m === 'soil') { const top = B(sc, o.position.x, o.position.y + .42, o.position.z, .98, .16, .98, P.grass); top.scale.y = .01; o.userData.top = top; o.material = mat(P.dirt); }
      if (ghosts.filter(g => g.userData.st === stage).every(g => g.userData.placed)) { if (stage < 2) { setTimeout(() => { setStage(stage + 1); sfx('key'); }, 450); } else { phase = 'done'; setStage(3); setTimeout(() => { deco.visible = true; deco.scale.set(1, .01, 1); doneT = 0; sfx('build_done'); }, 500); } }
    }
  });
  let crossed = 0;
  run(host, ctx, (dt, t) => {
    cars.forEach(c => { c.position.x += c.userData.d * 7 * dt; if (c.position.x > 17) c.position.x = -17; if (c.position.x < -17) c.position.x = 17; c.position.y = Math.abs(Math.sin(t * 14 + c.position.x)) * .03; });
    res.forEach((r, i) => { if (!r.userData.done) { r.userData.ring.material.opacity = .4 + Math.sin(t * 4 + i) * .35; r.position.y = Math.abs(Math.sin(t * 2.4 + i)) * .08; } });
    flying.forEach(f => { f.t += dt * 1.8; const k = Math.min(1, f.t); f.o.position.set(f.from.x * (1 - k), f.from.y + Math.sin(k * Math.PI) * 3, f.from.z + (8 - f.from.z) * k); f.o.scale.setScalar(Math.max(.01, 1 - k)); if (k >= 1) f.o.visible = false; });
    ghosts.forEach(g => { if (!g.userData.placed) { const active = phase === 'build' && g.userData.st === stage; g.material.opacity = active ? .55 + Math.sin(t * 5) * .2 : 0; g.material.emissive = g.material.emissive || new THREE.Color(); if (active) g.material.emissive.setRGB(.35 + Math.sin(t * 5) * .2, .3, .05); } else if (g.userData.pt < 1) { g.userData.pt = Math.min(1, g.userData.pt + dt * 4); const s = backOut(g.userData.pt); g.scale.set(s, s, s); if (g.userData.top) g.userData.top.scale.y = Math.max(.01, g.userData.pt); } });
    if (doneT >= 0) { doneT += dt; deco.scale.y = Math.min(1, backOut(Math.min(1, doneT / 1.2))) || .01;
      animals.forEach((a, i) => { const u = a.userData; if (doneT > 1.4 + u.delay && !u.go && !u.fin) { u.go = true; u.t = 0; a.rotation.y = Math.PI / 2 * -1 + Math.PI; }
        if (u.go) { u.t += dt / 5; const k = Math.min(1, u.t); const p = path.getPointAt(k); const p2 = path.getPointAt(Math.min(1, k + .01)); a.position.set(p.x + (i - 2) * .32, p.y, p.z); a.lookAt(p2.x + (i - 2) * .32, p2.y, p2.z); a.rotateY(-Math.PI / 2); walkAnim(a, t);
          if (k >= 1) { u.go = false; u.fin = true; crossed++; sfx('hop', .5); if (crossed === animals.length) setTimeout(() => onDone && onDone(), 500); } }
        else if (u.fin) { a.position.y = Math.abs(Math.sin(t * 6 + i)) * .3; } });
    } else animals.forEach(a => { idleAnim(a, t, a.userData.ph); a.rotation.y = -Math.PI / 2 + Math.sin(t + a.userData.ph) * .3; });
    const k = phase === 'gather' ? 0 : 1;
    const cp = new THREE.Vector3(0, 13, 17), cb = new THREE.Vector3(12, 11, 12);
    cam.position.lerp(k ? cb : cp, .03); cam.lookAt(0, k ? 1.6 : .5, k ? 0 : 2);
  });
  onInv && onInv(inv, need);
}

/* =================== GORAL FENCE =================== */
export function fenceScene(host, { onCut, onFree, sfx = () => { } } = {}) {
  const ctx = rig(host, { sky: ['#cfe9ff', '#f3fbff'], fov: 33, shadow: 16 }); const { sc, cam } = ctx;
  // terraces: left high snowy, right low green valley
  const T2 = []; for (let x = -12; x <= 12; x++) for (let z = -7; z <= 7; z++) { const h = x < -1 ? (x < -6 ? 2 : 1) : 0; for (let y = 0; y <= h; y++) T2.push([x, y - .5, z, 1, 1, 1, y === h ? (x < 0 ? P.snow : ((x + z) % 2 ? P.grass : P.grass2)) : (x < 0 ? 0xe2e8ee : P.dirt)]); } inst(sc, T2);
  for (let i = 0; i < 12; i++) { const t = tree(1, .8); const x = -11 + Math.random() * 4; t.position.set(x, x < -6 ? 2 : 1, -6 + Math.random() * 12); t.traverse(m => { if (m.isMesh && m.material.color.getHex() !== P.wood2) m.material = mat(0xeef5ff); }); sc.add(t); }
  for (let i = 0; i < 10; i++) { const t = tree(0, .8); t.position.set(4 + Math.random() * 7, 0, -6 + Math.random() * 12); sc.add(t); }
  for (let i = 0; i < 26; i++) { const f = flower([0xff8d9b, 0xffd25a, 0xffffff, 0xb9a6e8][i % 4]); f.position.set(1 + Math.random() * 10, 0, -6 + Math.random() * 12); sc.add(f); }
  // snowflakes
  const flakes = []; for (let i = 0; i < 80; i++) { const f = B(sc, -12 + Math.random() * 14, Math.random() * 10, -7 + Math.random() * 14, .08, .08, .08, 0xffffff); f.castShadow = false; flakes.push(f); }
  // fence along x=-.2 from z=-4.5..4.5 in 3 panels
  const panels = [];
  for (let i = 0; i < 3; i++) { const g = new THREE.Group(); B(g, 0, 1, -1.5, .14, 2, .14, 0x6a6a78); for (let k = 0; k < 6; k++) B(g, 0, .25 + k * .33, 0, .05, .05, 3, 0x7d7d8c); for (let k = 0; k < 9; k++) B(g, 0, 1, -1.35 + k * .34, .05, 1.8, .05, 0x7d7d8c);
    const glow = B(g, 0, 1, 0, .1, 2, 3, 0xff8c7a, { transparent: true, opacity: .25, emissive: 0xff8c7a, emissiveIntensity: .4 }); glow.castShadow = false; const hitF = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 2.9), new THREE.MeshBasicMaterial({ visible: false })); hitF.position.y = 1.1; g.add(hitF); g.userData = { pick: true, glow, cut: false, f: 0 }; g.position.set(-.2, 0, -3 + i * 3); sc.add(g); panels.push(g); }
  B(sc, -.2, 1, 4.5, .14, 2, .14, 0x6a6a78);
  const gor = animal('goral'); gor.position.set(-3.5, .5, 0); gor.rotation.y = 0; sc.add(gor);
  let cut = 0, walk = -1;
  picker(ctx, () => panels.filter(p => !p.userData.cut), (p) => { p.userData.cut = true; p.userData.glow.visible = false; cut++; sfx('place'); onCut && onCut(cut); if (cut === 3) setTimeout(() => { walk = 0; sfx('hop'); }, 700); });
  run(host, ctx, (dt, t) => {
    flakes.forEach((f, i) => { f.position.y -= dt * (.6 + (i % 3) * .2); if (f.position.y < 0) f.position.y = 10; });
    panels.forEach((p, i) => { if (p.userData.cut && p.userData.f < 1) { p.userData.f = Math.min(1, p.userData.f + dt * 1.5); p.rotation.x = 0; p.rotation.z = -ease(p.userData.f) * 1.5; p.position.x = -.2 + ease(p.userData.f) * 1.2; } else if (!p.userData.cut) p.userData.glow.material.opacity = .4 + Math.sin(t * 5 + i) * .2; });
    if (walk >= 0) { walk += dt / 3.4; const k = Math.min(1, walk); const x = -3.5 + k * 9; const y = x < -1 ? .5 : Math.max(0, .5 - (x + 1) * .6); gor.position.set(x, y, 0); walkAnim(gor, t); if (k >= 1 && !gor.userData.fin) { gor.userData.fin = true; onFree && onFree(); } }
    else idleAnim(gor, t);
    if (gor.userData.fin) gor.userData.body.rotation.z = Math.sin(t * 4) * .08 - .2;
    cam.position.set(11 + Math.sin(t * .2) * .8, 8.5, 7); cam.lookAt(-1, .6, 0);
  });
}

export { THREE, B, rbox, mat, P, rig, run, inst, tree, flower, rock, bush, car, animal, walkAnim, idleAnim, water, ease, backOut };
