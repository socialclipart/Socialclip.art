// Interaktiver Hook "Stopp das Video!": 3D-Spielautomat, jedes pausierte Bild zeigt ein anderes Ergebnis.
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeStage, goldMat, project, blit } from './three_common.js';
import { prog, easeOut, easeOutBack, easeInOut, lerp, clamp, goldGrad, goldText, fitSize, rng, drawGrain, loadImage, SERIF, COND, GOLD } from '../lib.js';

export const T = { stopp: .1, slam: .15, pause: .75, lever: 1.35, spin: 1.55, drop: 2.0, end: 10.0, stops: [10.0, 10.22, 10.44], was: 10.55, komm: 11.5, dur: 13.0 };
const FLIP = .1; // neues Ergebnis alle 3 Bilder (30 fps)

// Ergebnisse: [Text, Stufe] Stufe: 2 = Jackpot (gold), 1 = gut, 0 = nichts (grau)
const PRIZES = [
  ['10.000 FOLLOWER', 1], ['LEIDER NICHTS', 0], ['VIRAL GEHEN', 1], ['GRATIS-ANALYSE', 2], ['50 NEUE KUNDEN', 1],
  ['NOCHMAL VERSUCHEN', 0], ['DOPPELTE REICHWEITE', 1], ['JACKPOT: 1 MIO. VIEWS', 2], ['500 KOMMENTARE', 1], ['FAST GEWONNEN', 0],
  ['CHEF-MODUS AN', 1], ['100 % MEHR ANFRAGEN', 1], ['LEIDER NICHTS', 0], ['DEIN BESTES REEL', 1], ['EIN TAG URLAUB', 1], ['JACKPOT!', 2],
];
const SEQ = (() => { const r = rng(2024), s = []; let last = -1; for (let i = 0; i < 90; i++) { let k; do { k = Math.floor(r() * PRIZES.length); } while (k === last); s.push(k); last = k; } return s; })();

let st, M = {}, sym;
function canvasTex(THREE, w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx;
}

export async function init({ W, H, scale }) {
  st = makeStage({ W, H, scale, fov: 34 });
  const { THREE, scene } = st;
  sym = await loadImage('/assets/logo/socialclip-symbol-cream.svg');
  const machine = new THREE.Group(); scene.add(machine); M.machine = machine;
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x2a0508, metalness: .2, roughness: .35, clearcoat: 1, clearcoatRoughness: .15 });
  const gold = goldMat(THREE);
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.7, 3.5, 1.0, 6, .18), lacquer); machine.add(body);
  const cap = new THREE.Mesh(new RoundedBoxGeometry(2.95, .32, 1.15, 4, .1), gold); cap.position.y = 1.9; machine.add(cap);
  const base = new THREE.Mesh(new RoundedBoxGeometry(3.05, .5, 1.25, 4, .12), gold); base.position.y = -1.95; machine.add(base);
  // Schild oben
  const signTex = canvasTex(THREE, 1024, 300, (g, w, h) => {
    g.fillStyle = '#0b0705'; g.fillRect(0, 0, w, h);
    g.strokeStyle = goldGrad(g, 0, 0, w, h); g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20);
    g.drawImage(sym, 60, 40, 125, 220);
    g.font = '900 150px "PF", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = goldGrad(g, 0, 60, 0, 240);
    g.fillText('JACKPOT', w / 2 + 70, h / 2 + 10);
  });
  const sign = new THREE.Mesh(new RoundedBoxGeometry(2.5, .78, .35, 4, .08), [lacquer, lacquer, lacquer, lacquer, new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: .35, roughness: .4 }), lacquer]);
  sign.position.set(0, 2.45, .05); machine.add(sign);
  // Anzeige (Ergebnis wird als 2D-Overlay darauf projiziert)
  const disp = new THREE.Mesh(new RoundedBoxGeometry(2.3, .72, .08, 3, .05), new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: .1, clearcoat: 1 }));
  disp.position.set(0, 1.18, .52); machine.add(disp);
  M.dispAnchor = new THREE.Vector3(0, 1.18, .58);
  // Walzen
  const reelTex = canvasTex(THREE, 1536, 256, (g, w, h) => {
    g.fillStyle = '#f4ecd8'; g.fillRect(0, 0, w, h);
    const syms = ['7', '€', '★', '♥', 'S', '$'];
    syms.forEach((s, i) => {
      const cx = (i + .5) * w / syms.length;
      g.save(); g.translate(cx, h / 2); g.rotate(Math.PI / 2);
      if (s === 'S') g.drawImage(sym, -55, -95, 110, 190);
      else { g.font = `900 ${s === '7' ? 210 : 180}px "PF", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = s === '7' ? '#c41e1e' : s === '♥' ? '#d4285a' : '#a8761e'; g.fillText(s, 0, 8); }
      g.restore();
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(i * w / syms.length, 0, 4, h);
    });
  });
  reelTex.wrapS = THREE.RepeatWrapping;
  const reelGeo = new THREE.CylinderGeometry(.5, .5, .66, 48, 1, true); reelGeo.rotateZ(Math.PI / 2);
  M.reels = [-.75, 0, .75].map((x, i) => {
    const tx = reelTex.clone(); tx.needsUpdate = true; tx.offset.x = i * .37;
    const m = new THREE.Mesh(reelGeo, new THREE.MeshStandardMaterial({ map: tx, roughness: .5, side: THREE.DoubleSide }));
    m.position.set(x, .05, .2); machine.add(m); return m;
  });
  // Rahmen um die Walzen
  const fr = (w, h, x, y) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, .25, 2, .04), gold); b.position.set(x, y, .62); machine.add(b); };
  fr(2.42, .1, 0, .62); fr(2.42, .1, 0, -.52); fr(.1, 1.24, -1.16, .05); fr(.1, 1.24, 1.16, .05); fr(.06, 1.14, -.375, .05); fr(.06, 1.14, .375, .05);
  // Glas
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transmission: 0, transparent: true, opacity: .12, clearcoat: 1 }));
  glass.position.set(0, .05, .7); machine.add(glass);
  // Lichterkette
  M.bulbs = [];
  const bulbGeo = new THREE.SphereGeometry(.065, 16, 12);
  const ring = [];
  for (let i = 0; i < 9; i++) ring.push([-1.35 + i * 2.7 / 8, 1.72]);
  for (let i = 1; i < 8; i++) ring.push([1.35, 1.72 - i * 3.3 / 8]);
  for (let i = 0; i < 9; i++) ring.push([1.35 - i * 2.7 / 8, -1.6]);
  for (let i = 1; i < 8; i++) ring.push([-1.35, -1.6 + i * 3.3 / 8]);
  ring.forEach(([x, y]) => { const b = new THREE.Mesh(bulbGeo, new THREE.MeshStandardMaterial({ color: 0xfff1c0, emissive: 0xffc860, emissiveIntensity: .2 })); b.position.set(x, y, .52); machine.add(b); M.bulbs.push(b); });
  // Hebel
  const pivot = new THREE.Group(); pivot.position.set(1.55, .3, 0); machine.add(pivot); M.lever = pivot;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .3, 24), gold); hub.rotation.z = Math.PI / 2; hub.position.set(1.45, .3, 0); machine.add(hub);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.3, 16), new THREE.MeshPhysicalMaterial({ color: 0xdddddd, metalness: 1, roughness: .15 })); arm.position.y = .65; pivot.add(arm);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.18, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xd01818, roughness: .15, clearcoat: 1 })); knob.position.y = 1.32; pivot.add(knob);
  // Münzen
  const coinGeo = new THREE.CylinderGeometry(.22, .22, .04, 32); coinGeo.rotateX(Math.PI / 2);
  const R = rng(5);
  M.coins = Array.from({ length: 34 }, () => {
    const c = new THREE.Mesh(coinGeo, gold); scene.add(c);
    const side = R() < .5 ? -1 : 1;
    return { m: c, x: side * (1.8 + R() * 1.2), z: -2 + R() * 3, t0: T.drop + R() * 8, sp: 2.5 + R() * 2, rx: R() * 6, rs: 2 + R() * 6 };
  });
  // Licht
  const key = new THREE.SpotLight(0xffe0a0, 60, 30, .5, .6); key.position.set(3, 6, 8); scene.add(key); key.target = machine;
  const rim = new THREE.PointLight(0xff3b3b, 25, 20); rim.position.set(-4, 1, -2); scene.add(rim);
  M.key = key;
}

function bg(ctx, W, H, t) {
  const pulse = t > T.drop && t < T.end ? .5 + .5 * Math.cos((t - T.drop) * Math.PI * 4) : 0;
  const g = ctx.createRadialGradient(W / 2, H * .45, 50, W / 2, H * .5, H * .8);
  g.addColorStop(0, `rgb(${60 + pulse * 30},${20 + pulse * 10},10)`); g.addColorStop(.5, '#12070a'); g.addColorStop(1, '#030102');
  ctx.fillStyle = g; ctx.fillRect(-80, -80, W + 160, H + 160);
  // Lichtstrahlen
  ctx.save(); ctx.translate(W / 2, H * .45); ctx.rotate(t * .15);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.fillStyle = `rgba(255,200,110,${.035 + pulse * .03})`;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, -1600); ctx.lineTo(90, -1600); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function pauseIcon(ctx, x, y, s, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - 26 * s, y - 34 * s, 18 * s, 68 * s, 5 * s); ctx.roundRect(x + 8 * s, y - 34 * s, 18 * s, 68 * s, 5 * s); ctx.fill();
}

function bigText(ctx, txt, x, y, size, { gold = false, font = SERIF, weight = 900, sp = 3, max = 960 } = {}) {
  const fs = fitSize(ctx, txt, max, size, font, weight, sp);
  ctx.font = `${weight} ${fs}px ${font}`; ctx.letterSpacing = sp + 'px'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = fs * .16; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(txt, x, y);
  if (gold) goldText(ctx, txt, x, y, fs, { font, weight, spacing: sp, glow: 1.2 });
  else { ctx.fillStyle = '#f6f1e6'; ctx.fillText(txt, x, y); }
}

export function draw(ctx, t, { W, H }) {
  const { THREE, r, scene, cam } = st;
  bg(ctx, W, H, t);
  // Kamera: leichter Orbit + Pump auf dem Beat
  const beat = t > T.drop && t < T.end ? Math.exp(-((t - T.drop) % .5) * 8) : 0;
  const orbit = Math.sin(t * .5) * .35;
  const dist = lerp(15, 13.2, easeInOut(prog(t, 0, 2.2))) - beat * .25 + (t > T.end ? -.6 * easeInOut(prog(t, T.end, T.end + 1.2)) : 0);
  cam.position.set(Math.sin(orbit) * dist, .9 + Math.sin(t * .7) * .1, Math.cos(orbit) * dist); cam.lookAt(0, .75, 0);
  // Automat fällt herein
  const s = prog(t, 0, T.slam + .45);
  M.machine.position.y = lerp(7, 0, easeOutBack(s, 1.1));
  M.machine.rotation.y = Math.sin(t * .6) * .12 * clamp(t - .6);
  // Hebel
  const lv = prog(t, T.lever, T.lever + .25), back = prog(t, T.lever + .3, T.lever + .7);
  M.lever.rotation.x = lerp(0, -1.1, easeOut(lv)) * (1 - easeOutBack(back, 2));
  // Walzen
  M.reels.forEach((m, i) => {
    const t0 = T.spin + i * .08, stopT = T.stops[i], w = 22;
    const acc = tc => tc < .4 ? w * tc * tc / .8 : w * (tc - .2);
    let a = 0;
    if (t > t0) {
      a = acc(Math.min(t, stopT) - t0);
      if (t > stopT) { const k = prog(t, stopT, stopT + .45); a += w * .45 * (k - k * k / 2); }
    }
    m.rotation.x = -a - i;
  });
  // Lichter: Lauflicht, im Spin schneller
  const speed = t > T.drop && t < T.end ? 14 : 4;
  M.bulbs.forEach((b, i) => { const on = (Math.floor(t * speed) + i) % 4 === 0; b.material.emissiveIntensity = on ? 3.2 : .25; });
  // Münzen
  for (const c of M.coins) {
    const d = t - c.t0;
    if (d < 0 || t > T.end + 1.5) { c.m.visible = false; continue; }
    c.m.visible = true;
    c.m.position.set(c.x, 6 - d * c.sp - d * d * .6, c.z); c.m.rotation.set(c.rx + d * c.rs, d * c.rs * .7, 0);
  }
  r.render(scene, cam);
  blit(ctx, r, W, H);

  // --- 2D: Ergebnis auf der Anzeige
  const [dx, dy] = project(THREE, cam, M.dispAnchor.clone().applyMatrix4(M.machine.matrixWorld), W, H);
  if (t > T.spin) {
    let txt, tier;
    if (t < T.drop) { txt = '. . .'; tier = 0; }
    else if (t < T.end) [txt, tier] = PRIZES[SEQ[Math.floor((t - T.drop) / FLIP + 1e-6) % SEQ.length]];
    else { txt = '???'; tier = 2; }
    const col = tier === 2 ? null : tier === 1 ? '#f6f1e6' : '#8a8378';
    const fs = fitSize(ctx, txt, 490, 76, COND, 600, 3);
    ctx.save(); ctx.translate(dx, dy);
    const sc = t < T.end ? 1 + (1 - clamp(((t - T.drop) % FLIP) / FLIP * 3)) * .05 : 1 + Math.max(0, Math.sin(t * 8)) * .04;
    ctx.scale(sc, sc);
    ctx.font = `600 ${fs}px ${COND}`; ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (tier === 2) { ctx.shadowColor = 'rgba(255,200,90,.9)'; ctx.shadowBlur = 30; ctx.fillStyle = goldGrad(ctx, -200, -40, 200, 40); }
    else { ctx.shadowColor = tier ? 'rgba(255,255,255,.5)' : 'transparent'; ctx.shadowBlur = 18; ctx.fillStyle = col; }
    ctx.fillText(txt, 0, 4); ctx.restore();
  }

  // --- 2D: Texte
  const sk = prog(t, T.stopp, T.stopp + .18), sOut = 1 - prog(t, T.pause - .1, T.pause + .1);
  if (sk > 0 && sOut > 0) {
    ctx.save(); ctx.globalAlpha = clamp(sk * 3) * sOut; ctx.translate(W / 2, 330); const k = lerp(2.4, 1, easeOutBack(sk, 1.8)); ctx.scale(k, k);
    bigText(ctx, 'STOPP!', 0, 60, 230, { gold: true, sp: 8 }); ctx.restore();
  }
  // "DRÜCK AUF PAUSE." während der Ansage, danach Dauer-Banner im Spin
  if (t > T.pause - .05 && t < T.end + .1) {
    const k = easeOut(prog(t, T.pause - .05, T.pause + .25)), out = 1 - prog(t, T.end - .1, T.end + .1);
    const pump = 1 + (t > T.drop ? Math.exp(-((t - T.drop) % .5) * 8) * .07 : 0);
    ctx.save(); ctx.globalAlpha = k * out; ctx.translate(W / 2, 300); ctx.scale(pump, pump);
    const hot = t > T.drop && Math.floor((t - T.drop) * 4) % 2 === 0;
    ctx.fillStyle = hot ? 'rgba(214,40,40,.92)' : 'rgba(20,10,6,.85)'; ctx.beginPath(); ctx.roundRect(-430, -95, 860, 150, 75); ctx.fill();
    ctx.strokeStyle = goldGrad(ctx, -430, -95, 430, 55); ctx.lineWidth = 6; ctx.stroke();
    pauseIcon(ctx, -340, -20, 1.1, '#f6f1e6');
    ctx.font = `600 78px ${COND}`; ctx.letterSpacing = '4px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f6f1e6';
    ctx.fillText(t < T.drop ? 'DRÜCK AUF PAUSE!' : 'JETZT PAUSIEREN!', 40, -16);
    ctx.restore();
    if (t > T.pause + .9 && t < T.drop + .3) {
      const g2 = easeOut(prog(t, T.pause + .9, T.pause + 1.15));
      ctx.save(); ctx.globalAlpha = g2 * (1 - prog(t, T.drop, T.drop + .3)); bigText(ctx, 'GENAU JETZT.', W / 2, 1640, 120, { gold: true }); ctx.restore();
    }
  }
  // Ende: WAS HAST DU? + Kommentar-Aufforderung
  const wk = prog(t, T.was - .05, T.was + .2);
  if (wk > 0) {
    ctx.save(); ctx.globalAlpha = clamp(wk * 3); ctx.translate(W / 2, 300); const k = lerp(1.8, 1, easeOutBack(wk, 1.8)); ctx.scale(k, k);
    bigText(ctx, 'WAS HAST DU?', 0, 40, 150, { gold: true }); ctx.restore();
  }
  const ck = prog(t, T.komm - .05, T.komm + .25);
  if (ck > 0) {
    const y = 1590, bob = Math.sin(t * 7) * 10;
    ctx.save(); ctx.globalAlpha = clamp(ck * 3); ctx.translate(W / 2, y); const k = lerp(1.5, 1, easeOutBack(ck, 2)); ctx.scale(k, k);
    ctx.fillStyle = goldGrad(ctx, -420, -70, 420, 70); ctx.beginPath(); ctx.roundRect(-420, -70, 840, 140, 70); ctx.fill();
    const cf = fitSize(ctx, 'SCHREIB’S IN DIE KOMMENTARE', 740, 60, COND, 600, 4);
    ctx.fillStyle = '#1d1407'; ctx.font = `600 ${cf}px ${COND}`; ctx.letterSpacing = '4px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SCHREIB’S IN DIE KOMMENTARE', 0, 4);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp(ck * 3); ctx.fillStyle = GOLD.a; ctx.translate(W / 2, y + 120 + bob);
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.lineTo(0, 50); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // Marke klein oben links
  ctx.save(); ctx.globalAlpha = .85 * clamp((t - .8) * 2); ctx.drawImage(sym, 60, 70, 40, 70);
  ctx.font = `600 30px ${COND}`; ctx.letterSpacing = '6px'; ctx.fillStyle = '#d9cdb5'; ctx.textAlign = 'left'; ctx.fillText('SOCIALCLIP.ART', 115, 118); ctx.restore();

  // Blitze + Vignette + Korn
  const flashes = [[T.slam + .3, .5], [T.drop, .35], [T.end, .3]];
  for (const [s0, a] of flashes) { const k = prog(t, s0, s0 + .25); if (k > 0 && k < 1) { ctx.fillStyle = `rgba(255,236,190,${a * (1 - k) ** 2})`; ctx.fillRect(0, 0, W, H); } }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  drawGrain(ctx, t, W, H, .06);
  const fi = 1 - prog(t, 0, .12); if (fi > 0) { ctx.fillStyle = `rgba(0,0,0,${fi})`; ctx.fillRect(0, 0, W, H); }
}
