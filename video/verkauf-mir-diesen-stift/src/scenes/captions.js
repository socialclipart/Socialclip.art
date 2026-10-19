import { at } from '../beats.js';
import { prog, easeOut, COND, GOLD, RED } from '../lib.js';

// Untertitel nur dort, wo kein großer Text dasselbe sagt.
const CAPS = [
  { ids: ['meisten'] },
  { ids: ['falsch'], color: RED, size: 86 },
  { ids: ['profi'] },
  { ids: ['serviette'] },
  { ids: ['namen'], italic: true },
  { ids: ['aehm', 'keinen'], color: '#9fb4c8', who: 'DU' },
  { ids: ['trick'] },
  { ids: ['ploetzlich'], hl: 'von selbst.' },
  { ids: ['genau'], hl: 'dein Unternehmen.' },
  { ids: ['keine'] },
  { ids: ['sondern'], hl: 'Nachfrage' },
].map(c => {
  const segs = c.ids.map(at);
  return { ...c, a: segs[0].a - .08, b: segs[segs.length - 1].b + .2, text: segs.map(s => s.text).join(' ') };
});

const Y = 1480, MAXW = 900;

function wrap(ctx, text) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > MAXW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  lines.push(cur); return lines;
}

export function draw(ctx, _, { W, t }) {
  for (const c of CAPS) {
    if (t < c.a || t > c.b + .2) continue;
    const k = easeOut(prog(t, c.a, c.a + .18)), o = 1 - prog(t, c.b, c.b + .18);
    const size = c.size || 66;
    ctx.save(); ctx.globalAlpha = k * o;
    ctx.font = `600 ${size}px ${COND}`; ctx.letterSpacing = '1px'; ctx.textAlign = 'center';
    const lines = wrap(ctx, c.text);
    const lh = size * 1.22, y0 = Y - (lines.length - 1) * lh / 2 + (1 - k) * 20;
    if (c.who) {
      ctx.font = `600 30px ${COND}`; ctx.letterSpacing = '6px'; ctx.fillStyle = c.color;
      ctx.fillText('— ' + c.who + ' —', W / 2, y0 - lh * .9);
      ctx.font = `600 ${size}px ${COND}`; ctx.letterSpacing = '1px';
    }
    lines.forEach((ln, i) => {
      const y = y0 + i * lh;
      ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.lineJoin = 'round';
      ctx.strokeText(ln, W / 2, y);
      if (c.hl && ln.includes(c.hl.split(' ')[0])) {
        // Highlight-Teil gold, Rest weiß
        const idx = ln.indexOf(c.hl.split(' ')[0]);
        const pre = ln.slice(0, idx), post = ln.slice(idx);
        const wPre = ctx.measureText(pre).width, wAll = ctx.measureText(ln).width;
        const x0 = W / 2 - wAll / 2;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f6f1e6'; ctx.fillText(pre, x0, y);
        ctx.fillStyle = GOLD.a; ctx.fillText(post, x0 + wPre, y);
        ctx.textAlign = 'center';
      } else {
        ctx.fillStyle = c.color || '#f6f1e6'; ctx.fillText(ln, W / 2, y);
      }
    });
    ctx.restore();
  }
}
