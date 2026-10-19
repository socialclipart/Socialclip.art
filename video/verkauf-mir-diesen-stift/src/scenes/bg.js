import { rng } from '../lib.js';

const R = rng(11);
const dust = Array.from({ length: 70 }, () => ({
  x: R() * 1080, y: R() * 1920, r: .8 + R() * 2.6, sp: 8 + R() * 22, ph: R() * 6.28, a: .15 + R() * .45,
}));

export function draw(ctx, _, { W, H, t }) {
  const g = ctx.createRadialGradient(W / 2, H * .42, 60, W / 2, H * .5, H * .75);
  g.addColorStop(0, '#1d150b'); g.addColorStop(.55, '#0c0905'); g.addColorStop(1, '#030201');
  ctx.fillStyle = g; ctx.fillRect(-40, -40, W + 80, H + 80);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const d of dust) {
    const y = ((d.y - t * d.sp) % H + H) % H;
    const x = d.x + Math.sin(t * .6 + d.ph) * 18;
    const a = d.a * (.6 + .4 * Math.sin(t * 2 + d.ph));
    ctx.fillStyle = `rgba(240,200,110,${a})`;
    ctx.beginPath(); ctx.arc(x, y, d.r, 0, 6.283); ctx.fill();
  }
  ctx.restore();
}
