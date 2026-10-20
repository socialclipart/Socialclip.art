import { W, H, scenes, timeline } from './data.js';
import { loadFonts, makeGrain, shake } from './lib.js';
const q = new URLSearchParams(location.search);
const scale = Number(q.get('scale')) || 1, rule = Number(q.get('rule')) || 1;
const TL = timeline(rule, q.get('voice') || 'karlsson');
const canvas = document.getElementById('c');
canvas.width = Math.max(2, 2 * Math.round(W * scale / 2));
canvas.height = Math.max(2, 2 * Math.round(H * scale / 2));
const ctx = canvas.getContext('2d');
await loadFonts(); makeGrain();
const mods = await Promise.all(scenes.map(s => import(`./scenes/${s}.js`)));
await Promise.all(mods.map(m => m.init?.({ W, H, scale, TL })));
await document.fonts.ready;
window.renderFrame = async t => {
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
  const [sx, sy] = shake(t, TL.shakes);
  for (let i = 0; i < scenes.length; i++) {
    ctx.save(); ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    if (scenes[i] !== 'fx') ctx.translate(sx, sy);
    await mods[i].draw(ctx, t, { W, H, scale, t, TL }); ctx.restore();
  }
};
window.grab=(type,quality=.92)=>canvas.toDataURL(type,quality);
window.__ready=true;
