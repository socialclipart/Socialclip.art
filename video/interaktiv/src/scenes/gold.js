// Interaktiver Hook "Nur 1 % schafft das": 3D-Logo wechselt die Farbe – Gold nur 3 Bilder lang (0,1 s).
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { makeStage, blit } from './three_common.js';
import { prog, easeOut, easeOutBack, easeInOut, lerp, clamp, goldGrad, goldText, fitSize, rng, drawGrain, loadImage, SERIF, COND, GOLD } from '../lib.js';

export const T = { eins: .2, regel: 1.75, bereit: 4.75, count: [5.38, 5.92, 6.49], los: 7.2, und: 11.15, reveal: 12.35, komm: 12.45, dur: 14.0 };
// Farbfolge im Test (Start, Name, Farbe, Metall, Rauheit). Gold nur 9,42–9,52 s.
export const COLORS = [
  [T.los, 'silber', 0xc9ccd3, 1, .18], [7.68, 'bronze', 0xa8622e, 1, .3], [8.15, 'gelb', 0xf3d23a, 0, .45], [8.6, 'weiß', 0xf0eee8, .2, .3],
  [9.02, 'orange', 0xf08a1c, 1, .25], [9.42, 'GOLD', 0xffd77a, 1, .1], [9.52, 'grün', 0x2f9a5c, .8, .3], [9.95, 'kupfer', 0xc4703e, 1, .25],
  [10.42, 'silber', 0xc9ccd3, 1, .18], [11.0, 'grau', 0x6d6d70, .9, .4],
];
export const GOLD_WIN = [9.42, 9.52];

let st, logo, mat, sym, floor;
export async function init({ W, H, scale }) {
  st = makeStage({ W, H, scale, fov: 30 });
  const { THREE, scene } = st;
  sym = await loadImage('/assets/logo/socialclip-symbol-cream.svg');
  const svg = await (await fetch('/assets/logo/socialclip-symbol-cream.svg')).text();
  const data = new SVGLoader().parse(svg);
  mat = new THREE.MeshPhysicalMaterial({ color: 0xc9ccd3, metalness: 1, roughness: .2, clearcoat: .6 });
  const g = new THREE.Group();
  for (const p of data.paths) for (const shape of SVGLoader.createShapes(p)) {
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 26, bevelEnabled: true, bevelThickness: 6, bevelSize: 4, bevelSegments: 6, curveSegments: 48 });
    g.add(new THREE.Mesh(geo, mat));
  }
  // SVG-Koordinaten: y nach unten -> spiegeln, zentrieren, skalieren
  const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  g.children.forEach(m => m.geometry.translate(-c.x, -c.y, -c.z));
  g.scale.set(2.6 / sz.y, -2.6 / sz.y, 2.6 / sz.y);
  logo = new THREE.Group(); logo.add(g); scene.add(logo);
  // Boden mit Gitter für Tiefe
  const gridTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const x = cv.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.strokeStyle = 'rgba(212,166,64,.55)'; x.lineWidth = 3;
    for (let i = 0; i <= 512; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
    const tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(12, 12); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  })();
  floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.1; scene.add(floor);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 6); scene.add(key);
  const rim = new THREE.PointLight(0x88aaff, 18, 20); rim.position.set(-4, 2, -3); scene.add(rim);
  st.rim = rim;
}

function colorAt(t) {
  if (t < T.los) return [0x8f9196, .9, .35, 'grau'];
  if (t >= T.reveal) return [0xffd77a, 1, .1, 'GOLD'];
  let c = COLORS[0];
  for (const x of COLORS) if (t >= x[0]) c = x;
  return [c[2], c[3], c[4], c[1]];
}

function bigText(ctx, txt, x, y, size, { gold = false, font = SERIF, weight = 900, sp = 3, max = 960, glitch = 0 } = {}) {
  const fs = fitSize(ctx, txt, max, size, font, weight, sp);
  ctx.font = `${weight} ${fs}px ${font}`; ctx.letterSpacing = sp + 'px'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (glitch > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= .8;
    ctx.fillStyle = 'rgba(255,40,60,.8)'; ctx.fillText(txt, x - glitch, y);
    ctx.fillStyle = 'rgba(40,200,255,.8)'; ctx.fillText(txt, x + glitch, y); ctx.restore();
  }
  ctx.lineWidth = fs * .16; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(txt, x, y);
  if (gold) goldText(ctx, txt, x, y, fs, { font, weight, spacing: sp, glow: 1.2 });
  else { ctx.fillStyle = '#f6f1e6'; ctx.fillText(txt, x, y); }
}

function pauseIcon(ctx, x, y, s, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - 26 * s, y - 34 * s, 18 * s, 68 * s, 5 * s); ctx.roundRect(x + 8 * s, y - 34 * s, 18 * s, 68 * s, 5 * s); ctx.fill();
}

const R = rng(8);
const DUST = Array.from({ length: 60 }, () => ({ x: R() * 1080, y: R() * 1920, s: 1 + R() * 3, v: 10 + R() * 30 }));

export function draw(ctx, t, { W, H }) {
  const { r, scene, cam } = st;
  const test = t >= T.los && t < T.und;
  // Hintergrund
  const g = ctx.createRadialGradient(W / 2, H * .46, 40, W / 2, H * .5, H * .8);
  g.addColorStop(0, test ? '#1a1a22' : '#1c1408'); g.addColorStop(.55, '#08070a'); g.addColorStop(1, '#020203');
  ctx.fillStyle = g; ctx.fillRect(-80, -80, W + 160, H + 160);
  for (const d of DUST) { ctx.fillStyle = 'rgba(240,210,150,.25)'; ctx.beginPath(); ctx.arc(d.x, ((d.y - t * d.v) % H + H) % H, d.s, 0, 6.283); ctx.fill(); }

  // Kamera + Logo
  const beat = test ? Math.exp(-((t - T.los) % .5) * 7) : 0;
  const dist = lerp(13, 9.5, easeInOut(prog(t, 0, 4))) - beat * .3;
  const orb = Math.sin(t * .4) * .25;
  cam.position.set(Math.sin(orb) * dist, .9, Math.cos(orb) * dist); cam.lookAt(0, .2, 0);
  const [col, met, rough] = colorAt(t);
  mat.color.setHex(col); mat.metalness = met; mat.roughness = rough;
  // Gold bekommt mehr Glanz/Eigenleuchten, damit es eindeutig golden (nicht bronze) wirkt
  const isGold = col === 0xffd77a;
  mat.envMapIntensity = isGold ? 2.6 : 1.4; mat.emissive.setHex(isGold ? 0x5a3c08 : 0x000000);
  const pop = Math.max(...COLORS.map(([s0]) => (t >= s0 ? Math.exp(-(t - s0) * 14) : 0)));
  const entry = easeOutBack(prog(t, 0, .9), 1.3);
  logo.scale.setScalar(lerp(.2, 1, entry) * (1 + (test ? pop * .06 : 0)));
  logo.rotation.y = Math.sin(t * 1.1) * .55 + (t < .9 ? (1 - entry) * 3 : 0);
  logo.position.y = .25 + Math.sin(t * 1.6) * .08;
  floor.position.z = (t * 2) % 1.33;
  st.rim.color.setHex(test ? 0x8899ff : 0xffb060);
  r.render(scene, cam);
  blit(ctx, r, W, H);

  // --- Texte
  const e1 = prog(t, T.eins, T.eins + .2), o1 = 1 - prog(t, T.regel - .15, T.regel);
  if (e1 > 0 && o1 > 0) {
    ctx.save(); ctx.globalAlpha = clamp(e1 * 3) * o1; ctx.translate(W / 2, 300); const k = lerp(2, 1, easeOutBack(e1, 1.8)); ctx.scale(k, k);
    const gl = (Math.floor(t * 20) % 5 === 0) ? 10 : 3;
    bigText(ctx, 'NUR 1 %', 0, 0, 220, { gold: true, glitch: gl }); bigText(ctx, 'SCHAFFT DAS.', 0, 150, 120, { glitch: gl }); ctx.restore();
  }
  const e2 = prog(t, T.regel, T.regel + .25), o2 = 1 - prog(t, T.bereit - .1, T.bereit + .05);
  if (e2 > 0 && o2 > 0) {
    ctx.save(); ctx.globalAlpha = clamp(e2 * 3) * o2;
    ctx.translate(W / 2, 260);
    ctx.fillStyle = 'rgba(15,10,5,.85)'; ctx.beginPath(); ctx.roundRect(-470, -110, 940, 300, 40); ctx.fill();
    ctx.strokeStyle = goldGrad(ctx, -470, -110, 470, 190); ctx.lineWidth = 5; ctx.stroke();
    pauseIcon(ctx, -360, -20, 1.2, '#f6f1e6');
    ctx.font = `600 64px ${COND}`; ctx.letterSpacing = '3px'; ctx.textAlign = 'left'; ctx.fillStyle = '#f6f1e6'; ctx.fillText('PAUSIERE, SOBALD', -290, 0);
    ctx.fillText('DAS LOGO', -290, 80);
    goldText(ctx, 'GOLD', -290 + ctx.measureText('DAS LOGO ').width + 20, 82, 74, { font: COND, weight: 600, align: 'left', glow: 1.2, spacing: 3 });
    ctx.font = `600 64px ${COND}`; ctx.fillStyle = '#f6f1e6'; ctx.fillText('WIRD!', -290 + ctx.measureText('DAS LOGO ').width + 210, 80);
    ctx.restore();
  }
  // Countdown
  T.count.forEach((c, i) => {
    const k = prog(t, c, c + .5); if (k <= 0 || k >= 1) return;
    ctx.save(); ctx.globalAlpha = (1 - k) * clamp(k * 8); ctx.translate(W / 2, 250); const s = lerp(1.6, .9, easeOut(k)); ctx.scale(s, s);
    bigText(ctx, String(3 - i), 0, 90, 300, { gold: true }); ctx.restore();
  });
  const bk = prog(t, T.bereit, T.bereit + .2), bo = 1 - prog(t, T.count[0] - .1, T.count[0]);
  if (bk > 0 && bo > 0) { ctx.save(); ctx.globalAlpha = bk * bo; bigText(ctx, 'BEREIT?', W / 2, 360, 150, { gold: true }); ctx.restore(); }
  const lk = prog(t, T.los, T.los + .2), lo = 1 - prog(t, T.los + .45, T.los + .6);
  if (lk > 0 && lo > 0) { ctx.save(); ctx.globalAlpha = lo; ctx.translate(W / 2, 330); const s = lerp(2, 1, easeOutBack(lk, 2)); ctx.scale(s, s); bigText(ctx, 'LOS!', 0, 80, 260, { gold: true }); ctx.restore(); }
  // Während des Tests: Stoppuhr oben + Hinweis
  if (test) {
    ctx.save(); ctx.globalAlpha = clamp((t - T.los - .4) * 4);
    const sec = (t - T.los).toFixed(2).replace('.', ',');
    ctx.fillStyle = 'rgba(10,8,6,.8)'; ctx.beginPath(); ctx.roundRect(W / 2 - 230, 210, 460, 120, 60); ctx.fill();
    ctx.strokeStyle = 'rgba(212,166,64,.6)'; ctx.lineWidth = 4; ctx.stroke();
    pauseIcon(ctx, W / 2 - 150, 270, .8, GOLD.a);
    ctx.font = `600 76px ${COND}`; ctx.letterSpacing = '4px'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f6f1e6';
    ctx.fillText(sec + ' s', W / 2 - 90, 274);
    ctx.restore();
  }
  // Auflösung
  const uk = prog(t, T.und, T.und + .2);
  if (uk > 0) {
    ctx.save(); ctx.globalAlpha = clamp(uk * 3); ctx.translate(W / 2, 300); const s = lerp(1.8, 1, easeOutBack(uk, 1.8)); ctx.scale(s, s);
    bigText(ctx, 'UND?', 0, 0, 200, { gold: true }); bigText(ctx, 'HAST DU ES GESCHAFFT?', 0, 120, 90); ctx.restore();
  }
  const rk = prog(t, T.reveal, T.reveal + .3);
  if (rk > 0) {
    ctx.save(); ctx.globalAlpha = clamp(rk * 3);
    ctx.fillStyle = 'rgba(12,9,5,.88)'; ctx.beginPath(); ctx.roundRect(110, 1380, 860, 120, 30); ctx.fill();
    ctx.strokeStyle = 'rgba(212,166,64,.6)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = `600 46px ${COND}`; ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#d9cdb5';
    ctx.fillText('GOLD WAR NUR 0,1 SEK. DA – BEI 2,2 S', W / 2, 1442);
    ctx.restore();
  }
  const ck = prog(t, T.komm + .1, T.komm + .35);
  if (ck > 0) {
    const y = 1600, bob = Math.sin(t * 7) * 10;
    ctx.save(); ctx.globalAlpha = clamp(ck * 3); ctx.translate(W / 2, y); const k = lerp(1.5, 1, easeOutBack(ck, 2)); ctx.scale(k, k);
    ctx.fillStyle = goldGrad(ctx, -420, -70, 420, 70); ctx.beginPath(); ctx.roundRect(-420, -70, 840, 140, 70); ctx.fill();
    const cf = fitSize(ctx, 'SCHREIB „GOLD“ IN DIE KOMMENTARE', 740, 60, COND, 600, 4);
    ctx.fillStyle = '#1d1407'; ctx.font = `600 ${cf}px ${COND}`; ctx.letterSpacing = '4px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SCHREIB „GOLD“ IN DIE KOMMENTARE', 0, 4); ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp(ck * 3); ctx.fillStyle = GOLD.a; ctx.translate(W / 2, y + 120 + bob);
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.lineTo(0, 50); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // Marke
  ctx.save(); ctx.globalAlpha = .85 * clamp((t - .8) * 2); ctx.drawImage(sym, 60, 70, 40, 70);
  ctx.font = `600 30px ${COND}`; ctx.letterSpacing = '6px'; ctx.fillStyle = '#d9cdb5'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('SOCIALCLIP.ART', 115, 118); ctx.restore();
  // Ring-Blitz bei jedem Farbwechsel (gleich stark, damit Gold nicht auffällt)
  for (const [s0] of COLORS) {
    const k = prog(t, s0, s0 + .35); if (k <= 0 || k >= 1) continue;
    ctx.strokeStyle = `rgba(255,255,255,${(1 - k) * .5})`; ctx.lineWidth = 10 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(W / 2, 900, lerp(200, 800, easeOut(k)), 0, 6.283); ctx.stroke();
  }
  const flashes = [[T.los, .35], [T.und, .3], [T.reveal, .4]];
  for (const [s0, a] of flashes) { const k = prog(t, s0, s0 + .25); if (k > 0 && k < 1) { ctx.fillStyle = `rgba(255,236,190,${a * (1 - k) ** 2})`; ctx.fillRect(0, 0, W, H); } }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  drawGrain(ctx, t, W, H, .06);
  const fi = 1 - prog(t, 0, .15); if (fi > 0) { ctx.fillStyle = `rgba(0,0,0,${fi})`; ctx.fillRect(0, 0, W, H); }
}
