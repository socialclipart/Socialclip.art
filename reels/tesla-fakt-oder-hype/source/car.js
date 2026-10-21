// Generic stylised roadster (side view), no brand marks. Origin = ground contact centre, length ~ 620*s.
import {ctx, mulberry32} from './fx.js';
export function car(x, y, s = 1, rot = 0, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const body = o.body || '#d8dde3', dark = '#0d0f12';
  // thruster plumes
  if (o.thrust > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const tx of [-200, 0, 190]) { const g = ctx.createLinearGradient(tx, 20, tx, 20 + 260 * o.thrust); g.addColorStop(0, `rgba(190,230,255,${.9 * o.thrust})`); g.addColorStop(1, 'rgba(120,180,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(tx - 26, 18); ctx.lineTo(tx + 26, 18); ctx.lineTo(tx + 60, 20 + 260 * o.thrust); ctx.lineTo(tx - 60, 20 + 260 * o.thrust); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  // underglow
  if (o.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 10, 10, 0, 10, 380); g.addColorStop(0, `rgba(80,170,255,${.5 * o.glow})`); g.addColorStop(1, 'rgba(80,170,255,0)'); ctx.fillStyle = g; ctx.fillRect(-420, -60, 840, 200); ctx.restore(); }
  // body
  const bg = ctx.createLinearGradient(0, -190, 0, 10); bg.addColorStop(0, '#ffffff'); bg.addColorStop(.35, body); bg.addColorStop(1, '#6b737c');
  ctx.fillStyle = bg; ctx.beginPath();
  ctx.moveTo(-310, -30); ctx.bezierCurveTo(-312, -70, -300, -92, -250, -100); ctx.bezierCurveTo(-170, -112, -120, -118, -80, -150);
  ctx.bezierCurveTo(-40, -182, 40, -186, 90, -160); ctx.bezierCurveTo(150, -128, 230, -112, 290, -96); ctx.bezierCurveTo(318, -88, 322, -60, 318, -30);
  ctx.lineTo(318, -12); ctx.lineTo(-312, -12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-290, -86); ctx.bezierCurveTo(-120, -100, 120, -98, 300, -80); ctx.stroke();
  // glass
  const gg = ctx.createLinearGradient(-60, -175, 80, -110); gg.addColorStop(0, '#2a3a4a'); gg.addColorStop(1, '#0a1016'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(-70, -142); ctx.bezierCurveTo(-36, -170, 40, -174, 84, -152); ctx.bezierCurveTo(110, -138, 130, -128, 140, -120); ctx.lineTo(-96, -124); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-40, -158); ctx.lineTo(60, -160); ctx.stroke();
  // lights
  ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-312, -62, 14, 20); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(200,235,255,.95)'; ctx.beginPath(); ctx.ellipse(300, -66, 18, 7, -.2, 0, 7); ctx.fill(); ctx.restore();
  // skirt + wheels
  ctx.fillStyle = dark; ctx.fillRect(-300, -16, 616, 14);
  for (const wx of [-195, 200]) { ctx.save(); ctx.translate(wx, -8); ctx.fillStyle = '#060708'; ctx.beginPath(); ctx.arc(0, 0, 62, 0, 7); ctx.fill(); ctx.rotate((o.spin || 0)); ctx.strokeStyle = '#8a929b'; ctx.lineWidth = 7; for (let k = 0; k < 5; k++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(42, 0); ctx.stroke(); } ctx.fillStyle = '#b7bec6'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
export function ramp(x, y, w, h, col = '#2b2f36') { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y - h); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 6; ctx.setLineDash([30, 22]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y - h); ctx.stroke(); ctx.setLineDash([]); }
export function road(t, speed, y = 1420) { const g = ctx.createLinearGradient(0, y, 0, 1920); g.addColorStop(0, '#1a1d22'); g.addColorStop(1, '#07080a'); ctx.fillStyle = g; ctx.fillRect(0, y, 1080, 1920 - y); ctx.fillStyle = 'rgba(255,255,255,.65)'; for (let i = -1; i < 8; i++) { const x = ((i * 220 - t * speed) % 1540 + 1540) % 1540 - 230; ctx.fillRect(x, y + 120, 120, 10); } }
export function flashes(t, t0, n = 18, seed = 2) { const r = mulberry32(seed); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) { const tt = t0 + r() * 3.5, u = (t - tt) / .12; if (u < 0 || u > 1) continue; const x = r() * 1080, y = 1250 + r() * 500, gr = ctx.createRadialGradient(x, y, 0, x, y, 160); gr.addColorStop(0, `rgba(255,255,255,${1 - u})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 160, y - 160, 320, 320); } ctx.restore(); }
