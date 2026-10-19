import { W, H, scenes } from './data.js';
const scale = Number(new URLSearchParams(location.search).get('scale')) || 1;
const canvas = document.getElementById('c');
canvas.width = Math.max(2, 2 * Math.round(W * scale / 2));
canvas.height = Math.max(2, 2 * Math.round(H * scale / 2));
const ctx = canvas.getContext('2d');
const acc = document.createElement('canvas'); acc.width = canvas.width; acc.height = canvas.height;
const actx = acc.getContext('2d');
const mods = await Promise.all(scenes.map(s => import(`./scenes/${s.id}.js`)));
await Promise.all(mods.map(m => m.init?.({ W, H, scale })));
await document.fonts.ready;
const FPS = 30;
async function drawAt(c, t) {
  c.setTransform(1,0,0,1,0,0); c.fillStyle='#121212'; c.fillRect(0,0,canvas.width,canvas.height);
  for (let i=0;i<scenes.length;i++) {
    const s=scenes[i]; if (t<s.start || t>=s.end) continue;
    c.save(); c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    await mods[i].draw(c,t-s.start,{W,H,scale,dur:s.end-s.start,t}); c.restore();
  }
}
// Motion blur: average N sub-frames over a shutter window when the scene asks for it.
window.renderFrame = async t => {
  const shutter = Math.max(...mods.map(m => m.shutter?.(t) || 0));
  if (shutter <= 0.01) return drawAt(ctx, t);
  const n = Math.max(3, Math.round(4 + shutter * 6));
  for (let k = 0; k < n; k++) {
    const tk = t + (k / (n - 1) - 0.5) * shutter / FPS;
    await drawAt(actx, Math.max(0, tk));
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha = 1 / (k + 1); ctx.drawImage(acc, 0, 0); ctx.restore();
  }
};
window.grab=(type,quality=.92)=>canvas.toDataURL(type,quality);
window.__ready=true;
