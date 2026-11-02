// Walkable avatar scenes (no clicking): 바닷가 대청소 · 생태통로 짓기 · 산양 울타리
import { THREE, B, rbox, mat, P, rig, run, inst, tree, flower, rock, car, animal, walkAnim, idleAnim, water, ease, backOut } from './voxel.js';

function avatar() {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  B(body, 0, .95, 0, .52, .56, .36, 0xff9a4a); B(body, 0, .82, .17, .3, .2, .04, 0xfff4e0);
  B(body, 0, 1.52, 0, .56, .55, .5, 0xffd7b5);
  B(body, 0, 1.78, 0, .62, .18, .56, 0x6b4a33); B(body, 0, 1.62, -.24, .56, .36, .1, 0x6b4a33);
  B(body, .11, 1.55, .26, .07, .11, .03, 0x2b2522); B(body, -.11, 1.55, .26, .07, .11, .03, 0x2b2522); B(body, .18, 1.45, .26, .08, .05, .02, 0xffa3a3); B(body, -.18, 1.45, .26, .08, .05, .02, 0xffa3a3);
  B(body, 0, 1.92, 0, .44, .1, .44, 0x3bb8a8); B(body, 0, 1.88, .24, .44, .05, .2, 0x3bb8a8);
  const arms = [-1, 1].map(sx => { const a = new THREE.Group(); a.position.set(sx * .34, 1.18, 0); B(a, 0, -.2, 0, .15, .42, .17, 0xffd7b5); body.add(a); return a; });
  const legs = [-1, 1].map(sx => { const l = new THREE.Group(); l.position.set(sx * .12, .66, 0); B(l, 0, -.3, 0, .18, .6, .2, 0x5b7fd0); B(l, 0, -.6, .04, .2, .1, .27, 0x3a3a46); g.add(l); return l; });
  const pack = new THREE.Group(); pack.position.set(0, 1.0, -.26); body.add(pack); B(pack, 0, 0, 0, .42, .46, .16, 0x6cc070);
  g.userData = { body, arms, legs, pack }; return g;
}
function animAv(a, t, moving) { const u = a.userData, k = moving ? 1 : 0; u.legs[0].rotation.x = Math.sin(t * 11) * .6 * k; u.legs[1].rotation.x = -Math.sin(t * 11) * .6 * k; u.arms[0].rotation.x = -Math.sin(t * 11) * .6 * k; u.arms[1].rotation.x = Math.sin(t * 11) * .6 * k; u.body.position.y = moving ? Math.abs(Math.sin(t * 11)) * .06 : Math.sin(t * 2) * .02; }
function controls(host) {
  const keys = {};
  const kd = e => { const k = e.key.toLowerCase(); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { keys[k] = e.type === 'keydown'; e.preventDefault(); } };
  addEventListener('keydown', kd); addEventListener('keyup', kd);
  const joy = document.createElement('div'); joy.className = 'joy'; joy.innerHTML = '<div class="knob"></div><span>끌어서 움직여요</span>'; host.appendChild(joy);
  const knob = joy.firstChild; let jid = null, jv = { x: 0, z: 0 };
  const jm = e => { const r = joy.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const L = Math.hypot(dx, dy), M = r.width / 2 - 8; if (L > M) { dx *= M / L; dy *= M / L; } knob.style.transform = `translate(${dx}px,${dy}px)`; jv = { x: dx / M, z: dy / M }; };
  joy.addEventListener('pointerdown', e => { jid = e.pointerId; joy.setPointerCapture(jid); jm(e); joy.classList.add('on'); e.preventDefault(); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === jid) jm(e); });
  const up = e => { if (e.pointerId === jid) { jid = null; jv = { x: 0, z: 0 }; knob.style.transform = ''; joy.classList.remove('on'); } };
  joy.addEventListener('pointerup', up); joy.addEventListener('pointercancel', up);
  // also: drag anywhere on the 3D view to steer (tablet-friendly)
  let did = null, start = null; const cv = host.querySelector('canvas');
  cv.addEventListener('pointerdown', e => { did = e.pointerId; start = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(did); });
  cv.addEventListener('pointermove', e => { if (e.pointerId !== did) return; let dx = e.clientX - start.x, dy = e.clientY - start.y; const L = Math.hypot(dx, dy); if (L < 6) { jv = { x: 0, z: 0 }; return; } const M = Math.max(L, 60); jv = { x: dx / M, z: dy / M }; });
  const up2 = e => { if (e.pointerId === did) { did = null; jv = { x: 0, z: 0 }; } }; cv.addEventListener('pointerup', up2); cv.addEventListener('pointercancel', up2);
  return { read() { let x = jv.x, z = jv.z; if (keys.arrowleft || keys.a) x -= 1; if (keys.arrowright || keys.d) x += 1; if (keys.arrowup || keys.w) z -= 1; if (keys.arrowdown || keys.s) z += 1; const L = Math.hypot(x, z); if (L > 1) { x /= L; z /= L; } return { x, z, m: L > .12 }; } };
}
function follow(cam, p, off, look, k = .08) { cam.position.lerp(new THREE.Vector3(p.x + off.x, p.y + off.y, p.z + off.z), k); cam.lookAt(p.x + look.x, p.y + look.y, p.z + look.z); }
function pop(host, text, color = '#ff8c7a') { const el = document.createElement('div'); el.className = 'pop3d'; el.textContent = text; el.style.color = color; host.appendChild(el); setTimeout(() => el.remove(), 1100); }
function pad(sc, x, y, z, color = 0xffd25a, r = .55) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .06, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .7 })); m.position.set(x, y + .04, z); sc.add(m); return m; }
function sunFollow(sun, p) { sun.position.set(p.x + 10, 18, p.z + 8); sun.target.position.copy(p); sun.target.updateMatrixWorld(); }
function cutBar(host, label) { const b = document.createElement('div'); b.className = 'cutbar'; b.innerHTML = `<i></i><span>${label}</span>`; host.appendChild(b); b.style.display = 'none'; return b; }

/* ---------- 생태통로: 걸어서 모으고 짓기 ---------- */
export function bridgeWalk(host, { onInv, onStage, onHit, onDone, sfx = () => { } } = {}) {
  const ctx = rig(host, { sky: ['#a8e2ff', '#effaff'], fov: 40, shadow: 22 }); const { sc, cam, sun } = ctx;
  const T = []; for (let x = -14; x <= 14; x++) for (let z = -10; z <= 10; z++) { if (Math.abs(z) <= 1) continue; T.push([x, -.5, z, 1, 1, 1, Math.abs(z) === 2 ? 0xd9d2c0 : ((x + z) % 2 ? P.grass : P.grass2)]); }
  for (let x = -14; x <= 14; x++) { T.push([x, -.6, 0, 1, .9, 3, P.road]); if (x % 2 === 0) T.push([x, -.13, 0, .55, .04, .12, 0xffffff]); } inst(sc, T);
  for (let i = 0; i < 34; i++) { const side = i % 2 ? 1 : -1; const t = tree(i % 3 === 0 ? 1 : 0, .8 + Math.random() * .35); t.position.set(-13 + Math.random() * 26, 0, side * (7.2 + Math.random() * 2.6)); sc.add(t); }
  for (let i = 0; i < 40; i++) { const f = flower([0xff8d9b, 0xffd25a, 0xffffff, 0xb9a6e8][i % 4]); f.position.set(-12 + Math.random() * 24, 0, (i % 2 ? 1 : -1) * (2.8 + Math.random() * 4)); sc.add(f); }
  const cars = [[0xff8c7a, 1, .75, 0, 6], [0x8fd6f0, 1, .75, 17, 6], [0xffd25a, -1, -.75, 8, 5.2], [0xb9a6e8, -1, -.75, 24, 5.2]].map(([c, d, z, off, v]) => { const m = car(c); m.position.set(-16 + off, 0, z); m.rotation.y = d > 0 ? 0 : Math.PI; m.userData = { d, v }; sc.add(m); return m; });
  const res = [];
  const mk = (kind, x, z) => { const g = new THREE.Group();
    if (kind === 'wood') { B(g, 0, .25, 0, 1.4, .45, .45, P.wood); B(g, .71, .25, 0, .04, .4, .4, 0xe7c08e); B(g, -.71, .25, 0, .04, .4, .4, 0xe7c08e); g.rotation.y = Math.random() * 3; }
    else if (kind === 'stone') g.add(rock(1)); else { B(g, 0, .2, 0, .9, .4, .9, P.dirt); B(g, 0, .45, 0, .9, .14, .9, P.grass); }
    g.position.set(x, 0, z); g.userData = { kind, pad: pad(sc, x, 0, z, 0xffd25a, .8) }; sc.add(g); res.push(g); };
  [[-6, 4], [-9, 5.6], [4.5, 5.5], [8, 3.6], [-3.5, 6]].forEach(p => mk('wood', ...p));
  [[-6, -4.5], [5, -5.6], [-9, -5.8], [8.5, -3.8]].forEach(p => mk('stone', ...p));
  [[-10.5, 3.3], [10.5, 4.6], [-2.2, -6], [2.6, -4.2], [11, -5.6]].forEach(p => mk('soil', ...p));
  const inv = { wood: 0, stone: 0, soil: 0 }, need = { wood: 10, stone: 8, soil: 10 };
  const pads = [];
  for (const z of [-2.2, 2.2]) for (const x of [-.6, .6]) pads.push({ x, z, st: 0, m: 'stone', blocks: [[x > 0 ? .5 : -.5, 0, z > 0 ? 2 : -2], [x > 0 ? .5 : -.5, 1, z > 0 ? 2 : -2]] });
  for (let z = -2; z <= 2; z++) pads.push({ x: 0, z, st: 1, m: 'wood', blocks: [[-.5, 2, z], [.5, 2, z]] });
  for (let z = -2; z <= 2; z++) pads.push({ x: 0, z, st: 2, m: 'soil', blocks: [[-.5, 3, z], [.5, 3, z]] });
  const colorOf = { stone: P.stone, wood: P.wood, soil: P.dirt };
  pads.forEach(p => { p.mesh = pad(sc, p.x, 0, p.z, 0x8fd16a, .45); p.mesh.visible = false; p.ghosts = p.blocks.map(([x, y, z]) => { const gm = new THREE.Mesh(rbox(.98, .98, .98), new THREE.MeshStandardMaterial({ color: colorOf[p.m], transparent: true, opacity: .32, depthWrite: false })); gm.position.set(x, y, z); gm.visible = false; sc.add(gm); return gm; }); });
  let stage = -1; const names = ['1단계: 돌 기둥 세우기', '2단계: 통나무로 다리 바닥 깔기', '3단계: 흙 덮어 숲길 만들기'];
  const setStage = n => { stage = n; pads.forEach(p => { const on = p.st === n && !p.done; p.mesh.visible = on; p.ghosts.forEach(g => g.visible = on); }); onStage && onStage(n, n < 3 ? names[n] : '완성!'); };
  const placed = [];
  const me = avatar(); me.position.set(0, 0, 5.2); sc.add(me); const ctl = controls(host);
  const animals = ['deer', 'raccoon', 'boar', 'badger', 'squirrel'].map((k, i) => { const a = animal(k); a.position.set(-8 + i * 1.3, 0, 4.2 + (i % 2) * .6); a.rotation.y = -Math.PI / 2; a.userData.ph = Math.random() * 6; a.userData.delay = i * .7; sc.add(a); return a; });
  const deco = new THREE.Group(); sc.add(deco); deco.visible = false;
  for (const sg of [1, -1]) for (let k = 0; k < 3; k++) for (const x of [-.5, .5]) B(deco, x, k, sg * (3 + (2 - k)), 1, 1, 1, k === 2 ? P.grass : P.dirt);
  for (const [x, z] of [[-.6, -1.6], [.6, 1.4]]) { const t = tree(0, .45); t.position.set(x, 3.5, z); deco.add(t); }
  for (let i = 0; i < 8; i++) { const f = flower([0xff8d9b, 0xffd25a, 0xffffff][i % 3]); f.position.set(-.8 + Math.random() * 1.6, 3.5, -2.3 + Math.random() * 4.6); deco.add(f); }
  const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 6), new THREE.Vector3(0, 0, 5.5), new THREE.Vector3(0, 1.5, 4.2), new THREE.Vector3(0, 3.5, 2.6), new THREE.Vector3(0, 3.5, -2.6), new THREE.Vector3(0, 1.5, -4.2), new THREE.Vector3(0, 0, -5.5), new THREE.Vector3(0, 0, -6.5)]);
  const carry = new THREE.Group(); me.userData.pack.add(carry);
  const refresh = () => { carry.clear(); let i = 0; ['wood', 'stone', 'soil'].forEach(k => { for (let n = 0; n < Math.min(3, Math.ceil(inv[k] / 2)); n++) { B(carry, 0, .32 + i * .2, -.02, .34, .18, .2, k === 'wood' ? P.wood : k === 'stone' ? P.stone : P.grass); i++; } }); };
  let hit = 0, busy = 0, doneT = -1, crossed = 0;
  onInv && onInv(inv, need);
  run(host, ctx, (dt, t) => {
    cars.forEach(c => { c.position.x += c.userData.d * c.userData.v * dt; if (c.position.x > 17) c.position.x = -17; if (c.position.x < -17) c.position.x = 17; c.position.y = Math.abs(Math.sin(t * 14 + c.position.x)) * .03; });
    const inp = ctl.read();
    if (hit <= 0 && busy <= 0 && doneT < 0) { me.position.x = Math.max(-13, Math.min(13, me.position.x + inp.x * 4.3 * dt)); me.position.z = Math.max(-9, Math.min(9, me.position.z + inp.z * 4.3 * dt)); if (inp.m) me.rotation.y = Math.atan2(inp.x, inp.z); }
    animAv(me, t, inp.m && hit <= 0 && busy <= 0 && doneT < 0);
    hit = Math.max(0, hit - dt); busy = Math.max(0, busy - dt);
    if (hit <= 0 && Math.abs(me.position.z) < 1.5) cars.forEach(c => { if (hit <= 0 && Math.abs(c.position.x - me.position.x) < 1.3 && Math.abs(c.position.z - me.position.z) < .8) { hit = 1.2; sfx('beep', .6); sfx('ouch'); pop(host, '빵빵! 차 조심!'); onHit && onHit(); me.position.z = me.position.z > 0 ? 2.7 : -2.7; } });
    me.rotation.z = hit > 0 ? Math.sin(t * 40) * .3 * (hit / 1.2) : 0;
    res.forEach(r => { const u = r.userData; if (u.got) return; r.position.y = Math.abs(Math.sin(t * 2.4 + r.position.x)) * .08; u.pad.material.opacity = .4 + Math.sin(t * 4 + r.position.x) * .3;
      if (Math.hypot(r.position.x - me.position.x, r.position.z - me.position.z) < 1.05) { u.got = true; r.visible = false; u.pad.visible = false; inv[u.kind] = Math.min(need[u.kind], inv[u.kind] + 2); sfx('pickup'); pop(host, { wood: '통나무 +2', stone: '돌 +2', soil: '흙 +2' }[u.kind], '#4f9b52'); refresh(); onInv && onInv(inv, need); if (stage < 0) setStage(0); } });
    if (stage >= 0 && stage < 3) pads.forEach(p => { if (p.st !== stage || p.done) return; p.mesh.material.opacity = .45 + Math.sin(t * 5) * .3;
      if (busy <= 0 && Math.hypot(p.x - me.position.x, p.z - me.position.z) < .8) {
        if (inv[p.m] < 2) { if (!p.warn || t - p.warn > 2.5) { p.warn = t; pop(host, { wood: '통나무를 더 모아요!', stone: '돌을 더 모아요! (길 건너편)', soil: '흙을 더 모아요!' }[p.m], '#7d6a58'); } return; }
        inv[p.m] -= 2; p.done = true; busy = .5; p.mesh.visible = false; p.ghosts.forEach(g => g.visible = false); sfx('place'); setTimeout(() => sfx('place', .6), 200); pop(host, '뚝딱!', '#c9820a'); refresh(); onInv && onInv(inv, need);
        p.blocks.forEach(([x, y, z], j) => { const b = B(sc, x, y, z, .98, .98, .98, colorOf[p.m]); b.scale.setScalar(.01); placed.push({ b, t: -j * .15 }); if (p.m === 'soil') { const tp = B(sc, x, y + .42, z, .98, .16, .98, P.grass); tp.scale.setScalar(.01); placed.push({ b: tp, t: -j * .15 - .2 }); } });
        if (pads.filter(q => q.st === stage).every(q => q.done)) { if (stage < 2) setTimeout(() => { setStage(stage + 1); sfx('key'); }, 500); else { setStage(3); setTimeout(() => { deco.visible = true; deco.scale.set(1, .01, 1); doneT = 0; sfx('build_done'); me.position.set(2.4, 0, 5); me.rotation.y = Math.PI; }, 700); } }
      } });
    placed.forEach(o => { if (o.t < 1) { o.t += dt * 3.5; o.b.scale.setScalar(Math.max(.01, backOut(Math.max(0, Math.min(1, o.t))))); } });
    if (doneT >= 0) { doneT += dt; deco.scale.y = Math.max(.01, Math.min(1, backOut(Math.min(1, doneT / 1.2))));
      animals.forEach((a, i) => { const u = a.userData; if (doneT > 1.4 + u.delay && !u.go && !u.fin) { u.go = true; u.t = 0; }
        if (u.go) { u.t += dt / 5; const k = Math.min(1, u.t); const p = path.getPointAt(k), p2 = path.getPointAt(Math.min(1, k + .01)); a.position.set(p.x + (i - 2) * .32, p.y, p.z); a.lookAt(p2.x + (i - 2) * .32, p2.y, p2.z); a.rotateY(-Math.PI / 2); walkAnim(a, t);
          if (k >= 1) { u.go = false; u.fin = true; crossed++; sfx('hop', .5); if (crossed === animals.length) setTimeout(() => onDone && onDone(), 600); } }
        else if (u.fin) a.position.y = Math.abs(Math.sin(t * 6 + i)) * .3; });
      follow(cam, new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(11, 9, 11), new THREE.Vector3(0, 0, 0), .04);
    } else { animals.forEach(a => { idleAnim(a, t, a.userData.ph); a.rotation.y = -Math.PI / 2 + Math.sin(t + a.userData.ph) * .3; }); follow(cam, me.position, new THREE.Vector3(0, 10, 10), new THREE.Vector3(0, .5, -1.2)); }
    sunFollow(sun, me.position);
  });
}

/* ---------- 바닷가 대청소: 걸어서 줍기 ---------- */
export function beachWalk(host, { onPick, onTurtleFree, onAllDone, sfx = () => { } } = {}) {
  const ctx = rig(host, { sky: ['#9fdcff', '#eafaff'], fov: 40, shadow: 20 }); const { sc, cam, sun } = ctx;
  const sea = water(90); sea.position.set(0, -.42, -14); sc.add(sea);
  const ground = z => z < -3 ? -.35 : (z < 3 ? .05 : .55);
  const T = []; for (let x = -13; x <= 13; x++) for (let z = -6; z <= 9; z++) { const zz = z < -3 ? -.4 : (z < 3 ? 0 : .5); T.push([x, zz - .45, z, 1, 1, 1, z >= 3 ? ((x + z) % 2 ? P.grass : P.grass2) : ((x + z) % 2 ? P.sand : P.sand2)]); } inst(sc, T);
  for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1; const t = tree(i % 3 === 0 ? 2 : 0, .9); t.position.set(side * (11.5 + (i % 3) * .6), .55, 8.5 - Math.floor(i / 2) * 1.6); sc.add(t); }
  for (let i = 0; i < 7; i++) { const r = rock(.8 + Math.random() * .4); r.position.set(-10 + i * 3.4, .05, -2.4 + (i % 2) * 1.4); sc.add(r); }
  const types = {
    pet: g => { B(g, 0, .35, 0, .3, .7, .3, 0xbfe9ff, { transparent: true, opacity: .8 }); B(g, 0, .4, 0, .32, .22, .32, 0x4aa3e8); B(g, 0, .78, 0, .16, .1, .16, 0x2f7fd0); },
    can: g => { B(g, 0, .3, 0, .34, .55, .34, 0xd9dde3, { metalness: .4, roughness: .35 }); B(g, 0, .3, 0, .36, .22, .36, 0xff8c7a); },
    vinyl: g => { B(g, 0, .2, 0, .6, .35, .5, 0xffffff, { transparent: true, opacity: .75 }); B(g, -.15, .45, 0, .12, .2, .12, 0xffffff); B(g, .15, .45, 0, .12, .2, .12, 0xffffff); },
    mask: g => { B(g, 0, .08, 0, .6, .12, .38, 0xf4f8ff); B(g, .38, .08, 0, .16, .04, .3, 0xffffff); B(g, -.38, .08, 0, .16, .04, .3, 0xffffff); },
    straw: g => { const m = B(g, 0, .06, 0, .9, .08, .08, 0x7fc8ff); m.rotation.y = .6; },
    line: g => { for (let i = 0; i < 5; i++) { const m = B(g, Math.cos(i) * .2, .04, Math.sin(i * 1.3) * .2, .5, .04, .04, 0xbfe6f5); m.rotation.y = i; } },
    glass: g => { B(g, 0, .3, 0, .28, .55, .28, 0x8a5a2e, { transparent: true, opacity: .9, roughness: .2 }); B(g, 0, .65, 0, .12, .18, .12, 0x8a5a2e); },
    paper: g => { B(g, 0, .15, 0, .55, .3, .4, 0xd0a06a); },
    snack: g => { B(g, 0, .1, 0, .5, .14, .36, 0x7fd0ff); B(g, 0, .17, 0, .3, .04, .2, 0xffd25a); },
  };
  const order = ['pet', 'can', 'vinyl', 'mask', 'straw', 'line', 'glass', 'paper', 'snack', 'pet', 'can', 'vinyl'];
  const spots = [[-9, 1], [-6, -1.6], [-3, 2], [-1.5, -1.2], [3, 1.8], [5, -1.2], [7.5, 1], [9.5, -.6], [-7.5, 4.8], [6, 5.2], [-3, 6.6], [3, 7.2]];
  const items = spots.map(([x, z], i) => { const g = new THREE.Group(); types[order[i]](g); g.scale.setScalar(1.6); g.position.set(x, ground(z), z); g.rotation.y = Math.random() * 6; g.userData = { kind: order[i], y0: ground(z), pad: pad(sc, x, ground(z), z, 0xffd25a, .7) }; sc.add(g); return g; });
  const tur = animal('turtle'); tur.scale.setScalar(1.3); tur.position.set(.8, ground(-2.6), -2.6); tur.rotation.y = .9; sc.add(tur);
  const net = new THREE.Group(); for (let i = 0; i < 6; i++) { const a = B(net, 0, .45 + i * .14, 0, 2.0, .08, .08, 0xff9f5a); a.rotation.y = i * .55; const b2 = B(net, 0, .55 + i * .1, 0, .08, .08, 1.8, 0x6fb7d6); b2.rotation.y = i * .7 + .3; }
  net.position.copy(tur.position); net.scale.setScalar(1.3); sc.add(net); const ring = pad(sc, tur.position.x, tur.position.y, tur.position.z, 0xff8c7a, 1.8);
  const bar = cutBar(host, '그물 자르는 중…');
  const me = avatar(); me.position.set(0, .55, 6); sc.add(me); const ctl = controls(host);
  const bag = new THREE.Group(); me.userData.pack.add(bag);
  let picked = 0, freed = false, cut = 0, lastS = 0, fin = false; const total = items.length;
  run(host, ctx, (dt, t) => {
    sea.userData.tick(t);
    const inp = ctl.read();
    me.position.x = Math.max(-12, Math.min(12, me.position.x + inp.x * 4.4 * dt)); me.position.z = Math.max(-3.3, Math.min(8.6, me.position.z + inp.z * 4.4 * dt));
    me.position.y += (ground(me.position.z) - me.position.y) * .3; if (inp.m) me.rotation.y = Math.atan2(inp.x, inp.z); animAv(me, t, inp.m);
    items.forEach((g, i) => { const u = g.userData; if (u.got) return; g.position.y = u.y0 + Math.abs(Math.sin(t * 2 + i)) * .07; u.pad.material.opacity = .4 + Math.sin(t * 4 + i) * .3;
      if (Math.hypot(g.position.x - me.position.x, g.position.z - me.position.z) < 1.0) { u.got = true; g.visible = false; u.pad.visible = false; picked++; sfx('pickup'); pop(host, '쓰레기 +1', '#4f9b52'); B(bag, (Math.random() - .5) * .2, .3 + bag.children.length * .06, 0, .3, .08, .14, 0xdfeaf0); onPick && onPick(u.kind, picked, total); } });
    if (!freed) { tur.rotation.z = Math.sin(t * 9) * .06; tur.userData.head.rotation.y = Math.sin(t * 5) * .3; ring.material.opacity = .35 + Math.sin(t * 5) * .25;
      const near = Math.hypot(tur.position.x - me.position.x, tur.position.z - me.position.z) < 2.2; bar.style.display = near ? 'flex' : 'none';
      if (near) { cut += dt / 2.2; bar.firstChild.style.width = Math.min(100, cut * 100) + '%'; if (t - lastS > .35) { lastS = t; sfx('place', .45); } net.rotation.y += dt * 2; net.scale.setScalar(1.3 * (1 - cut * .4));
        if (cut >= 1) { freed = true; sc.remove(net); ring.visible = false; bar.style.display = 'none'; sfx('splash'); pop(host, '꼬북이 친구 구출!', '#27978a'); onTurtleFree && onTurtleFree(); } } }
    else { tur.position.z -= dt * 1.6; tur.position.y -= dt * .25; tur.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 8 + i) * .5); tur.rotation.z = 0; }
    if (!fin && picked === total && freed) { fin = true; setTimeout(() => { sfx('build_done'); onAllDone && onAllDone(); }, 700); }
    follow(cam, me.position, new THREE.Vector3(0, 9, 9), new THREE.Vector3(0, .3, -1.5)); sunFollow(sun, me.position);
  });
}

/* ---------- 산양 울타리: 걸어가서 열기 ---------- */
export function fenceWalk(host, { onCut, onFree, sfx = () => { } } = {}) {
  const ctx = rig(host, { sky: ['#cfe9ff', '#f3fbff'], fov: 40, shadow: 18 }); const { sc, cam, sun } = ctx;
  const T = []; for (let x = -12; x <= 12; x++) for (let z = -7; z <= 7; z++) { const h = x < -1 ? (x < -6 ? 2 : 1) : 0; for (let y = 0; y <= h; y++) T.push([x, y - .5, z, 1, 1, 1, y === h ? (x < 0 ? P.snow : ((x + z) % 2 ? P.grass : P.grass2)) : (x < 0 ? 0xe2e8ee : P.dirt)]); } inst(sc, T);
  for (let i = 0; i < 12; i++) { const t = tree(1, .8); const x = -11 + Math.random() * 4; t.position.set(x, x < -6 ? 2 : 1, -6 + Math.random() * 12); t.traverse(m => { if (m.isMesh && m.material.color.getHex() !== P.wood2) m.material = mat(0xeef5ff); }); sc.add(t); }
  for (let i = 0; i < 8; i++) { const t = tree(0, .8); t.position.set(7 + Math.random() * 4, 0, -6 + Math.random() * 12); sc.add(t); }
  for (let i = 0; i < 26; i++) { const f = flower([0xff8d9b, 0xffd25a, 0xffffff, 0xb9a6e8][i % 4]); f.position.set(1.5 + Math.random() * 9, 0, -6 + Math.random() * 12); sc.add(f); }
  const flakes = []; for (let i = 0; i < 80; i++) { const f = B(sc, -12 + Math.random() * 14, Math.random() * 10, -7 + Math.random() * 14, .08, .08, .08, 0xffffff); f.castShadow = false; flakes.push(f); }
  const panels = [];
  for (let i = 0; i < 3; i++) { const g = new THREE.Group(); B(g, 0, 1, -1.5, .14, 2, .14, 0x6a6a78); for (let k = 0; k < 6; k++) B(g, 0, .25 + k * .33, 0, .05, .05, 3, 0x7d7d8c); for (let k = 0; k < 9; k++) B(g, 0, 1, -1.35 + k * .34, .05, 1.8, .05, 0x7d7d8c);
    g.position.set(-.2, 0, -3 + i * 3); g.userData = { cut: false, f: 0, p: 0, pad: pad(sc, .9, 0, -3 + i * 3, 0xff8c7a, .65) }; sc.add(g); panels.push(g); }
  B(sc, -.2, 1, 4.5, .14, 2, .14, 0x6a6a78);
  const gor = animal('goral'); gor.position.set(-3.5, .5, 0); sc.add(gor);
  const me = avatar(); me.position.set(6, 0, 3); sc.add(me); const ctl = controls(host); const bar = cutBar(host, '울타리 여는 중…');
  let cut = 0, walk = -1, lastS = 0;
  run(host, ctx, (dt, t) => {
    flakes.forEach((f, i) => { f.position.y -= dt * (.6 + (i % 3) * .2); if (f.position.y < 0) f.position.y = 10; });
    const inp = ctl.read(); me.position.x = Math.max(.6, Math.min(11, me.position.x + inp.x * 4.2 * dt)); me.position.z = Math.max(-6.5, Math.min(6.5, me.position.z + inp.z * 4.2 * dt)); if (inp.m) me.rotation.y = Math.atan2(inp.x, inp.z); animAv(me, t, inp.m);
    let near = false;
    panels.forEach((p, i) => { const u = p.userData; if (u.cut) { if (u.f < 1) { u.f = Math.min(1, u.f + dt * 1.5); p.rotation.z = -ease(u.f) * 1.5; p.position.x = -.2 + ease(u.f) * 1.2; } return; }
      u.pad.material.opacity = .4 + Math.sin(t * 5 + i) * .3;
      if (Math.hypot(.9 - me.position.x, p.position.z - me.position.z) < 1.25) { near = true; u.p += dt / 1.4; bar.firstChild.style.width = Math.min(100, u.p * 100) + '%'; if (t - lastS > .3) { lastS = t; sfx('place', .45); }
        if (u.p >= 1) { u.cut = true; u.pad.visible = false; cut++; sfx('stamp'); pop(host, '울타리를 열었어요!', '#27978a'); onCut && onCut(cut); if (cut === 3) setTimeout(() => { walk = 0; sfx('hop'); }, 700); } } });
    bar.style.display = near ? 'flex' : 'none';
    if (walk >= 0) { walk += dt / 3.4; const k = Math.min(1, walk); const x = -3.5 + k * 9; gor.position.set(x, x < -1 ? .5 : Math.max(0, .5 - (x + 1) * .6), 0); walkAnim(gor, t); if (k >= 1 && !gor.userData.fin) { gor.userData.fin = true; onFree && onFree(); } } else idleAnim(gor, t);
    if (gor.userData.fin) gor.userData.body.rotation.z = Math.sin(t * 4) * .08 - .2;
    follow(cam, me.position, new THREE.Vector3(7, 8, 6), new THREE.Vector3(-3, .3, 0), .06); sunFollow(sun, me.position);
  });
}


/* ---------- 걸어서 고르기: 범용 발판 스테이지 ---------- */
// zones: [{ html, color }], onEnter(i) -> called when player stands on pad for a moment
export function zoneStage(host, { zones = [], onEnter, sfx = () => { }, theme = 'meadow' } = {}) {
  const ctx = rig(host, { sky: theme === 'cafe' ? ['#ffe9c9', '#fff7ea'] : ['#a8e2ff', '#effaff'], fov: 40, shadow: 16 }); const { sc, cam, sun } = ctx;
  const T = []; for (let x = -13; x <= 13; x++) for (let z = -11; z <= 6; z++) T.push([x, -.5, z, 1, 1, 1, theme === 'cafe' ? ((x + z) % 2 ? 0xe8c99a : 0xdcb987) : ((x + z) % 2 ? P.grass : P.grass2)]); inst(sc, T);
  if (theme === 'cafe') { for (let x = -6; x <= 6; x++) B(sc, x, .55, -9.5, 1, 1.1, 1, x % 2 ? 0xb5835a : 0x9a6b45); B(sc, 0, 1.2, -9.6, 13, .2, 1.1, 0xfff4dc); for (let i = 0; i < 4; i++) B(sc, -4.5 + i * 3, 1.5, -9.6, .7, .5, .5, [0xff8d9b, 0xffd25a, 0x8fd6f0, 0xb9a6e8][i]); }
  else { for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; const t = tree(i % 3 === 0 ? 1 : 0, .8 + Math.random() * .3); t.position.set(Math.cos(a) * 12, 0, -2.5 + Math.sin(a) * 9.5); sc.add(t); } }
  for (let i = 0; i < 26; i++) { const f = flower([0xff8d9b, 0xffd25a, 0xffffff, 0xb9a6e8][i % 4]); f.position.set(-9 + Math.random() * 18, 0, -9 + Math.random() * 14); sc.add(f); }
  const me = avatar(); const home = new THREE.Vector3(0, 0, 3.5); me.position.copy(home); me.rotation.y = Math.PI; sc.add(me); const ctl = controls(host);
  const pads = [], labels = [];
  const layer = document.createElement('div'); layer.className = 'zlayer'; host.appendChild(layer);
  const ring = cutBar(host, '여기로 정할까요?');
  let locked = false, hold = 0, cur = -1, leftPad = true;
  function layout(n) { if (n <= 4) { const sp = n <= 2 ? 6 : n === 3 ? 4.6 : 3.8; return Array.from({ length: n }, (_, i) => [(i - (n - 1) / 2) * sp, -3.2]); }
    return Array.from({ length: n }, (_, i) => [(i - (n - 1) / 2) * 3.4, -3.2]); }
  function set(zs) {
    pads.forEach(p => sc.remove(p)); pads.length = 0; layer.innerHTML = ''; labels.length = 0;
    const pos = layout(zs.length); layer.classList.toggle('many', zs.length > 4);
    zs.forEach((z, i) => { const g = new THREE.Group(); const c = z.color || [0x8fd6f0, 0xff9f8f, 0x9fdc8a, 0xc8b6f0, 0xffd25a, 0xd0c4b8][i % 6];
      const wdt = zs.length > 4 ? 2.2 : 2.6;
      B(g, 0, .1, 0, wdt, .25, wdt, c); B(g, 0, .25, 0, wdt - .4, .08, wdt - .4, 0xfffdf6, { transparent: true, opacity: .35 });
      if (z.bin) { B(g, 0, .75, -.75, 1.5, 1.1, .7, c); B(g, 0, 1.36, -.75, 1.62, .16, .82, c); B(g, 0, .9, -.38, .9, .5, .04, 0xfffdf6); }
      if (z.table) { B(g, 0, .7, -.75, 1.7, .14, .8, 0xb5835a); B(g, -.7, .35, -.75, .14, .7, .14, 0x9a6b45); B(g, .7, .35, -.75, .14, .7, .14, 0x9a6b45); B(g, -.3, .86, -.75, .3, .2, .3, 0x8fd6f0); B(g, .35, .82, -.75, .12, .12, .5, 0xd9dde3); }
      g.position.set(pos[i][0], 0, pos[i][1]); g.userData = { i, base: c }; sc.add(g); pads.push(g);
      const el = document.createElement('div'); el.className = 'zlabel'; el.innerHTML = z.html; layer.appendChild(el); labels.push(el); });
    me.position.copy(home); hold = 0; cur = -1; leftPad = true; locked = false;
  }
  set(zones);
  const v = new THREE.Vector3();
  run(host, ctx, (dt, t) => {
    const inp = ctl.read();
    me.position.x = Math.max(-11.5, Math.min(11.5, me.position.x + inp.x * 4.6 * dt)); me.position.z = Math.max(-9, Math.min(5.5, me.position.z + inp.z * 4.6 * dt));
    if (inp.m) me.rotation.y = Math.atan2(inp.x, inp.z); animAv(me, t, inp.m);
    let on = -1; pads.forEach((p, i) => { if (p.visible && Math.abs(p.position.x - me.position.x) < (pads.length > 4 ? 1.05 : 1.3) && Math.abs(p.position.z - me.position.z) < 1.3) on = i; p.position.y = i === on ? -.06 : Math.sin(t * 2 + i) * .03; });
    if (on < 0) { leftPad = true; hold = 0; cur = -1; ring.style.display = 'none'; }
    else if (!locked && leftPad) { if (on !== cur) { cur = on; hold = 0; sfx('click', .35); } hold += dt; ring.style.display = 'flex'; ring.firstChild.style.width = Math.min(100, hold / .9 * 100) + '%';
      if (hold >= .9) { leftPad = false; ring.style.display = 'none'; const i = on; onEnter && onEnter(i, api); } }
    const W = host.clientWidth, H = host.clientHeight;
    pads.forEach((p, i) => { v.set(p.position.x, pads.length > 4 ? 2.0 : 1.5, p.position.z - (pads.length > 4 ? .7 : .3)).project(cam); const el = labels[i]; if (!el) return; el.style.left = ((v.x + 1) / 2 * W) + 'px'; el.style.top = ((1 - v.y) / 2 * H) + 'px'; el.classList.toggle('hot', i === on); });
    const many = pads.length > 4; follow(cam, new THREE.Vector3(many ? me.position.x * .8 : me.position.x, 0, me.position.z), many ? new THREE.Vector3(0, 13, 13) : new THREE.Vector3(0, 9.5, 10.5), many ? new THREE.Vector3(0, .3, -3.2) : new THREE.Vector3(0, .5, -2.2), .07); sunFollow(sun, me.position);
  });
  const api = {
    set, lock(b) { locked = b; },
    home() { me.position.copy(home); me.rotation.y = Math.PI; leftPad = true; },
    flash(i, ok) { const p = pads[i]; if (!p) return; const m = p.children[0]; const c0 = m.material; m.material = mat(ok ? 0x6cc070 : 0xff7b6b); setTimeout(() => { m.material = c0; }, 700); },
    remove(i) { const p = pads[i]; if (p) { p.visible = false; labels[i].style.display = 'none'; } },
    label(i, html) { if (labels[i]) labels[i].innerHTML = html; },
  };
  return api;
}
