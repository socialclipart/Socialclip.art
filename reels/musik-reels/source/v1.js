// Video 1 — "Aus Word-Flyer wird Marke" (sound 1: 6 s build, drop at 5.927 s, kick every 0.46 s)
import {THREE, ctx, out, S, clamp, seg, lerp, eo3, eo5, eio, back, pulse, mulberry32, text, rr, finish, bloom, flash, sweep, rays, glint, handle,
  makeGL, canvasTex, blit, begin, shake, symbol, wordmark, BRAND} from './common.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const ON = [0.035, 0.186, 0.395, 0.615, 0.859, 1.103, 1.312, 1.556, 1.776, 2.241, 2.705, 2.937, 3.17, 3.39, 3.634, 4.087, 4.551, 4.783, 5.004, 5.236, 5.468];
const DROP = 5.927, KICK = [6.379, 6.85, 7.311, 7.772, 8.224, 8.695, 9.154, 9.615, 10.072, 10.533];
const B = {char: '#1B1714', wheat: '#E3B76B', cream: '#F4EDE1', rust: '#B4532A', ink: '#1B1714'};

// ---------- brand drawing ----------
function wheat(g, x, y, s, col, lw = 3) {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = g.fillStyle = col; g.lineWidth = lw / s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, .55); g.lineTo(0, -.42); g.stroke();
  for (let i = 0; i < 5; i++) { const yy = .2 - i * .15; for (const sd of [-1, 1]) { g.save(); g.translate(sd * .075, yy); g.rotate(sd * .55); g.beginPath(); g.ellipse(0, 0, .055, .12, 0, 0, 7); g.fill(); g.restore(); } }
  g.beginPath(); g.ellipse(0, -.55, .05, .11, 0, 0, 7); g.fill(); g.restore();
}
function badge(g, x, y, r, col, bg) {
  g.save(); if (bg) { g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  g.strokeStyle = col; g.lineWidth = r * .045; g.beginPath(); g.arc(x, y, r * .93, 0, 7); g.stroke();
  g.lineWidth = r * .015; g.beginPath(); g.arc(x, y, r * .82, 0, 7); g.stroke(); wheat(g, x, y - r * .02, r * .95, col, r * .03); g.restore();
}
function lockup(g, x, y, s, col, accent) { // badge + MÜLLER + BACKHAUS
  badge(g, x, y - 150 * s, 120 * s, accent);
  text(g, 'MÜLLER', x, y + 80 * s, {size: 128 * s, weight: 800, ls: 26 * s, color: col});
  text(g, 'BACKHAUS · SEIT 1962', x, y + 140 * s, {size: 30 * s, weight: 600, ls: 11 * s, color: accent});
}
function loaf(g, x, y, s, col) { g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.lineWidth = 3 / s; g.lineCap = 'round'; g.beginPath(); g.ellipse(0, .1, .5, .32, 0, Math.PI, 0); g.lineTo(-.5, .1); g.stroke(); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * .22 - .06, -.06); g.lineTo(i * .22 + .08, -.16); g.stroke(); } g.restore(); }
function coffee(g, x, y, s, col) { g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.lineWidth = 3 / s; g.lineCap = 'round'; g.beginPath(); g.moveTo(-.32, -.15); g.lineTo(-.26, .35); g.lineTo(.26, .35); g.lineTo(.32, -.15); g.closePath(); g.stroke(); g.beginPath(); g.arc(.38, .05, .12, -1.4, 1.4); g.stroke(); for (const xx of [-.12, .05]) { g.beginPath(); g.moveTo(xx, -.28); g.bezierCurveTo(xx - .08, -.38, xx + .08, -.45, xx, -.55); g.stroke(); } g.restore(); }
function paperNoise(g, w, h, base, amt = 8, seed = 3) { g.fillStyle = base; g.fillRect(0, 0, w, h); const id = g.getImageData(0, 0, w, h), r = mulberry32(seed); for (let i = 0; i < id.data.length; i += 4) { const n = (r() - .5) * amt; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; } g.putImageData(id, 0, 0); }

// ---------- flyer layers (front = Word flyer, back = new design) ----------
const PX = 1100; // texture px per unit
const LAYERS = [
  {k: 'base', w: 1.0, h: 1.414, x: 0, y: 0,
    front: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#FFF6A8'); gr.addColorStop(1, '#ffffff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#2244ff'; g.lineWidth = 10; g.strokeRect(24, 24, w - 48, h - 48); g.lineWidth = 4; g.strokeRect(40, 40, w - 80, h - 80); for (const [x, y] of [[60, 60], [w - 60, 60], [60, h - 60], [w - 60, h - 60]]) text(g, '★', x, y + 22, {size: 64, color: '#ffcc00', stroke: '#e0301e', strokeW: 3}); },
    back: (g, w, h) => { paperNoise(g, w, h, B.cream, 7); g.strokeStyle = B.wheat; g.lineWidth = 3; g.strokeRect(46, 46, w - 92, h - 92); }},
  {k: 'title', w: .92, h: .3, x: 0, y: .5,
    front: (g, w, h) => { const str = 'Bäckerei Müller'; g.font = '700 150px Comic'; const total = g.measureText(str).width; let x = w / 2 - total / 2; const gr = g.createLinearGradient(80, 0, w - 80, 0); ['#ff0000', '#ff9900', '#ffee00', '#33cc33', '#0099ff', '#9933ff'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c));
      for (const ch of str) { const cw = g.measureText(ch).width, u = (x + cw / 2 - w / 2) / total, yy = h * .66 + 70 * u * u - 20, rot = u * .5; g.save(); g.translate(x + cw / 2, yy); g.rotate(rot); g.font = '700 150px Comic'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText(ch, 8, 8); g.lineWidth = 8; g.strokeStyle = '#1a1a80'; g.strokeText(ch, 0, 0); g.fillStyle = gr; g.setTransform(1, 0, 0, 1, 0, 0); g.translate(x + cw / 2, yy); g.rotate(rot); g.fillText(ch, 0, 0); g.restore(); x += cw; } },
    back: (g, w, h) => { text(g, 'MÜLLER', w / 2, h * .62, {size: 150, weight: 800, ls: 34, color: B.ink}); text(g, 'BACKHAUS · SEIT 1962', w / 2, h * .9, {size: 34, weight: 600, ls: 13, color: '#9a7434'}); }},
  {k: 'star', w: .36, h: .36, x: .31, y: .19,
    front: (g, w, h) => { g.save(); g.translate(w / 2, h / 2); g.beginPath(); for (let i = 0; i < 32; i++) { const r = i % 2 ? w * .34 : w * .48, a = i / 32 * 6.283; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = '#ffee00'; g.fill(); g.lineWidth = 10; g.strokeStyle = '#e0301e'; g.stroke(); g.restore(); text(g, 'NEU!!!', w / 2, h / 2 + 30, {font: 'Comic', size: 100, color: '#e0301e', rot: -.2}); },
    back: (g, w, h) => { g.fillStyle = B.rust; g.beginPath(); g.arc(w / 2, h / 2, w * .42, 0, 7); g.fill(); text(g, 'NEU', w / 2, h / 2 - 12, {size: 60, weight: 800, ls: 10, color: B.cream}); text(g, 'Dinkel-Laib', w / 2, h / 2 + 52, {font: 'Bodoni', style: 'italic', size: 52, weight: 500, color: B.cream}); }},
  {k: 'icons', w: .84, h: .2, x: -.05, y: .14,
    front: (g, w, h) => { ['🥐', '🥖', '🍰', '🥨'].forEach((e, i) => text(g, e, w * (.14 + i * .24), h * .78, {size: 150, rot: (i % 2 ? .15 : -.12)})); },
    back: (g, w, h) => { wheat(g, w * .25, h * .5, 150, B.ink, 4); loaf(g, w * .5, h * .55, 170, B.ink); coffee(g, w * .75, h * .58, 150, B.ink); }},
  {k: 'body', w: .88, h: .4, x: 0, y: -.2,
    front: (g, w, h) => { text(g, 'Frische Brötchen jeden Tag!!!', w / 2, 110, {font: 'Comic', size: 70, color: '#e0301e'}); text(g, 'Mo - Sa von 6:00 - 18:00 Uhr', w / 2, 240, {font: 'Comic', size: 58, color: '#0033cc'}); g.fillStyle = '#0033cc'; g.fillRect(w * .14, 256, w * .72, 5); text(g, 'Tel.: 0123 / 456789', w / 2, 360, {font: 'Comic', size: 58, color: '#119911'}); },
    back: (g, w, h) => { text(g, 'Frisch aus dem Ofen.', w / 2, 170, {font: 'Bodoni', style: 'italic', size: 104, weight: 500, color: B.ink}); text(g, 'JEDEN MORGEN AB 6 UHR', w / 2, 290, {size: 38, weight: 600, ls: 12, color: '#7d6a4f'}); }},
  {k: 'banner', w: 1.0, h: .16, x: 0, y: -.6,
    front: (g, w, h) => { g.fillStyle = '#b6f23a'; g.fillRect(0, 0, w, h); text(g, 'Wir freuen uns auf Sie :-)', w / 2, h * .68, {font: 'Comic', size: 74, color: '#8a1fd1'}); },
    back: (g, w, h) => { g.fillStyle = B.char; g.fillRect(0, 0, w, h); text(g, 'BACKSTRASSE 1 · ERLANGEN', w / 2, h * .62, {size: 40, weight: 600, ls: 14, color: B.cream}); }},
];
const {glc, renderer, env} = makeGL();
const scene = new THREE.Scene(); scene.environment = env;
const cam = new THREE.PerspectiveCamera(30, 1080 / 1920, .05, 100);
const flyer = new THREE.Group(); scene.add(flyer);
LAYERS.forEach((L, i) => {
  const tw = Math.round(L.w * PX), th = Math.round(L.h * PX);
  const g = new THREE.Group(); g.position.set(L.x, L.y, 0); flyer.add(g); L.g = g; L.i = i;
  const mk = (draw, rotY) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(L.w, L.h), new THREE.MeshStandardMaterial({map: canvasTex(tw, th, draw), transparent: i > 0, roughness: .75, envMapIntensity: .35, alphaTest: i > 0 ? .02 : 0})); m.rotation.y = rotY; m.castShadow = true; g.add(m); return m; };
  mk(L.front, 0); mk(L.back, Math.PI);
});
const amb = new THREE.HemisphereLight(0xffffff, 0x554433, 1.1); scene.add(amb);
const keyL = new THREE.DirectionalLight(0xfff4e6, 2.2); keyL.position.set(1.5, 2.5, 4); scene.add(keyL);

// ---------- product mockups ----------
const prod = new THREE.Group(); scene.add(prod);
const std = o => new THREE.MeshStandardMaterial({envMapIntensity: .6, ...o});
const labelTex = (w, h, draw) => canvasTex(w, h, draw);
const charM = std({color: 0x1b1714, roughness: .55});
const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({opacity: .28})); shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.receiveShadow = true; prod.add(shadowFloor);
const pk = new THREE.SpotLight(0xfff1dd, 60, 0, .5, .6, 2); pk.position.set(2, 5, 4); pk.castShadow = true; pk.shadow.mapSize.set(1024, 1024); pk.shadow.radius = 4; prod.add(pk, pk.target);
const rim = new THREE.SpotLight(0xffd9a0, 40, 0, .6, .8, 2); rim.position.set(-3, 3, -3); prod.add(rim, rim.target);
const P = {};
{ // cup
  const pts = []; for (let i = 0; i <= 20; i++) { const v = i / 20; pts.push(new THREE.Vector2(lerp(.3, .42, v), v * 1.15)); }
  const tex = labelTex(2048, 1024, (g, w, h) => { paperNoise(g, w, h, B.cream, 6); g.fillStyle = B.wheat; g.fillRect(0, h * .78, w, h * .1); for (const u of [0, .5, 1]) { g.save(); g.translate(w * u, h * .45); badge(g, 0, -70, 150, B.ink); text(g, 'MÜLLER', 0, 160, {size: 92, weight: 800, ls: 20, color: B.ink}); g.restore(); } });
  tex.wrapS = THREE.RepeatWrapping;
  const cup = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), std({map: tex, roughness: .6, side: THREE.DoubleSide})); cup.castShadow = true;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.445, .445, .08, 96), charM); lid.position.y = 1.18; lid.castShadow = true;
  const lid2 = new THREE.Mesh(new THREE.CylinderGeometry(.36, .43, .07, 96), charM); lid2.position.y = 1.25;
  P.cup = new THREE.Group(); P.cup.add(cup, lid, lid2);
}
{ // paper bag
  const kraft = labelTex(1024, 1300, (g, w, h) => { paperNoise(g, w, h, '#9c7444', 14, 5); badge(g, w / 2, h * .42, 190, B.ink); text(g, 'MÜLLER', w / 2, h * .7, {size: 130, weight: 800, ls: 26, color: B.ink}); text(g, 'BACKHAUS · SEIT 1962', w / 2, h * .76, {size: 34, weight: 600, ls: 12, color: B.ink}); });
  const kraftPlain = std({color: 0x9c7444, roughness: .85});
  const bag = new THREE.Mesh(new THREE.BoxGeometry(1, 1.3, .55), [kraftPlain, kraftPlain, kraftPlain, kraftPlain, std({map: kraft, roughness: .85}), kraftPlain]); bag.position.y = .65; bag.castShadow = true;
  const fold = new THREE.Mesh(new THREE.BoxGeometry(1.002, .18, .56), std({color: 0x87623a, roughness: .85})); fold.position.y = 1.21;
  P.bag = new THREE.Group(); P.bag.add(bag, fold);
}
{ // hanging shop sign
  const face = labelTex(1024, 1024, (g, w, h) => { g.translate(w / 2, h / 2); g.rotate(-Math.PI / 2); g.translate(-w / 2, -h / 2); g.fillStyle = B.char; g.fillRect(0, 0, w, h); badge(g, w / 2, h * .4, 230, B.wheat); text(g, 'MÜLLER', w / 2, h * .78, {size: 120, weight: 800, ls: 22, color: B.cream}); });
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .07, 96), [std({color: 0xb08a4a, metalness: .9, roughness: .3}), std({map: face, roughness: .5}), std({map: face, roughness: .5})]);
  disk.rotation.x = Math.PI / 2; disk.castShadow = true;
  const metal = std({color: 0x2a2724, metalness: .9, roughness: .35});
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, .06, .06), metal); arm.position.set(-.5, 1.0, 0);
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(.02, .26, .02), metal); c1.position.set(-.45, .87, 0);
  const c2 = c1.clone(); c2.position.x = .45;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.78, .025, 12, 120), std({color: 0xb08a4a, metalness: 1, roughness: .25}));
  P.sign = new THREE.Group(); P.sign.add(disk, arm, c1, c2, ring);
}
{ // business cards
  const f = labelTex(1700, 1000, (g, w, h) => { paperNoise(g, w, h, B.char, 6, 8); badge(g, w * .5, h * .38, 190, B.wheat); text(g, 'MÜLLER', w * .5, h * .78, {size: 120, weight: 800, ls: 24, color: B.cream}); });
  const b = labelTex(1700, 1000, (g, w, h) => { paperNoise(g, w, h, B.cream, 6, 9); text(g, 'Anna Müller', 130, 330, {font: 'Bodoni', style: 'italic', size: 120, weight: 500, color: B.ink, align: 'left'}); text(g, 'BÄCKERMEISTERIN', 135, 410, {size: 40, weight: 600, ls: 12, color: '#9a7434', align: 'left'}); text(g, 'Backstraße 1 · Erlangen', 135, 720, {size: 46, weight: 500, color: B.ink, align: 'left'}); text(g, 'mueller-backhaus.de', 135, 800, {size: 46, weight: 500, color: B.ink, align: 'left'}); wheat(g, w - 230, h / 2, 330, B.wheat, 6); });
  const edge = std({color: 0xeee6d8, roughness: .8});
  const card = (map) => new THREE.Mesh(new THREE.BoxGeometry(1.7, .012, 1.0), [edge, edge, std({map, roughness: .55}), edge, edge, edge]);
  const a = card(f), c = card(b); a.castShadow = c.castShadow = true;
  a.position.set(-.25, .2, -.1); a.rotation.set(.0, .35, .25); c.position.set(.3, .02, .35); c.rotation.set(0, -.2, 0);
  P.cards = new THREE.Group(); P.cards.add(a, c); P.cards.scale.setScalar(.85);
}
function phone(screen) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(.78, 1.62, .08, 6, .11), std({color: 0x161412, metalness: .6, roughness: .3})); body.castShadow = true;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.72, 1.56), new THREE.MeshBasicMaterial({map: screen, toneMapped: false})); scr.position.z = .042;
  g.add(body, scr); return g;
}
P.insta = phone(labelTex(720, 1560, (g, w, h) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); badge(g, 110, 210, 70, B.wheat, B.char);
  text(g, 'mueller.backhaus', 210, 170, {size: 34, weight: 700, color: '#111', align: 'left'}); text(g, '1.248 Beiträge   12,4 Tsd. Follower', 210, 220, {size: 22, weight: 500, color: '#555', align: 'left'});
  text(g, 'Frisch aus dem Ofen. Seit 1962.', 40, 340, {size: 26, weight: 500, color: '#222', align: 'left'});
  const cols = [B.char, B.wheat, B.cream, B.rust, B.cream, B.char, B.wheat, B.char, B.rust, B.cream, B.char, B.wheat];
  for (let i = 0; i < 12; i++) { const x = (i % 3) * 241, y = 400 + Math.floor(i / 3) * 241; g.fillStyle = cols[i]; g.fillRect(x, y, 238, 238); const ink = cols[i] === B.char || cols[i] === B.rust ? B.cream : B.ink;
    if (i % 4 === 0) badge(g, x + 119, y + 119, 70, ink); else if (i % 4 === 1) wheat(g, x + 119, y + 119, 120, ink, 4); else if (i % 4 === 2) text(g, 'NEU', x + 119, y + 135, {size: 46, weight: 800, ls: 6, color: ink}); else loaf(g, x + 119, y + 130, 130, ink); }
}));
P.web = phone(labelTex(720, 1560, (g, w, h) => {
  paperNoise(g, w, h, B.cream, 5); text(g, 'MÜLLER', w / 2, 120, {size: 46, weight: 800, ls: 12, color: B.ink}); g.fillStyle = B.ink; g.fillRect(40, 160, w - 80, 2);
  g.fillStyle = B.char; rr(g, 40, 200, w - 80, 620, 24); g.fill(); rays; badge(g, w / 2, 440, 150, B.wheat); text(g, 'Brot mit Haltung.', w / 2, 700, {font: 'Bodoni', style: 'italic', size: 64, weight: 500, color: B.cream});
  text(g, 'Frisch aus dem Ofen —', 50, 920, {font: 'Bodoni', style: 'italic', size: 52, weight: 500, color: B.ink, align: 'left'}); text(g, 'jeden Morgen ab 6 Uhr.', 50, 985, {font: 'Bodoni', style: 'italic', size: 52, weight: 500, color: B.ink, align: 'left'});
  g.fillStyle = B.rust; rr(g, 50, 1060, w - 100, 100, 50); g.fill(); text(g, 'Jetzt vorbestellen', w / 2, 1123, {size: 34, weight: 700, color: B.cream});
  for (let i = 0; i < 2; i++) { g.fillStyle = i ? B.wheat : B.char; rr(g, 50 + i * 320, 1220, 300, 260, 18); g.fill(); }
  wheat(g, 200, 1350, 150, B.wheat, 4); loaf(g, 520, 1360, 160, B.ink);
}));
{ // cake box
  const top = labelTex(1200, 1200, (g, w, h) => { paperNoise(g, w, h, B.cream, 6, 11); badge(g, w / 2, h * .42, 230, B.ink); text(g, 'MÜLLER', w / 2, h * .76, {size: 140, weight: 800, ls: 28, color: B.ink}); });
  const side = labelTex(1200, 500, (g, w, h) => { paperNoise(g, w, h, B.cream, 6, 12); g.fillStyle = B.rust; g.fillRect(0, h * .38, w, h * .24); text(g, 'BACKHAUS · SEIT 1962', w / 2, h * .54, {size: 44, weight: 700, ls: 14, color: B.cream}); });
  const sm = std({map: side, roughness: .7}), tm = std({map: top, roughness: .7});
  const bx = new THREE.Mesh(new THREE.BoxGeometry(1.3, .55, 1.3), [sm, sm, tm, sm, sm, sm]); bx.position.y = .275; bx.castShadow = true;
  P.box = new THREE.Group(); P.box.add(bx);
}
for (const k in P) { P[k].visible = false; prod.add(P[k]); }
const CUTS = [ // start, product, bg, label, cam [az, el, dist, targetY], spin
  {t: 6.379, p: 'cup', bg: B.wheat, label: 'BECHER', cam: [-12, 14, 3.6, .62], spin: .5},
  {t: 6.85, p: 'bag', bg: B.char, label: 'TÜTE', cam: [24, 12, 4.1, .7], spin: -.4, zf: 1.3, dy: .3},
  {t: 7.311, p: 'sign', bg: B.rust, label: 'LADENSCHILD', cam: [-14, 4, 5.4, .1], spin: .6},
  {t: 7.772, p: 'cards', bg: B.cream, label: 'VISITENKARTEN', cam: [10, 52, 3.4, 0], spin: .25},
  {t: 8.224, p: 'insta', bg: B.char, label: 'INSTAGRAM', cam: [-18, 6, 3.5, .1], spin: .35, zf: 1.4, dy: .3},
  {t: 8.695, p: 'web', bg: B.wheat, label: 'WEBSITE', cam: [20, 6, 3.5, .1], spin: -.35, zf: 1.4, dy: .3},
  {t: 9.154, p: 'box', bg: B.rust, label: 'VERPACKUNG', cam: [-30, 30, 3.9, .35], spin: .5, zf: 1.3, dy: .3},
];
const LOCK = 9.615;
function orbit(az, el, dist, ty) { const a = az * Math.PI / 180, e = el * Math.PI / 180; cam.position.set(Math.sin(a) * Math.cos(e) * dist, ty + Math.sin(e) * dist, Math.cos(a) * Math.cos(e) * dist); cam.lookAt(0, ty, 0); cam.updateProjectionMatrix(); }

// flour particles
const PART = []; { const r = mulberry32(21); for (let i = 0; i < 160; i++) { const a = r() * 6.283, v = 300 + r() * 1300; PART.push([Math.cos(a) * v, Math.sin(a) * v - 200, 2 + r() * 6, r()]); } }

export function frame(t) {
  if (t < DROP - .23) return build(t);
  if (t < DROP) { begin('#000'); return; }
  if (t < CUTS[0].t) return reveal(t);
  if (t < LOCK) return mockups(t);
  return endcard(t);
}

function build(t) {
  begin('#1a1816'); flyer.visible = true; prod.visible = false; amb.intensity = 1.1; keyL.intensity = 2.2;
  // blueprint grid
  const gA = seg(t, 1.312, 1.7) * (1 - seg(t, 4.551, 4.9));
  if (gA > 0) { ctx.save(); ctx.globalAlpha = gA * .5; ctx.strokeStyle = '#3d5a80'; ctx.lineWidth = 1.5; for (let x = 0; x <= 1080; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1920); ctx.stroke(); } for (let y = 0; y <= 1920; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke(); } ctx.restore(); }
  // layer motion
  const exHit = [0, 1.312, 1.556, 1.776, 2.007, 2.241], flHit = [4.087, 3.634, 3.39, 3.17, 2.937, 2.705];
  const col = eio(seg(t, 4.551, 4.9));
  LAYERS.forEach((L, i) => {
    const ex = i === 0 ? 0 : eo5(seg(t, exHit[i], exHit[i] + .3));
    L.g.position.z = i * .004 + (i * .22 + (i ? .05 : 0)) * ex * (1 - col);
    const f = seg(t, flHit[i], flHit[i] + .22); L.g.rotation.y = Math.PI * back(f, 1.2);
  });
  const o = eio(seg(t, 1.2, 2.7)), c = col;
  const zoomHits = [4.783, 5.004, 5.236, 5.468];
  let dist = lerp(3.98, 4.7, o); dist = lerp(dist, 3.98, c);
  zoomHits.forEach((h, k) => { dist -= .28 * eo5(seg(t, h, h + .12)); });
  const az = lerp(0, -42, o) * (1 - c), el = lerp(0, 16, o) * (1 - c);
  const sh = t > 4.55 ? .004 * (t - 4.55) * 6 : 0;
  orbit(az + Math.sin(t * 61) * sh * 60, el + Math.cos(t * 53) * sh * 60, dist, lerp(0, .18, seg(t, 4.783, 5.47)));
  renderer.render(scene, cam); blit(glc);
  // flicker on hits in the last stretch
  const fl = Math.max(...zoomHits.map(h => pulse(t, h, .12))) * .25;
  if (fl > 0) { ctx.fillStyle = `rgba(255,240,220,${fl})`; ctx.fillRect(0, 0, 1080, 1920); }
  // scanner
  const sc = seg(t, .06, 1.25);
  if (sc > 0 && sc < 1) { const y = lerp(300, 1620, eio(sc)); const gr = ctx.createLinearGradient(0, y - 140, 0, y); gr.addColorStop(0, 'rgba(255,40,40,0)'); gr.addColorStop(1, 'rgba(255,40,40,.22)'); ctx.fillStyle = gr; ctx.fillRect(60, y - 140, 960, 140); ctx.fillStyle = '#ff3b30'; ctx.fillRect(40, y - 2, 1000, 4); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,90,80,.5)'; ctx.fillRect(40, y - 8, 1000, 16); ctx.restore(); }
  // critique tags
  const tags = [[.395, 'Comic Sans?!', 300, 1060, -.08], [.615, 'WordArt von 1997', 690, 380, .06], [.859, '7 Farben', 250, 820, -.1], [1.103, '!!!!!!', 840, 640, .12]];
  for (const [t0, s, x, y, r] of tags) {
    const u = seg(t, t0, t0 + .16), gone = seg(t, 1.312, 1.45); if (u <= 0 || gone >= 1) continue;
    ctx.save(); ctx.translate(x, y - 300 * eo3(gone)); ctx.rotate(r + .3 * gone); const sc2 = back(u) * (1 - gone); ctx.scale(sc2, sc2);
    ctx.font = '800 46px Inter'; const w = ctx.measureText(s).width + 56; ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 20; rr(ctx, -w / 2, -42, w, 76, 38); ctx.fillStyle = '#ff3b30'; ctx.fill(); ctx.shadowColor = 'transparent';
    text(ctx, s, 0, 14, {size: 46, weight: 800, color: '#fff'}); ctx.restore();
  }
  // captions
  const cap = (s, a, b, sub) => { const u = seg(t, a, a + .18), v = 1 - seg(t, b - .12, b); if (u <= 0 || v <= 0) return; text(ctx, s, 540, 205 + 20 * (1 - eo3(u)), {size: 58, weight: 800, color: B.cream, alpha: u * v}); if (sub) text(ctx, sub, 540, 262, {size: 30, weight: 600, ls: 3, color: B.wheat, alpha: u * v}); };
  cap('„Mach unseren Flyer mal schöner.“', 0, 1.3, '— BÄCKEREI MÜLLER');
  cap('1 · Zerlegen', 1.312, 2.7); cap('2 · Neu gestalten', 2.705, 4.55); cap('3 · Zusammensetzen', 4.551, 5.7);
  // progress bar
  const pb = seg(t, 2.705, 5.68);
  if (t > 2.705) { const a = seg(t, 2.705, 2.9); rr(ctx, 140, 1730, 800, 14, 7); ctx.fillStyle = `rgba(244,237,225,${.18 * a})`; ctx.fill(); rr(ctx, 140, 1730, 800 * pb, 14, 7); ctx.fillStyle = B.wheat; ctx.globalAlpha = a; ctx.fill(); ctx.globalAlpha = 1;
    text(ctx, `Rebrand lädt … ${Math.floor(pb * 100)} %`, 540, 1705, {size: 30, weight: 600, ls: 1, color: B.cream, alpha: a}); }
  finish(t, .04, .5);
  handle(false, 1660, .5);
}

function brandBg(col1, col2) { const gr = ctx.createRadialGradient(540, 860, 50, 540, 960, 1300); gr.addColorStop(0, col1); gr.addColorStop(1, col2); ctx.fillStyle = gr; ctx.fillRect(0, 0, 1080, 1920); }
function reveal(t) {
  begin(B.char); brandBg('#3a2c1d', '#0e0b09');
  const u = seg(t, DROP, DROP + .35);
  rays(540, 820, t, '227,183,107', .2 * (1 - .4 * u), 22, .25);
  // flour burst
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const pt = t - DROP; for (const [vx, vy, s, r] of PART) { const x = 540 + vx * (1 - Math.exp(-pt * 3)) * .9, y = 860 + vy * (1 - Math.exp(-pt * 3)) * .9 + 300 * pt * pt; ctx.globalAlpha = .7 * (1 - seg(pt, .1, .45)) * (.4 + .6 * r); ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.translate(540, 960); const sc = lerp(1.35, 1, eo5(u)); ctx.scale(sc, sc); ctx.translate(-540, -960);
  lockup(ctx, 540, 1000, 1.3, B.cream, B.wheat); ctx.restore();
  text(ctx, 'NACHHER', 540, 300, {size: 30, weight: 700, ls: 14, color: B.wheat, alpha: seg(t, DROP + .05, DROP + .2)});
  bloom(out, .5, 8); flash(t, DROP, .3, '255,244,225', 1); finish(t, .04, .45); handle(false);
}

function mockups(t) {
  let ci = 0; for (let i = 0; i < CUTS.length; i++) if (t >= CUTS[i].t) ci = i;
  const C = CUTS[ci], next = CUTS[ci + 1]?.t ?? LOCK, u = seg(t, C.t, next);
  begin(C.bg); const dark = C.bg === B.char || C.bg === B.rust;
  brandBg(dark ? (C.bg === B.char ? '#3a2f25' : '#d06a3c') : '#fff6e2', dark ? (C.bg === B.char ? '#0d0b09' : '#6e2c14') : (C.bg === B.wheat ? '#b88a42' : '#d9cbb3'));
  flyer.visible = false; prod.visible = true; amb.intensity = .45; keyL.intensity = .9; for (const k in P) P[k].visible = k === C.p;
  const obj = P[C.p]; obj.rotation.y = (u - .5) * C.spin; obj.position.y = C.p === 'sign' ? .0 : 0;
  if (C.p === 'sign') obj.rotation.z = .06 * Math.sin(t * 5);
  shadowFloor.visible = C.p !== 'sign' && C.p !== 'insta' && C.p !== 'web';
  if (C.p === 'insta' || C.p === 'web') { obj.position.y = .1 + .03 * Math.sin(t * 3); obj.rotation.x = -.08; }
  const [az, el, dist, ty] = C.cam; const kick = eo5(seg(t, C.t, C.t + .16));
  const zf = C.zf || 1.16; orbit(az + 8 * (u - .5), el, dist * zf * lerp(1.12, 1, kick) - .15 * u, ty - (C.dy ?? .1));
  pk.target.position.set(0, ty, 0); rim.target.position.set(0, ty, 0); rim.intensity = 40 + 60 * pulse(t, C.t, .3);
  renderer.render(scene, cam); blit(glc);
  sweep(t, C.t + .02, .42, '255,246,228', .32, -.6);
  // label
  const la = seg(t, C.t + .03, C.t + .12);
  const n = String(ci + 1).padStart(2, '0');
  text(ctx, `${n} / 07`, 540, 1450, {size: 26, weight: 700, ls: 6, color: dark ? B.wheat : '#6d5531', alpha: la});
  text(ctx, C.label, 540, 1515, {size: 64, weight: 800, ls: 14, color: dark ? B.cream : B.ink, alpha: la, scale: lerp(1.1, 1, eo5(la))});
  lockupMini(dark);
  flash(t, C.t, .14, '255,250,240', .55); finish(t, .04, .35); handle(!dark);
}
function lockupMini(dark) { badge(ctx, 540, 250, 48, dark ? B.wheat : B.ink); text(ctx, 'MÜLLER', 540, 350, {size: 40, weight: 800, ls: 10, color: dark ? B.cream : B.ink}); }

function endcard(t) {
  begin('#121212'); brandBg('#24201b', '#0a0908');
  const u = seg(t, LOCK, LOCK + .25), p2 = pulse(t, 10.072, .25) + pulse(t, 10.533, .25);
  ctx.save(); ctx.translate(540, 960); ctx.scale(1 + .03 * p2, 1 + .03 * p2); ctx.translate(-540, -960);
  const a1 = seg(t, LOCK, LOCK + .12);
  text(ctx, 'Vorher: Word.', 540, 640, {font: 'Comic', size: 70, color: '#8f8a82', alpha: a1});
  ctx.fillStyle = `rgba(255,59,48,${a1})`; const tw = ctx.measureText ? (ctx.font = '700 70px Comic', ctx.measureText('Vorher: Word.').width) : 470; const sw = (tw + 30) * eo3(seg(t, LOCK + .1, LOCK + .3)); ctx.fillRect(540 - tw / 2 - 15, 618, sw, 7);
  const a2 = seg(t, LOCK + .18, LOCK + .32);
  text(ctx, 'Nachher: Marke.', 540, 820 + 30 * (1 - eo5(a2)), {size: 116, weight: 900, ls: -2, color: B.cream, alpha: a2});
  const a3 = seg(t, 10.072, 10.2);
  symbol(ctx, 540, 1120, 150 * lerp(.8, 1, eo5(a3)), BRAND.cream); ctx.globalAlpha = a3;
  wordmark(ctx, 540, 1290, 440, BRAND.cream, a3);
  text(ctx, 'BRANDING · FLYER · WEBDESIGN', 540, 1370, {size: 26, weight: 600, ls: 8, color: BRAND.sand, alpha: a3});
  ctx.restore();
  rays(540, 1120, t, '230,208,173', .07 * a3, 16, .2);
  flash(t, LOCK, .18, '255,250,240', .5); finish(t, .045, .45); handle(false);
}
