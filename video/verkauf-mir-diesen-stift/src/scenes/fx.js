import { prog, drawGrain } from '../lib.js';

// Blitze bei Einschlägen: [Zeit, Farbe, Stärke, Dauer]
const FLASH = [
  [8.32, '224,38,43', .28, .3], [18.68, '255,230,170', .35, .35], [33.22, '255,236,190', .5, .45],
  [39.80, '255,230,170', .18, .3], [4.52, '255,255,255', .08, .12], [5.77, '255,255,255', .08, .12], [6.81, '255,255,255', .1, .12],
];

export function draw(ctx, _, { W, H, t }) {
  for (const [s, rgb, a, d] of FLASH) {
    const k = prog(t, s, s + d); if (k <= 0 || k >= 1) continue;
    ctx.fillStyle = `rgba(${rgb},${a * (1 - k) * (1 - k)})`; ctx.fillRect(0, 0, W, H);
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.62)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  drawGrain(ctx, t, W, H, .07);
  // Einblenden am Anfang
  const fi = 1 - prog(t, 0, .35);
  if (fi > 0) { ctx.fillStyle = `rgba(0,0,0,${fi})`; ctx.fillRect(0, 0, W, H); }
}
