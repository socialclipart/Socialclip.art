// Video 3 — SocialClip showreel (sound 3: hit at 0.07, bass swell 1.5–5.5 s, groove from 6.455 s)
import {THREE, ctx, out, S, clamp, seg, lerp, eo3, eo5, ei3, eio, back, pulse, mulberry32, text, measure, rr, finish, bloom, flash, sweep, rays, glint, handle,
  makeGL, blit, begin, shake, symbol, wordmark, BRAND, SYM_PATHS} from './common.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';

const HITS = [0.07, 0.453, 0.906], SWELL = 1.516;
const SUB = [1.516, 1.791, 1.993, 2.224, 2.47, 2.701, 2.946, 3.163, 3.378, 3.61, 3.825, 4.086];
const G0 = 6.455, Q = 0.4627, E8 = Q / 2;
const SLOT = Q * 2, NS = 10, END = G0 + SLOT * NS; // 15.71
const C = {bg: '#121212', cream: '#f4f1ea', sand: '#e6d0ad', dim: '#86827b', accent: '#d9b26f'};

// ---------- 3D symbol ----------
const {glc, renderer, env} = makeGL();
const scene = new THREE.Scene(); scene.environment = env;
const cam = new THREE.PerspectiveCamera(32, 1080 / 1920, .05, 100);
const svg = `<svg xmlns="http://www.w3.org/2000/svg">${SYM_PATHS.map(d => `<path d="${d}"/>`).join('')}</svg>`;
const data = new SVGLoader().parse(svg);
const mat = new THREE.MeshPhysicalMaterial({color: 0xe6d0ad, metalness: 1, roughness: .22, clearcoat: .6, clearcoatRoughness: .2, envMapIntensity: 1.2});
const sideMat = new THREE.MeshPhysicalMaterial({color: 0x9c8460, metalness: 1, roughness: .35, envMapIntensity: 1});
const symG = new THREE.Group(); scene.add(symG);
for (const p of data.paths) for (const sh of SVGLoader.createShapes(p)) {
  const geo = new THREE.ExtrudeGeometry(sh, {depth: 26, bevelEnabled: true, bevelThickness: 4, bevelSize: 3, bevelSegments: 4, curveSegments: 48});
  const m = new THREE.Mesh(geo, [mat, sideMat]); symG.add(m);
}
{ const b = new THREE.Box3().setFromObject(symG), c = b.getCenter(new THREE.Vector3()), s = 1.7 / (b.max.y - b.min.y);
  symG.children.forEach(m => { m.geometry.translate(-c.x, -c.y, -c.z); }); symG.scale.set(s, -s, s); }
const key = new THREE.SpotLight(0xfff2dc, 0, 0, .45, .7, 2); key.position.set(2.5, 3, 4); scene.add(key, key.target);
const rimA = new THREE.SpotLight(0xe6c48a, 0, 0, .6, .8, 2); rimA.position.set(-3, 1.5, -2.5); scene.add(rimA, rimA.target);
const sweepL = new THREE.PointLight(0xffffff, 0, 0, 2); scene.add(sweepL);
scene.add(new THREE.AmbientLight(0xffffff, .05));

export function frame(t) {
  if (t < SWELL - .02) return opener(t);
  if (t < G0 - .15) return logoShot(t);
  if (t < G0) { begin(C.cream); return; }
  if (t < END) return slots(t);
  return endcard(t);
}

// ---------- 0–1.5: WIR / MACHEN / DESIGN. ----------
function opener(t) {
  begin(C.bg);
  const words = ['WIR', 'MACHEN', 'DESIGN.'];
  const p = HITS.map(h => pulse(t, h, .2)).reduce((a, b) => Math.max(a, b), 0);
  ctx.save(); shake(t, p * .8);
  words.forEach((w, i) => {
    const u = seg(t, HITS[i], HITS[i] + .12); if (u <= 0) return;
    const fit = Math.min(330, 980 / measure(ctx, w, {font: 'Anton', size: 100, weight: 400}) * 100);
    const y = 470 + i * 340, last = i === 2;
    text(ctx, w, 540, y + fit * .36, {font: 'Anton', size: fit, weight: 400, color: last ? C.sand : C.cream, scale: lerp(1.4, 1, eo5(u)), alpha: u});
  });
  ctx.restore();
  const out2 = seg(t, 1.25, SWELL); if (out2 > 0) { ctx.fillStyle = `rgba(0,0,0,${ei3(out2)})`; ctx.fillRect(0, 0, 1080, 1920); }
  HITS.forEach(h => flash(t, h, .16, '255,248,236', .55));
  finish(t, .05, .4); handle(false);
}

// ---------- 1.5–6.3: metal symbol in a light sweep ----------
function logoShot(t) {
  begin('#070707');
  const u = seg(t, SWELL, G0 - .15), dec = 1 - seg(t, 4.2, 5.4);
  const sub = SUB.map(h => pulse(t, h, .18)).reduce((a, b) => Math.max(a, b), 0);
  const bg = ctx.createRadialGradient(540, 900, 30, 540, 900, 1100); bg.addColorStop(0, `rgba(80,62,40,${.55 * dec + .1})`); bg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
  rays(540, 880, t, '230,208,173', (.06 + .05 * sub) * dec, 20, .15);
  const zoom = ei3(seg(t, 5.55, G0 - .15));
  symG.rotation.set(lerp(.15, -.05, u), lerp(-.9, .55, eio(u)) + zoom * 2.2, 0);
  cam.position.set(0, .1, lerp(5.6, 4.8, eio(u)) - zoom * 4.3); cam.lookAt(0, .05, 0); cam.updateProjectionMatrix();
  key.intensity = (40 + 30 * sub) * (.35 + .65 * dec); rimA.intensity = 70 * dec + 40 * sub; key.target.position.set(0, 0, 0); rimA.target.position.set(0, 0, 0);
  sweepL.position.set(lerp(-3, 3, eio(seg(t, 1.6, 4.6))), .8, 1.6); sweepL.intensity = 18 * Math.sin(seg(t, 1.6, 4.6) * Math.PI);
  renderer.render(scene, cam); blit(glc);
  bloom(out, .35 + .3 * sub, 8);
  const ta = seg(t, 2.4, 2.8) * (1 - seg(t, 5.2, 5.5));
  wordmark(ctx, 540, 1460, 520, BRAND.cream, ta);
  text(ctx, 'DESIGN & MARKETING AUS ERLANGEN', 540, 1545, {size: 28, weight: 600, ls: 9, color: C.sand, alpha: ta});
  glint(610, 690, 1.1, Math.sin(seg(t, 2.9, 3.6) * Math.PI) * dec);
  const wh = seg(t, 5.75, G0 - .15); if (wh > 0) { ctx.fillStyle = `rgba(244,241,234,${ei3(wh)})`; ctx.fillRect(0, 0, 1080, 1920); }
  finish(t, .05, .55); handle(false);
}

// ---------- 6.455–15.71: ten services on the groove ----------
const SERV = [
  {w: 'LOGOS', bg: C.cream, v: vLogos}, {w: 'FLYER', bg: C.bg, v: vFlyer}, {w: 'WEBSITES', bg: C.sand, v: vWeb},
  {w: 'REELS', bg: C.bg, v: vReels}, {w: 'SOCIAL MEDIA', bg: C.cream, v: vSocial}, {w: 'VISITENKARTEN', bg: C.bg, v: vCards},
  {w: 'SPEISEKARTEN', bg: C.sand, v: vMenu}, {w: 'KI-ASSISTENTEN', bg: C.bg, v: vAI}, {w: 'MARKETING', bg: C.cream, v: vMkt},
  {w: 'DEINE IDEE?', bg: C.bg, v: vIdea},
];
const inkOn = bg => bg === C.bg ? C.cream : C.bg;
function slots(t) {
  const k = Math.min(NS - 1, Math.floor((t - G0) / SLOT)), s0 = G0 + k * SLOT, lt = t - s0, it = SERV[k];
  begin(it.bg); const ink = inkOn(it.bg), acc = it.bg === C.bg ? C.sand : '#9b7a45';
  // slam the word in, push it up on beat 2
  const u = seg(lt, 0, .12), up = eo5(seg(lt, Q, Q + .18));
  const fit = Math.min(300, 980 / measure(ctx, it.w, {font: 'Anton', size: 100, weight: 400}) * 100);
  ctx.save(); shake(t, pulse(t, s0, .14) * .6);
  text(ctx, it.w, 540, lerp(1030, 560, up) + fit * .36, {font: 'Anton', size: fit, weight: 400, color: ink, scale: lerp(1.5, 1, eo5(u)) * lerp(1, .82, up)});
  ctx.restore();
  // counter + 16th ticks
  text(ctx, String(k + 1).padStart(2, '0') + ' / 10', 540, 300, {size: 30, weight: 700, ls: 8, color: acc});
  const n16 = Math.floor(lt / (E8 / 2)); for (let i = 0; i < 8; i++) { ctx.fillStyle = i <= n16 ? acc : (it.bg === C.bg ? '#333' : 'rgba(0,0,0,.12)'); ctx.fillRect(540 - 8 * 26 / 2 + i * 26, 330, 16, 6); }
  // the mini visual lives under the word once it moves up
  if (up > 0) { ctx.save(); ctx.globalAlpha = up; it.v(lt - Q, ink, acc, it.bg); ctx.restore(); }
  sweep(t, s0, .45, it.bg === C.bg ? '230,208,173' : '255,255,255', it.bg === C.bg ? .18 : .45, -.7);
  flash(t, s0, .1, '255,250,240', it.bg === C.bg ? .35 : .2);
  finish(t, .045, it.bg === C.bg ? .45 : .18); handle(it.bg !== C.bg);
}
const C8 = lt => Math.floor(Math.max(0, lt) / E8); // eighth counter inside the visual (starts on beat 2)
function vLogos(lt, ink, acc) {
  const n = C8(lt), f = eo5(seg(lt % E8, 0, .12)), cx = 540, cy = 1180, R = 190;
  const shapes = [0, 1, 2, 3];
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(n * .4 + f * .4); ctx.fillStyle = n % 2 ? acc : ink;
  const sh = shapes[n % 4]; ctx.beginPath();
  if (sh === 0) ctx.arc(0, 0, R * lerp(.85, 1, f), 0, 7); else if (sh === 1) ctx.roundRect(-R * .85, -R * .85, R * 1.7, R * 1.7, 40);
  else if (sh === 2) { ctx.moveTo(0, -R); ctx.lineTo(R * .95, R * .7); ctx.lineTo(-R * .95, R * .7); ctx.closePath(); } else { ctx.restore(); symbol(ctx, cx, cy, 380 * lerp(.8, 1, f), ink); return; }
  ctx.fill(); ctx.restore();
}
function vFlyer(lt, ink, acc) {
  const cols = [C.sand, '#e86a3a', C.cream];
  for (let i = 0; i < 3; i++) { const u = eo5(seg(lt, i * E8, i * E8 + .2)); if (u <= 0) continue;
    ctx.save(); ctx.translate(540 + (i - 1) * 120, lerp(2200, 1200, u)); ctx.rotate((i - 1) * .18 * (1 - .4 * u)); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40;
    ctx.fillStyle = cols[i]; ctx.fillRect(-180, -255, 360, 510); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(18,18,18,.85)'; ctx.fillRect(-140, -210, 280, 160);
    text(ctx, ['SALE', 'EVENT', 'OPENING'][i], 0, 60, {font: 'Anton', size: 80, color: C.bg}); ctx.fillStyle = 'rgba(18,18,18,.5)'; for (let j = 0; j < 3; j++) ctx.fillRect(-120, 110 + j * 34, 240 - j * 50, 12); ctx.restore(); }
}
function vWeb(lt, ink, acc) {
  const x = 140, y = 900, w = 800, h = 560, d = eo3(seg(lt, 0, .25));
  ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.setLineDash([2 * (w + h) * d, 9999]); rr(ctx, x, y, w, h, 24); ctx.stroke(); ctx.restore();
  ctx.fillStyle = ink; if (d > .5) { ctx.fillRect(x, y + 60, w, 4); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + 40 + i * 30, y + 30, 9, 0, 7); ctx.fill(); } }
  const blocks = [[x + 40, y + 100, w - 80, 200], [x + 40, y + 330, 340, 190], [x + 420, y + 330, 340, 90], [x + 420, y + 440, 200, 60]];
  blocks.forEach((b, i) => { const u = eo5(seg(lt, E8 * (i + 1), E8 * (i + 1) + .15)); if (u <= 0) return; ctx.fillStyle = i === 3 ? C.bg : (i === 0 ? ink : 'rgba(18,18,18,.25)'); rr(ctx, b[0], b[1], b[2] * u, b[3], 14); ctx.fill(); });
}
function vReels(lt, ink, acc) {
  const x = 540, y = 1230, pw = 330, ph = 600, p = pulse(lt, 0, .3) + pulse(lt, Q, .3);
  rr(ctx, x - pw / 2, y - ph / 2, pw, ph, 46); ctx.lineWidth = 7; ctx.strokeStyle = ink; ctx.stroke();
  ctx.save(); ctx.translate(x, y); ctx.scale(1 + .15 * p, 1 + .15 * p); ctx.fillStyle = acc; ctx.beginPath(); ctx.moveTo(-40, -55); ctx.lineTo(60, 0); ctx.lineTo(-40, 55); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(244,241,234,.2)'; ctx.fillRect(x - 130, y + 240, 260, 8); ctx.fillStyle = acc; ctx.fillRect(x - 130, y + 240, 260 * clamp(lt / (SLOT - Q)), 8);
  for (let i = 0; i < 5; i++) { const a = seg(lt, i * .09, i * .09 + .5); if (a <= 0 || a >= 1) continue; text(ctx, '❤', x + 200 + 30 * Math.sin(i * 2), y + 200 - 500 * a, {size: 54, color: '#ff4d6d', alpha: 1 - a}); }
}
function vSocial(lt, ink, acc) {
  const v = Math.floor(lerp(0, 12480, eo3(seg(lt, 0, .45))));
  text(ctx, '❤ ' + v.toLocaleString('de-DE'), 540, 1160, {size: 120, weight: 900, color: ink});
  ['Neue Follower: +248', 'Story geteilt', 'Kommentar: „Wow!“'].forEach((s, i) => { const u = back(seg(lt, E8 * i, E8 * i + .14)); if (u <= 0) return;
    ctx.save(); ctx.translate(540, 1300 + i * 110); ctx.scale(u, u); ctx.font = '600 38px Inter'; const w = ctx.measureText(s).width + 70; rr(ctx, -w / 2, -42, w, 76, 38); ctx.fillStyle = C.bg; ctx.fill(); text(ctx, s, 0, 13, {size: 38, weight: 600, color: C.cream}); ctx.restore(); });
}
function vCards(lt, ink, acc) {
  const n = C8(lt), f = seg(lt % E8, 0, .14), ang = (n + eio(f)) * Math.PI, cs = Math.cos(ang), front = cs >= 0;
  ctx.save(); ctx.translate(540, 1200); ctx.scale(Math.abs(cs) * .98 + .02, 1); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 50;
  rr(ctx, -340, -200, 680, 400, 22); ctx.fillStyle = front ? C.sand : C.cream; ctx.fill(); ctx.shadowColor = 'transparent';
  if (front) { symbol(ctx, 0, -40, 160, C.bg); text(ctx, 'SOCIALCLIP', 0, 130, {size: 40, weight: 800, ls: 10, color: C.bg}); }
  else { text(ctx, 'Max Mustermann', -280, -60, {font: 'Bodoni', style: 'italic', size: 60, weight: 500, color: C.bg, align: 'left'}); text(ctx, 'socialclip.art', -280, 60, {size: 36, weight: 600, color: C.bg, align: 'left'}); }
  ctx.restore();
}
function vMenu(lt, ink, acc) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40; rr(ctx, 200, 860, 680, 800, 18); ctx.fillStyle = C.cream; ctx.fill(); ctx.restore();
  text(ctx, 'Speisekarte', 540, 960, {font: 'Bodoni', style: 'italic', size: 70, weight: 500, color: C.bg});
  [['Pasta Limone', '12'], ['Tagliata', '24'], ['Tiramisù', '7'], ['Espresso', '2,5']].forEach(([a, b], i) => { const u = seg(lt, E8 * i, E8 * i + .12); if (u <= 0) return;
    text(ctx, a, 250, 1080 + i * 120, {size: 40, weight: 600, color: C.bg, align: 'left', alpha: u}); text(ctx, b, 830, 1080 + i * 120, {size: 40, weight: 700, color: C.bg, align: 'right', alpha: u});
    ctx.fillStyle = `rgba(18,18,18,${.25 * u})`; ctx.fillRect(250, 1100 + i * 120, 580, 2); });
}
function vAI(lt, ink, acc) {
  const s = 'Wie kann ich helfen?', n = Math.floor(clamp(lt / (E8 / 2) - 1, 0, s.length));
  rr(ctx, 120, 1060, 840, 170, 40); ctx.fillStyle = '#1f1f1f'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.sand; ctx.stroke();
  text(ctx, s.slice(0, Math.max(n, Math.floor(lt * 40))) + (Math.floor(lt * 8) % 2 ? '|' : ''), 170, 1165, {size: 54, weight: 600, color: C.cream, align: 'left'});
  for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(230,208,173,${.3 + .7 * Math.max(0, Math.sin(lt * 14 - i))})`; ctx.beginPath(); ctx.arc(180 + i * 40, 1320, 12, 0, 7); ctx.fill(); }
}
function vMkt(lt, ink, acc) {
  const hs = [.25, .4, .55, .8, 1];
  hs.forEach((h, i) => { const u = eo5(seg(lt, i * E8 * .5, i * E8 * .5 + .2)); ctx.fillStyle = i === 4 ? '#9b7a45' : ink; ctx.fillRect(230 + i * 130, 1560 - 520 * h * u, 90, 520 * h * u); });
  const a = eo3(seg(lt, .3, .45)); if (a > 0) { ctx.save(); ctx.strokeStyle = '#e8573a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(200, 1450); ctx.lineTo(lerp(200, 860, a), lerp(1450, 1000, a)); ctx.stroke(); ctx.restore(); }
}
function vIdea(lt, ink, acc) {
  const p = pulse(lt, 0, .3) + pulse(lt, E8, .3) * .6;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(540, 1150, 10, 540, 1150, 420); g.addColorStop(0, `rgba(255,220,150,${.5 + .3 * p})`); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 700, 1080, 900); ctx.restore();
  ctx.fillStyle = '#ffe3a3'; ctx.beginPath(); ctx.arc(540, 1130, 150 * (1 + .06 * p), 0, 7); ctx.fill();
  ctx.fillStyle = C.sand; rr(ctx, 480, 1280, 120, 110, 18); ctx.fill(); ctx.fillStyle = C.bg; for (let i = 0; i < 3; i++) ctx.fillRect(480, 1300 + i * 30, 120, 6);
  ctx.save(); ctx.strokeStyle = '#ffe3a3'; ctx.lineWidth = 8; ctx.lineCap = 'round'; for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8; ctx.beginPath(); ctx.moveTo(540 + Math.cos(a) * 200, 1130 + Math.sin(a) * 200); ctx.lineTo(540 + Math.cos(a) * (250 + 30 * p), 1130 + Math.sin(a) * (250 + 30 * p)); ctx.stroke(); } ctx.restore();
}

// ---------- 15.71–16.88: end card ----------
function endcard(t) {
  begin(C.bg); const u = seg(t, END, END + .2), p = pulse(t, END, .2) + pulse(t, END + Q, .2) + pulse(t, END + 2 * Q, .2);
  const bg = ctx.createRadialGradient(540, 820, 30, 540, 900, 1100); bg.addColorStop(0, 'rgba(90,70,45,.6)'); bg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
  rays(540, 800, t, '230,208,173', .08 + .05 * p, 20, .2);
  symbol(ctx, 540, 780, 300 * lerp(.7, 1, eo5(u)) * (1 + .03 * p), C.cream);
  text(ctx, 'Lass uns was', 540, 1130, {size: 96, weight: 900, ls: -2, color: C.cream, alpha: seg(t, END + .05, END + .2)});
  text(ctx, 'Geiles bauen.', 540, 1240, {size: 96, weight: 900, ls: -2, color: C.sand, alpha: seg(t, END + .2, END + .35)});
  wordmark(ctx, 540, 1420, 420, BRAND.cream, seg(t, END + .4, END + .6));
  text(ctx, 'socialclip.art', 540, 1500, {size: 34, weight: 600, ls: 2, color: C.dim, alpha: seg(t, END + .45, END + .65)});
  bloom(out, .25, 8); flash(t, END, .2, '255,248,236', .6); finish(t, .05, .5);
}
