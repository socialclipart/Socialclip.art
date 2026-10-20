import { rng, prog, easeOut, easeOutBack, easeInOut, easeIn, lerp, clamp, goldGrad, goldText, SERIF, COND, GOLD, RED } from '../lib.js';

const CX = 540, CY = 650;
// Sichtbarkeit zwischen a und b mit weichen Kanten
const win = (t, a, b, fi = .3, fo = .25) => clamp(prog(t, a - .05, a - .05 + fi)) * (1 - prog(t, b - fo, b));
const pop = (t, a, d = .35, s = 1.7) => easeOutBack(prog(t, a, a + d), s);

function check(ctx, x, y, s, col = GOLD.a) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 10 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - 22 * s, y); ctx.lineTo(x - 6 * s, y + 16 * s); ctx.lineTo(x + 24 * s, y - 18 * s); ctx.stroke(); ctx.restore();
}
function redX(ctx, x, y, r, k) {
  ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = r * .16; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 12;
  const k1 = clamp(k * 2), k2 = clamp(k * 2 - 1);
  ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(lerp(x - r, x + r, k1), lerp(y - r, y + r, k1)); ctx.stroke();
  if (k2 > 0) { ctx.beginPath(); ctx.moveTo(x + r, y - r); ctx.lineTo(lerp(x + r, x - r, k2), lerp(y - r, y + r, k2)); ctx.stroke(); }
  ctx.restore();
}
function heart(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + 30 * s);
  ctx.bezierCurveTo(x - 70 * s, y - 15 * s, x - 38 * s, y - 70 * s, x, y - 34 * s);
  ctx.bezierCurveTo(x + 38 * s, y - 70 * s, x + 70 * s, y - 15 * s, x, y + 30 * s); ctx.closePath();
}
function card(ctx, x, y, w, h, r = 28, fill = 'rgba(28,23,17,.96)') {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, r); ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(212,166,64,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, r); ctx.stroke();
}
function label(ctx, txt, x, y, size = 40, col = GOLD.a, sp = 8) {
  ctx.font = `600 ${size}px ${COND}`; ctx.letterSpacing = sp + 'px'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = col; ctx.fillText(txt, x, y);
}
function glow(ctx, x, y, r, a) {
  const g = ctx.createRadialGradient(x, y, 10, x, y, r); g.addColorStop(0, `rgba(240,190,90,${a})`); g.addColorStop(1, 'rgba(240,190,90,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
}

// ---------- Regel 1: Bohrer -> Loch -> Bild -> Zuhause
function drill(ctx, t, s) {
  ctx.save(); ctx.scale(s, s);
  const vib = Math.sin(t * 90) * 2;
  ctx.translate(vib, 0);
  // Bohrer-Spitze (dreht: Streifen)
  ctx.fillStyle = '#9aa1a8'; ctx.fillRect(150, -16, 170, 32);
  ctx.fillStyle = '#5f666d';
  for (let i = 0; i < 7; i++) { const x = 150 + ((i * 26 + t * 400) % 170); ctx.fillRect(x, -16, 8, 32); }
  ctx.beginPath(); ctx.moveTo(320, -16); ctx.lineTo(350, 0); ctx.lineTo(320, 16); ctx.fill();
  // Futter
  ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.roundRect(100, -40, 60, 80, 10); ctx.fill();
  // Körper
  ctx.fillStyle = goldGrad(ctx, -200, -90, 120, 60); ctx.beginPath(); ctx.roundRect(-200, -80, 310, 140, 40); ctx.fill();
  ctx.fillStyle = '#1b1712'; ctx.beginPath(); ctx.roundRect(-150, 40, 120, 230, 30); ctx.fill();
  ctx.fillStyle = '#3a3128'; ctx.fillRect(-150, 200, 120, 50);
  ctx.fillStyle = '#c33'; ctx.beginPath(); ctx.roundRect(-40, 50, 26, 50, 8); ctx.fill();
  ctx.restore();
}
function wall(ctx, a) {
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(0, 340, 0, 960); g.addColorStop(0, '#d9cdb8'); g.addColorStop(1, '#a8987c');
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 50;
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(CX - 380, 330, 760, 640, 24); ctx.fill(); ctx.restore();
}
function painting(ctx, w, h, home) {
  const sky = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  sky.addColorStop(0, home > .5 ? '#20263f' : '#f0a65a'); sky.addColorStop(1, home > .5 ? '#3b2e3f' : '#7d3b4a');
  ctx.fillStyle = sky; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = '#2b1d22'; ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-w / 2, h * .1); ctx.lineTo(-w * .2, -h * .12); ctx.lineTo(w * .05, h * .12);
  ctx.lineTo(w * .28, -h * .05); ctx.lineTo(w / 2, h * .15); ctx.lineTo(w / 2, h / 2); ctx.fill();
  if (home > 0) {
    ctx.save(); ctx.globalAlpha *= home;
    ctx.fillStyle = '#141019'; ctx.beginPath(); ctx.moveTo(-70, h / 2 - 10); ctx.lineTo(-70, 0); ctx.lineTo(0, -60); ctx.lineTo(70, 0); ctx.lineTo(70, h / 2 - 10); ctx.fill();
    ctx.fillStyle = '#ffd47a'; ctx.shadowColor = 'rgba(255,210,120,.9)'; ctx.shadowBlur = 30;
    ctx.fillRect(-45, 20, 30, 30); ctx.fillRect(15, 20, 30, 30); ctx.fillRect(-14, 70, 28, h / 2 - 80);
    ctx.restore();
  }
}
function r1(ctx, t, TL) {
  const c = TL.cue, out = c('outro');
  const dA = c('drill'), xA = c('drillX'), hA = c('hole'), pA = c('picture'), oA = c('home');
  const dv = win(t, dA, hA);
  if (dv > 0) {
    ctx.save(); ctx.globalAlpha = dv * lerp(1, .45, prog(t, xA, xA + .3));
    const inK = easeOut(prog(t, dA, dA + .45)), drop = easeIn(prog(t, xA + .5, hA));
    ctx.translate(lerp(1300, CX - 40, inK), CY - 40 + drop * 300); ctx.rotate(-.08 + drop * .5);
    drill(ctx, t < xA ? t : xA, 1.15);
    ctx.restore();
    if (t > xA) {
      ctx.save(); ctx.globalAlpha = dv; redX(ctx, CX, CY, 230, prog(t, xA, xA + .3)); ctx.restore();
    }
  }
  const wv = win(t, hA, out);
  if (wv > 0) {
    ctx.save(); ctx.globalAlpha = wv;
    wall(ctx, 1);
    const hk = pop(t, hA, .3, 2.5);
    const hy = pA < Infinity && t > pA ? 470 : CY;
    ctx.fillStyle = '#1a120c'; ctx.beginPath(); ctx.arc(CX, hy, 34 * hk, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(40,28,18,.7)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + .3; ctx.beginPath(); ctx.moveTo(CX + Math.cos(a) * 36 * hk, hy + Math.sin(a) * 36 * hk); ctx.lineTo(CX + Math.cos(a) * 70 * hk, hy + Math.sin(a) * 70 * hk); ctx.stroke(); }
    if (t > pA) {
      const dk = easeOutBack(prog(t, pA, pA + .45), 1.4), sw = Math.sin((t - pA) * 5) * .12 * Math.exp(-(t - pA) * 1.6);
      const home = easeInOut(prog(t, oA, oA + .7));
      if (home > 0) glow(ctx, CX, 690, 520, .45 * home);
      ctx.save(); ctx.translate(CX, 470); ctx.rotate(sw); ctx.translate(0, lerp(-500, 0, dk));
      ctx.strokeStyle = '#3a2a16'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-150, 90); ctx.moveTo(0, 0); ctx.lineTo(150, 90); ctx.stroke();
      ctx.translate(0, 250);
      ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 16;
      ctx.fillStyle = goldGrad(ctx, -230, -170, 230, 170); ctx.fillRect(-230, -170, 460, 340); ctx.shadowColor = 'transparent';
      ctx.save(); ctx.beginPath(); ctx.rect(-195, -135, 390, 270); ctx.clip(); painting(ctx, 390, 270, home); ctx.restore();
      ctx.restore();
    }
    ctx.restore();
  }
}

// ---------- Regel 2: Stoppuhr -> langweiliges Video -> Wisch -> Haken
function watch(ctx, t, digits, red, hand) {
  ctx.save(); ctx.translate(CX, CY + 20);
  ctx.fillStyle = goldGrad(ctx, -40, -330, 40, -280); ctx.beginPath(); ctx.roundRect(-40, -330, 80, 50, 12); ctx.fill();
  ctx.shadowColor = red ? 'rgba(224,38,43,.7)' : 'rgba(243,190,80,.5)'; ctx.shadowBlur = 60;
  ctx.fillStyle = '#0f0c09'; ctx.beginPath(); ctx.arc(0, 0, 270, 0, 6.283); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = red ? RED : goldGrad(ctx, -270, -270, 270, 270); ctx.lineWidth = 22; ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * 6.283, r0 = i % 5 ? 232 : 214;
    ctx.strokeStyle = i % 5 ? 'rgba(212,166,64,.4)' : 'rgba(243,210,122,.9)'; ctx.lineWidth = i % 5 ? 3 : 6;
    ctx.beginPath(); ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); ctx.lineTo(Math.sin(a) * 250, -Math.cos(a) * 250); ctx.stroke();
  }
  ctx.strokeStyle = red ? RED : GOLD.hi; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(hand) * 200, -Math.cos(hand) * 200); ctx.stroke();
  const pulse = red ? 1 + Math.max(0, Math.sin(t * 9)) * .08 : 1;
  ctx.scale(pulse, pulse);
  ctx.font = `600 150px ${COND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '2px';
  ctx.fillStyle = red ? '#ff4a4a' : '#f6f1e6'; ctx.fillText(digits, 0, 80);
  ctx.restore();
}
function r2(ctx, t, TL) {
  const c = TL.cue, out = c('outro');
  const w10 = c('watch10'), w5 = c('watch5'), w2 = c('watch2'), bA = c('boring'), sA = c('swipe'), hA = c('hook');
  const wv = win(t, w10, bA);
  if (wv > 0) {
    const st = t < w5 ? 0 : t < w2 ? 1 : 2;
    const k = pop(t, [w10, w5, w2][st], .25, 2);
    ctx.save(); ctx.globalAlpha = wv;
    ctx.translate(CX, CY); ctx.scale(lerp(1.08, 1, k), lerp(1.08, 1, k)); ctx.translate(-CX, -CY);
    watch(ctx, t, ['0:10', '0:05', '0:02'][st], st === 2, [-2.1, -1.0, -.4][st] + (t - w10) * .3);
    ctx.restore();
  }
  // Langweiliges Video
  const pv = win(t, bA, sA + .5, .3, .05);
  if (pv > 0) {
    const fly = easeIn(prog(t, sA + .05, sA + .45));
    ctx.save(); ctx.globalAlpha = pv;
    ctx.translate(CX, CY - fly * 1300); ctx.rotate(fly * -.3);
    const k = easeOut(prog(t, bA, bA + .35)); ctx.translate(0, (1 - k) * 300);
    card(ctx, 0, 0, 440, 640, 44, '#1d1b19');
    ctx.fillStyle = '#3a3733'; ctx.fillRect(-190, -280, 380, 470);
    ctx.fillStyle = '#5b5650'; ctx.beginPath(); ctx.arc(0, -80, 70, 0, 6.283); ctx.fill(); ctx.fillRect(-110, 0, 220, 150);
    ctx.font = `400 30px ${COND}`; ctx.fillStyle = '#8f877b'; ctx.textAlign = 'center'; ctx.fillText('„Hallo, ich bin …“', 0, 245);
    ctx.fillStyle = '#4a4540'; ctx.fillRect(-190, 270, 380, 8); ctx.fillStyle = '#8f877b'; ctx.fillRect(-190, 270, 380 * clamp((t - bA) / 6), 8);
    // Zzz
    for (let i = 0; i < 3; i++) {
      const z = ((t - bA) * .8 + i / 3) % 1;
      ctx.save(); ctx.globalAlpha *= (1 - z) * clamp((t - bA) * 2); ctx.font = `600 ${40 + i * 14}px ${COND}`; ctx.fillStyle = '#9fb4c8';
      ctx.fillText('Z', 150 + z * 60 + i * 10, -250 - z * 120); ctx.restore();
    }
    ctx.restore();
    // Daumen-Wisch
    const th = prog(t, sA - .05, sA + .5);
    if (th > 0 && th < 1) {
      ctx.save(); ctx.globalAlpha = Math.sin(th * Math.PI);
      const y = lerp(1000, 300, easeInOut(th));
      ctx.fillStyle = 'rgba(246,241,230,.9)'; ctx.beginPath(); ctx.roundRect(CX + 60, y, 110, 170, 55); ctx.fill();
      for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(246,241,230,${.25 - i * .05})`; ctx.fillRect(CX + 95, y + 180 + i * 40, 40, 26); }
      ctx.restore();
    }
  }
  // Haken
  const hv = win(t, hA, out);
  if (hv > 0) {
    const k = easeOutBack(prog(t, hA, hA + .6), 1.3), sw = Math.sin((t - hA) * 2.2) * .18 * Math.exp(-(t - hA) * .4);
    ctx.save(); ctx.globalAlpha = hv;
    glow(ctx, CX, 720, 420, .3);
    ctx.translate(CX, 300 + lerp(-500, 0, k)); ctx.rotate(sw);
    ctx.strokeStyle = 'rgba(243,210,122,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -400); ctx.lineTo(0, 120); ctx.stroke();
    ctx.strokeStyle = goldGrad(ctx, -120, 100, 120, 560); ctx.lineWidth = 34; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(0, 430); ctx.arc(-110, 430, 110, 0, Math.PI, false); ctx.lineTo(-220, 360); ctx.stroke();
    ctx.fillStyle = GOLD.a; ctx.beginPath(); ctx.moveTo(-250, 380); ctx.lineTo(-220, 300); ctx.lineTo(-190, 380); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 110, 26, 0, 6.283); ctx.strokeStyle = GOLD.a; ctx.lineWidth = 10; ctx.stroke();
    ctx.restore();
  }
}

// ---------- Regel 3: Schreien -> leise Videos -> Nachricht -> Gewonnen
const SHOUTS = [['JETZT KAUFEN!', 470, -.06, '#ffd400', '#111'], ['NUR HEUTE!', 650, .05, '#ff3d3d', '#fff'], ['-50%!', 830, -.04, '#ffd400', '#c40000']];
const CONF = (() => { const R = rng(9); return Array.from({ length: 70 }, () => ({ a: R() * 6.283, v: 500 + R() * 900, r: R() * 6, s: 8 + R() * 14, c: R() })); })();
function r3(ctx, t, TL) {
  const c = TL.cue, out = c('outro');
  const s1 = c('shout1'), xA = c('shoutX'), cA = c('calm'), dA = c('dm'), tA = c('dmText'), wA = c('win');
  const sv = win(t, s1, cA);
  if (sv > 0) {
    const grey = prog(t, xA, xA + .5);
    ctx.save(); ctx.globalAlpha = sv;
    // Megafon
    ctx.save(); ctx.translate(200, 650); ctx.rotate(-.15 + grey * .5 + Math.sin(t * 40) * .02 * (1 - grey));
    ctx.fillStyle = grey > .5 ? '#555' : '#e03a3a';
    ctx.beginPath(); ctx.moveTo(-60, -40); ctx.lineTo(90, -120); ctx.lineTo(90, 120); ctx.lineTo(-60, 40); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(-100, -40, 45, 80); ctx.fillRect(-40, 40, 26, 80);
    ctx.restore();
    SHOUTS.forEach(([txt, y, rot, bg, fg], i) => {
      const a = c('shout' + (i + 1)); if (t < a) return;
      const k = pop(t, a, .2, 2.4), sh = (1 - prog(t, a, a + .3)) * 10;
      ctx.save(); ctx.globalAlpha *= lerp(1, .35, grey);
      ctx.translate(640 + Math.sin(t * 70 + i) * sh, y); ctx.rotate(rot); ctx.scale(k * lerp(1, .8, grey), k * lerp(1, .8, grey));
      ctx.font = `600 104px ${COND}`; ctx.letterSpacing = '2px';
      const w = ctx.measureText(txt).width;
      ctx.fillStyle = grey > .5 ? '#555' : bg; ctx.beginPath(); ctx.roundRect(-w / 2 - 36, -72, w + 72, 140, 14); ctx.fill();
      ctx.fillStyle = grey > .5 ? '#888' : fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 6);
      ctx.restore();
    });
    ctx.restore();
  }
  // Leise: Video-Raster füllt sich
  const gv = win(t, cA, dA);
  if (gv > 0) {
    ctx.save(); ctx.globalAlpha = gv;
    for (let i = 0; i < 6; i++) {
      const k = pop(t, cA + .2 + i * .55, .3, 1.8); if (k <= 0) continue;
      const x = CX - 300 + (i % 3) * 300, y = 520 + Math.floor(i / 3) * 300;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      card(ctx, 0, 0, 260, 260, 22);
      ctx.fillStyle = GOLD.a; ctx.beginPath(); ctx.moveTo(-26, -40); ctx.lineTo(40, 0); ctx.lineTo(-26, 40); ctx.fill();
      check(ctx, 90, -90, .9);
      ctx.restore();
    }
    ctx.restore();
  }
  // Nachricht
  const mv = win(t, dA, out);
  if (mv > 0) {
    ctx.save(); ctx.globalAlpha = mv;
    const k = easeOutBack(prog(t, dA, dA + .4), 1.4);
    ctx.save(); ctx.translate(CX, lerp(150, 470, k));
    card(ctx, 0, 0, 820, 150, 36);
    ctx.fillStyle = goldGrad(ctx, -360, -30, -300, 30); ctx.beginPath(); ctx.roundRect(-370, -32, 76, 56, 8); ctx.fill();
    ctx.strokeStyle = '#2a1e0a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-366, -28); ctx.lineTo(-332, 0); ctx.lineTo(-298, -28); ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = GOLD.a; ctx.font = `600 44px ${COND}`; ctx.letterSpacing = '2px'; ctx.fillText('Neue Nachricht', -260, -8);
    ctx.fillStyle = '#9a8f80'; ctx.font = `400 30px ${COND}`; ctx.fillText('von einem potenziellen Kunden', -260, 36);
    ctx.restore();
    if (t > tA) {
      const full = 'Was kostet das eigentlich?';
      const n = Math.floor(full.length * clamp((t - tA) / Math.max(.6, (TL.lines.find(l => l.fx === 'dmText').b - tA))));
      const bk = easeOutBack(prog(t, tA - .1, tA + .25), 1.6);
      ctx.save(); ctx.translate(CX, 760); ctx.scale(bk, bk);
      ctx.fillStyle = '#f6f1e6'; ctx.beginPath(); ctx.roundRect(-400, -90, 800, 180, 50); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-320, 80); ctx.lineTo(-370, 140); ctx.lineTo(-260, 88); ctx.fill();
      ctx.fillStyle = '#1d1407'; ctx.font = `700 60px ${SERIF}`; ctx.letterSpacing = '0px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(full.slice(0, n) + (n < full.length && Math.floor(t * 4) % 2 ? '|' : ''), 0, 4);
      ctx.restore();
    }
    if (t > wA) {
      const ck = prog(t, wA, wA + 1.6);
      for (const p of CONF) {
        const d = easeOut(ck) * p.v * .6;
        ctx.save(); ctx.globalAlpha = mv * (1 - ck);
        ctx.translate(CX + Math.cos(p.a) * d, 760 + Math.sin(p.a) * d + ck * ck * 300); ctx.rotate(p.r + ck * 8);
        ctx.fillStyle = p.c > .5 ? GOLD.a : GOLD.hi; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      }
      const sk = pop(t, wA, .4, 2);
      ctx.save(); ctx.translate(CX + 330, 600); ctx.scale(sk, sk);
      ctx.fillStyle = goldGrad(ctx, -70, -70, 70, 70); ctx.beginPath(); ctx.arc(0, 0, 70, 0, 6.283); ctx.fill();
      check(ctx, 0, 4, 1.6, '#1d1407'); ctx.restore();
    }
    ctx.restore();
  }
}

// ---------- Regel 4: Ein Video -> Kalender -> Chart -> 3 Schritte
const PTS = (() => { const r = rng(4), p = []; let v = .1; for (let i = 0; i <= 30; i++) { v = clamp(v + (r() - .35) * .06 + i * .0015, .05, .95); p.push(v); } p[30] = .95; return p; })();
function r4(ctx, t, TL) {
  const c = TL.cue, out = c('outro');
  const oA = c('one'), xA = c('oneX'), kA = c('calendar'), chA = c('chart'), s1 = c('step1');
  const ov = win(t, oA, kA);
  if (ov > 0) {
    const k = pop(t, oA, .35, 1.5), dim = prog(t, xA, xA + .3);
    ctx.save(); ctx.globalAlpha = ov;
    glow(ctx, CX, CY, 420, .35 * (1 - dim));
    ctx.translate(CX, CY); ctx.scale(k * lerp(1, .85, dim), k * lerp(1, .85, dim));
    card(ctx, 0, 0, 440, 440, 36);
    ctx.fillStyle = GOLD.a; ctx.beginPath(); ctx.moveTo(-50, -80); ctx.lineTo(80, 0); ctx.lineTo(-50, 80); ctx.fill();
    for (let i = 0; i < 5; i++) { ctx.font = `900 54px ${SERIF}`; ctx.fillStyle = GOLD.hi; ctx.textAlign = 'center'; ctx.fillText('★', -120 + i * 60, -150); }
    label(ctx, '1× IM MONAT', 0, 180, 42);
    ctx.restore();
    if (t > xA) redX(ctx, CX, CY, 240, prog(t, xA, xA + .3));
  }
  const kv = win(t, kA, chA);
  if (kv > 0) {
    ctx.save(); ctx.globalAlpha = kv;
    const cw = 110, x0 = CX - cw * 3.5, y0 = 380;
    label(ctx, '3× PRO WOCHE', CX, 360, 44);
    for (let r = 0; r < 4; r++) for (let d = 0; d < 7; d++) {
      const x = x0 + d * cw + cw / 2, y = y0 + 40 + r * cw + cw / 2;
      ctx.strokeStyle = 'rgba(212,166,64,.35)'; ctx.lineWidth = 2; ctx.strokeRect(x - cw / 2 + 4, y - cw / 2 + 4, cw - 8, cw - 8);
      const slot = [0, 2, 4].indexOf(d);
      if (slot >= 0) {
        const idx = r * 3 + slot, k = pop(t, kA + .2 + idx * .2, .25, 2);
        if (k > 0) { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = 'rgba(212,166,64,.18)'; ctx.fillRect(-cw / 2 + 6, -cw / 2 + 6, cw - 12, cw - 12); check(ctx, 0, 0, 1.1); ctx.restore(); }
      }
    }
    ctx.restore();
  }
  const chv = win(t, chA, s1);
  if (chv > 0) {
    const k = easeInOut(prog(t, chA, chA + 2.2));
    ctx.save(); ctx.globalAlpha = chv;
    const xa = 120, xb = 960, ya = 950, yb = 380, n = PTS.length - 1, upto = k * n;
    const P = i => { const f = Math.floor(i), cc = Math.min(n, f + 1); return [lerp(xa, xb, i / n), lerp(ya, yb, PTS[f] + (PTS[cc] - PTS[f]) * (i - f))]; };
    ctx.strokeStyle = 'rgba(212,166,64,.13)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { const y = lerp(ya, yb, i / 4); ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(xa, ya); for (let i = 0; i <= upto; i += .25) ctx.lineTo(...P(i)); const [hx, hy] = P(upto); ctx.lineTo(hx, hy); ctx.lineTo(hx, ya); ctx.closePath();
    const ag = ctx.createLinearGradient(0, yb, 0, ya); ag.addColorStop(0, 'rgba(243,210,122,.3)'); ag.addColorStop(1, 'rgba(243,210,122,0)'); ctx.fillStyle = ag; ctx.fill();
    ctx.beginPath(); for (let i = 0; i <= upto; i += .25) ctx.lineTo(...P(i)); ctx.lineTo(hx, hy);
    ctx.strokeStyle = GOLD.a; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(243,200,90,.8)'; ctx.shadowBlur = 24; ctx.stroke();
    ctx.fillStyle = GOLD.hi; ctx.beginPath(); ctx.arc(hx, hy, 14, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  const stv = win(t, s1, out);
  if (stv > 0) {
    ctx.save(); ctx.globalAlpha = stv;
    const names = ['PLAN', 'POSTEN', 'WIEDERHOLEN'];
    names.forEach((nm, i) => {
      const a = c('step' + (i + 1)), on = t >= a, k = pop(t, a, .3, 2);
      const x = CX - 320 + i * 320, y = 620;
      ctx.save(); ctx.translate(x, y); const s = on ? lerp(.8, 1, k) : .8; ctx.scale(s, s);
      ctx.globalAlpha *= on ? 1 : .35;
      if (on) glow(ctx, 0, 0, 220, .35);
      ctx.strokeStyle = on ? GOLD.a : '#6b5a3a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (i === 0) { ctx.strokeRect(-70, -90, 140, 180); ctx.beginPath(); for (let j = 0; j < 3; j++) { ctx.moveTo(-40, -40 + j * 45); ctx.lineTo(40, -40 + j * 45); } ctx.stroke(); }
      if (i === 1) { ctx.beginPath(); ctx.moveTo(0, 80); ctx.lineTo(0, -70); ctx.moveTo(-60, -10); ctx.lineTo(0, -80); ctx.lineTo(60, -10); ctx.moveTo(-90, 90); ctx.lineTo(90, 90); ctx.stroke(); }
      if (i === 2) { ctx.save(); ctx.rotate(on ? (t - a) * 2 : 0); ctx.beginPath(); ctx.arc(0, 0, 80, .3, 5.6); ctx.stroke(); ctx.fillStyle = on ? GOLD.a : '#6b5a3a'; ctx.beginPath(); ctx.moveTo(85, -55); ctx.lineTo(115, 10); ctx.lineTo(45, 0); ctx.fill(); ctx.restore(); }
      label(ctx, nm, 0, 200, 38, on ? GOLD.a : '#6b5a3a', 4);
      ctx.restore();
    });
    ctx.restore();
  }
}

// ---------- Regel 5: Likes -> platzen -> Kassenbuch -> Siegel
const SHARDS = (() => { const R = rng(17); return Array.from({ length: 36 }, () => ({ a: R() * 6.283, v: 300 + R() * 700, r: R() * 6, s: 10 + R() * 24 })); })();
function r5(ctx, t, TL) {
  const c = TL.cue, out = c('outro');
  const lA = c('likes'), pA = c('likesPop'), l1 = c('led1'), lastA = c('last');
  const popL = TL.lines.find(l => l.fx === 'likesPop'), popT = popL.b - .15;
  const hv = win(t, lA, l1);
  if (hv > 0) {
    ctx.save(); ctx.globalAlpha = hv;
    const k = pop(t, lA, .35, 1.8), gone = prog(t, popT, popT + .12);
    const cnt = Math.round(10000 * easeOut(prog(t, lA, lA + 1.3)));
    if (gone < 1) {
      ctx.save(); ctx.translate(CX, 620); const beat = 1 + Math.max(0, Math.sin(t * 7)) * .05; ctx.scale(k * beat * (1 + gone * .3), k * beat * (1 + gone * .3));
      ctx.globalAlpha *= 1 - gone;
      ctx.shadowColor = 'rgba(255,77,109,.6)'; ctx.shadowBlur = 50; ctx.fillStyle = '#ff4d6d'; heart(ctx, 0, 0, 3.2); ctx.fill(); ctx.restore();
    }
    if (t > popT) for (const p of SHARDS) {
      const e = easeOut(prog(t, popT, popT + .9)), d = e * p.v;
      ctx.save(); ctx.globalAlpha = hv * (1 - e); ctx.translate(CX + Math.cos(p.a) * d, 620 + Math.sin(p.a) * d + e * e * 200); ctx.rotate(p.r + e * 6);
      ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.lineTo(p.s * .7, p.s * .6); ctx.lineTo(-p.s * .7, p.s * .4); ctx.fill(); ctx.restore();
    }
    ctx.font = `600 110px ${COND}`; ctx.textAlign = 'center'; ctx.letterSpacing = '2px';
    if (t < popT + .1) { ctx.fillStyle = '#f6f1e6'; ctx.fillText('♥ ' + cnt.toLocaleString('de-DE'), CX, 940); }
    else { const z = pop(t, popT + .1, .3, 2); ctx.save(); ctx.translate(CX, 940); ctx.scale(z, z); ctx.fillStyle = '#ff4a4a'; ctx.fillText('= 0 € MIETE', 0, 0); ctx.restore(); }
    ctx.restore();
  }
  const lv = win(t, l1, out);
  if (lv > 0) {
    ctx.save(); ctx.globalAlpha = lv;
    const k = easeOutBack(prog(t, l1 - .1, l1 + .3), 1.3);
    ctx.translate(CX, 640 + (1 - k) * 200);
    card(ctx, 0, 0, 820, 580, 34);
    label(ctx, 'WAS WIRKLICH ZÄHLT', 0, -210, 38, '#b9ad98', 8);
    ctx.fillStyle = 'rgba(212,166,64,.35)'; ctx.fillRect(-360, -180, 720, 2);
    const rows = [['Anfragen', '+ 24', 'led1'], ['Termine', '+ 11', 'led2'], ['Kunden', '+ 6', 'led3']];
    rows.forEach(([nm, v, cue], i) => {
      const a = c(cue); if (t < a - .05) return;
      const rk = easeOut(prog(t, a - .05, a + .25)), y = -100 + i * 110;
      ctx.save(); ctx.globalAlpha *= rk; ctx.translate((1 - rk) * -40, 0);
      ctx.font = `700 60px ${SERIF}`; ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.fillStyle = '#f6f1e6'; ctx.fillText(nm, -340, y);
      ctx.textAlign = 'right'; ctx.font = `600 64px ${COND}`; ctx.fillStyle = GOLD.a; ctx.fillText(v, 340, y);
      ctx.restore();
    });
    const tk = prog(t, c('led3') + .3, c('led3') + 1.5);
    if (tk > 0) {
      ctx.fillStyle = 'rgba(212,166,64,.35)'; ctx.fillRect(-360, 150, 720, 2);
      ctx.save(); ctx.globalAlpha *= clamp(tk * 3);
      ctx.font = `600 44px ${COND}`; ctx.textAlign = 'left'; ctx.fillStyle = '#b9ad98'; ctx.letterSpacing = '4px'; ctx.fillText('UMSATZ', -340, 225);
      ctx.textAlign = 'right'; goldText(ctx, Math.round(18400 * easeOut(tk)).toLocaleString('de-DE') + ' €', 340, 232, 82, { align: 'right', glow: .8 });
      ctx.restore();
    }
    ctx.restore();
    if (t > lastA) {
      const sk = pop(t, lastA, .45, 1.8);
      ctx.save(); ctx.globalAlpha = lv; ctx.translate(880, 380); ctx.scale(sk, sk); ctx.rotate(-.2 + (t - lastA) * .2);
      ctx.fillStyle = goldGrad(ctx, -95, -95, 95, 95);
      ctx.beginPath(); for (let i = 0; i < 32; i++) { const a = i / 32 * 6.283, r = i % 2 ? 86 : 100; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill();
      ctx.rotate(.2 - (t - lastA) * .2);
      ctx.fillStyle = '#1d1407'; ctx.font = `900 64px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('5/5', 0, 4);
      ctx.restore();
    }
  }
}

const BY = [null, r1, r2, r3, r4, r5];
export function draw(ctx, t, { TL }) {
  ctx.save(); ctx.globalAlpha = 1 - prog(t, TL.cue('outro') - .3, TL.cue('outro'));
  BY[TL.n](ctx, t, TL);
  ctx.restore();
}
