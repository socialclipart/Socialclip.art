import { W, H, HOOKS } from './data.js';
import { loadFonts, makeGrain, shake, prog, drawGrain } from './lib.js';
const q = new URLSearchParams(location.search);
const scale = Number(q.get('scale')) || 1, id = q.get('hook') || 'glass', HK = HOOKS[id];
const canvas = document.getElementById('c');
canvas.width = Math.max(2, 2 * Math.round(W * scale / 2));
canvas.height = Math.max(2, 2 * Math.round(H * scale / 2));
const ctx = canvas.getContext('2d');
await loadFonts(); makeGrain();
const mod = await import(`./scenes/${id}.js`);
await mod.init?.({ W, H });
await document.fonts.ready;
window.renderFrame = async t => {
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.save(); ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
  const [sx, sy] = shake(t, HK.shakes); ctx.translate(sx, sy);
  await mod.draw(ctx, t, { W, H, dur: HK.dur });
  ctx.restore();
  ctx.save(); ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
  for (const [s, rgb, a, d] of HK.flashes) {
    const k = prog(t, s, s + d); if (k <= 0 || k >= 1) continue;
    ctx.fillStyle = `rgba(${rgb},${a * (1 - k) * (1 - k)})`; ctx.fillRect(0, 0, W, H);
  }
  const v = ctx.createRadialGradient(W/2, H/2, H*.3, W/2, H/2, H*.72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  drawGrain(ctx, t, W, H, .07);
  // Ausstieg: die letzten 0,2 s weiß, damit der Schnitt ins Reel knallt
  const ex = prog(t, HK.dur - .22, HK.dur - .05);
  if (ex > 0) { ctx.fillStyle = `rgba(255,255,255,${ex})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
};
window.grab=(type,quality=.92)=>canvas.toDataURL(type,quality);
window.__ready=true;
