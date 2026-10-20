import { prog, easeOut, easeOutBack, easeInOut, lerp, clamp, goldGrad, goldText, fitSize, loadImage, SERIF, COND, GOLD, RED } from '../lib.js';

let sym, mark;
function tint(img, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = goldGrad(g, 0, 0, w * .6, h); g.fillRect(0, 0, w, h);
  return c;
}
export async function init() {
  sym = tint(await loadImage('/assets/logo/socialclip-symbol-cream.svg'), 244, 428);
  mark = tint(await loadImage('/assets/logo/socialclip-wordmark-cream.svg'), 1196, 114);
}

// "*gold* ~strike~ normal" -> [{txt, kind}]
function parse(line) {
  const out = []; const re = /(\*[^*]+\*|~[^~]+~)/g; let last = 0, m;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ txt: line.slice(last, m.index), kind: 'n' });
    out.push({ txt: m[0].slice(1, -1), kind: m[0][0] === '*' ? 'g' : 'r' }); last = re.lastIndex;
  }
  if (last < line.length) out.push({ txt: line.slice(last), kind: 'n' });
  return out;
}

// Wortweises Aufdecken; Strike-Teile werden am Satzende rot durchgestrichen.
function kinetic(ctx, l, t, W, y, { size, font, weight, maxW = 940, grey = false }) {
  const rows = l.show.split('|');
  const allWords = rows.reduce((n, r) => n + r.trim().split(/\s+/).length, 0);
  let fs = size;
  for (const r of rows) fs = Math.min(fs, fitSize(ctx, r.replace(/[*~]/g, ''), maxW, size, font, weight, 1));
  const lh = fs * 1.2, y0 = y - (rows.length - 1) * lh / 2;
  const span = Math.max(.25, (l.b - l.a) * .65);
  let wi = 0;
  rows.forEach((row, ri) => {
    ctx.font = `${weight} ${fs}px ${font}`; ctx.letterSpacing = '1px';
    const segs = parse(row.trim());
    // Wörter mit Art und Breite
    const words = [];
    segs.forEach(s => s.txt.split(/(\s+)/).forEach(w => { if (w) words.push({ w, kind: s.kind, sp: /^\s+$/.test(w) }); }));
    const total = words.reduce((x, w) => x + ctx.measureText(w.w).width, 0);
    let x = W / 2 - total / 2; const yy = y0 + ri * lh;
    const strikes = [];
    for (const w of words) {
      const ww = ctx.measureText(w.w).width;
      if (!w.sp) {
        const ta = l.a + span * (wi / allWords), k = easeOut(prog(t, ta - .05, ta + .16)); wi++;
        if (k > 0) {
          ctx.save(); ctx.globalAlpha *= k; ctx.translate(0, (1 - k) * 18);
          ctx.lineWidth = fs * .14; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineJoin = 'round';
          ctx.textAlign = 'left'; ctx.strokeText(w.w, x, yy);
          if (w.kind === 'g') { ctx.fillStyle = goldGrad(ctx, x, yy - fs * .85, x + fs * .3, yy + fs * .1); ctx.shadowColor = 'rgba(243,190,80,.5)'; ctx.shadowBlur = 24; }
          else ctx.fillStyle = grey ? '#8f877b' : '#f6f1e6';
          ctx.fillText(w.w, x, yy); ctx.restore();
        }
      }
      if (w.kind === 'r') strikes.push([x, ww, w.sp]);
      x += ww;
    }
    // Strike über zusammenhängenden roten Bereich
    const rs = strikes.filter(s => !s[2]);
    if (rs.length) {
      const sx0 = rs[0][0], sx1 = rs[rs.length - 1][0] + rs[rs.length - 1][1];
      const sk = easeOut(prog(t, l.b - .05, l.b + .15));
      if (sk > 0) {
        ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = Math.max(8, fs * .11); ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(sx0 - 10, yy - fs * .28); ctx.lineTo(lerp(sx0 - 10, sx1 + 10, sk), yy - fs * .34); ctx.stroke(); ctx.restore();
      }
    }
  });
}

export function draw(ctx, t, { W, TL }) {
  const L = TL.lines, n = TL.n;
  const intro = L[0], titleL = L.filter(l => l.fx === 'title' || l.fx === 'title2');
  const outroA = TL.cue('outro');
  const bodyStart = L.find(l => l.i > 0 && !['title', 'title2'].includes(l.fx)).a;

  // --- Intro: "WOLF-REGEL" + große Nummer, wandert danach als Badge nach oben links
  const ik = prog(t, intro.a - .15, intro.a + .25);
  const toBadge = easeInOut(prog(t, titleL[0].a - .4, titleL[0].a + .1));
  const badgeOut = 1 - prog(t, outroA - .2, outroA + .1);
  if (ik > 0 && badgeOut > 0) {
    ctx.save(); ctx.globalAlpha = clamp(ik * 2) * badgeOut;
    const ls = lerp(52, 26, toBadge), sp = lerp(18, 8, toBadge);
    ctx.font = `600 ${ls}px ${COND}`; ctx.letterSpacing = sp + 'px'; ctx.textAlign = 'center';
    const lw = ctx.measureText('WOLF-REGEL').width;
    ctx.fillStyle = GOLD.a; ctx.fillText('WOLF-REGEL', lerp(W / 2, 80 + lw / 2, toBadge), lerp(560, 140, toBadge));
    const nk = prog(t, intro.a + .35, intro.a + .5);
    if (nk > 0) {
      const ns = lerp(1.9, 1, easeOutBack(prog(t, intro.a + .35, intro.a + .65), 1.7));
      const size = lerp(420, 110, toBadge);
      ctx.font = `900 ${size}px ${SERIF}`; ctx.letterSpacing = '0px';
      const nw = ctx.measureText('#' + n).width;
      ctx.globalAlpha *= clamp(nk * 3);
      ctx.translate(lerp(W / 2, 80 + nw / 2, toBadge), lerp(960, 250, toBadge)); ctx.scale(ns, ns);
      goldText(ctx, '#' + n, 0, 0, size, { glow: 1.2 });
    }
    ctx.restore();
  }
  // Fortschritt: 5 Punkte oben rechts
  if (toBadge > 0) {
    ctx.save(); ctx.globalAlpha = toBadge * (1 - prog(t, outroA - .2, outroA + .1));
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath(); ctx.arc(W - 250 + (i - 1) * 42, 168, i === n ? 11 : 8, 0, 6.283);
      if (i === n) { ctx.fillStyle = GOLD.a; ctx.fill(); } else if (i < n) { ctx.fillStyle = 'rgba(212,166,64,.55)'; ctx.fill(); }
      else { ctx.strokeStyle = 'rgba(212,166,64,.55)'; ctx.lineWidth = 3; ctx.stroke(); }
    }
    ctx.restore();
  }

  // --- Titel der Regel
  const tk = prog(t, titleL[0].a + .05, titleL[0].a + .4);
  const tOut = 1 - prog(t, bodyStart - .25, bodyStart + .05);
  if (tk > 0 && tOut > 0) {
    const rows = TL.title.split('|');
    const fs = Math.min(...rows.map(r => fitSize(ctx, r, 940, 150, SERIF, 900, 3)));
    rows.forEach((r, i) => {
      const t0 = titleL[Math.min(i, titleL.length - 1)].a + (titleL.length > 1 ? 0 : i * .25);
      const k = easeOut(prog(t, Math.max(t0, titleL[0].a + .05), Math.max(t0, titleL[0].a + .05) + .32)); if (k <= 0) return;
      ctx.save(); ctx.globalAlpha = k * tOut;
      const y = 900 + (i - (rows.length - 1) / 2) * fs * 1.15 + (1 - k) * 30 - (1 - tOut) * 60;
      if (i === rows.length - 1) goldText(ctx, r, W / 2, y, fs, { glow: 1, spacing: 3 });
      else { ctx.font = `900 ${fs}px ${SERIF}`; ctx.letterSpacing = '3px'; ctx.textAlign = 'center'; ctx.fillStyle = '#f6f1e6'; ctx.fillText(r, W / 2, y); }
      ctx.restore();
    });
  }

  // --- Körper: aktueller Satz
  for (const l of L) {
    if (!l.show || ['intro', 'title', 'title2', 'outro', 'cta'].includes(l.fx)) continue;
    if (t < l.a - .1 || t > l.next + .05) continue;
    const out = 1 - prog(t, l.next - .14, l.next);
    ctx.save(); ctx.globalAlpha = out;
    if (l.big) {
      const k = prog(t, l.a - .03, l.a + .2), s = lerp(1.5, 1, easeOutBack(k, 2));
      ctx.translate(W / 2, 1260); ctx.scale(s, s); ctx.translate(-W / 2, -1260);
      ctx.globalAlpha *= clamp(k * 3);
      const fake = { ...l, a: l.a - 1, b: l.b };
      kinetic(ctx, fake, t + 0, W, 1290, { size: 132, font: SERIF, weight: 900 });
    } else {
      kinetic(ctx, l, t, W, 1270, { size: 82, font: SERIF, weight: 700, grey: l.grey });
    }
    ctx.restore();
  }

  // --- Outro
  if (t > outroA - .2) {
    const k = easeOut(prog(t, outroA - .1, outroA + .4));
    ctx.save(); ctx.globalAlpha = k * (1 - prog(t, TL.dur - .3, TL.dur));
    const s = lerp(1.6, 1, easeOutBack(prog(t, outroA - .1, outroA + .3), 1.6));
    ctx.save(); ctx.translate(W / 2, 600); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(243,190,80,.55)'; ctx.shadowBlur = 50;
    ctx.drawImage(sym, -100, -175, 200, 350); ctx.restore();
    const mw = 560, mh = mw * 114 / 1196;
    ctx.drawImage(mark, W / 2 - mw / 2, 830, mw, mh);
    if (n < 5) {
      ctx.font = `600 54px ${COND}`; ctx.letterSpacing = '10px'; ctx.textAlign = 'center'; ctx.fillStyle = '#f6f1e6';
      ctx.fillText('FOLGE FÜR', W / 2, 1090);
      const k2 = easeOutBack(prog(t, outroA + .45, outroA + .8), 1.8);
      ctx.save(); ctx.translate(W / 2, 1270); ctx.scale(lerp(1.4, 1, k2), lerp(1.4, 1, k2)); ctx.globalAlpha *= clamp(k2 * 2);
      goldText(ctx, 'REGEL #' + (n + 1), 0, 0, 150, { glow: 1.1, spacing: 4 }); ctx.restore();
      // Follow-Button
      const fk = easeOutBack(prog(t, outroA + 1.0, outroA + 1.3), 2);
      if (fk > 0) {
        ctx.save(); ctx.translate(W / 2, 1490); ctx.scale(fk, fk);
        ctx.fillStyle = goldGrad(ctx, -260, -55, 260, 55); ctx.beginPath(); ctx.roundRect(-260, -58, 520, 116, 58); ctx.fill();
        ctx.fillStyle = '#1d1407'; ctx.font = `600 54px ${COND}`; ctx.letterSpacing = '6px'; ctx.textBaseline = 'middle';
        ctx.fillText('+ FOLGEN', 0, 4); ctx.restore();
      }
    } else {
      const ask = L.find(l => l.fx === 'outro'), cta = L.find(l => l.fx === 'cta');
      kinetic(ctx, { ...ask, show: 'Willst du, dass wir das|*für dich* machen?' }, t, W, 1110, { size: 78, font: SERIF, weight: 700 });
      const fk = easeOutBack(prog(t, cta.a - .05, cta.a + .3), 2);
      if (fk > 0) {
        ctx.save(); ctx.translate(W / 2, 1420); ctx.scale(fk, fk);
        ctx.shadowColor = 'rgba(243,190,80,.55)'; ctx.shadowBlur = 40;
        ctx.fillStyle = goldGrad(ctx, -340, -60, 340, 60); ctx.beginPath(); ctx.roundRect(-340, -62, 680, 124, 62); ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#1d1407'; ctx.font = `600 58px ${COND}`; ctx.letterSpacing = '6px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('LINK IN DER BIO  ↑', 0, 4); ctx.restore();
        ctx.save(); ctx.globalAlpha *= fk; ctx.fillStyle = '#b9ad98'; ctx.font = `400 34px ${COND}`; ctx.letterSpacing = '10px'; ctx.textAlign = 'center';
        ctx.fillText('SOCIALCLIP.ART', W / 2, 1560); ctx.restore();
      }
    }
    ctx.restore();
  }
}
