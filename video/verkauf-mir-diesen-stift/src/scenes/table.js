import { EV } from '../beats.js';
import { rng, prog, easeOut, easeOutBack, easeInOut, lerp, clamp, drawPen, goldText, SERIF } from '../lib.js';

let wood;
export function init() {
  wood = document.createElement('canvas'); wood.width = 1300; wood.height = 2300;
  const g = wood.getContext('2d'), R = rng(5);
  const base = g.createLinearGradient(0, 0, 1300, 2300);
  base.addColorStop(0, '#3a2414'); base.addColorStop(.5, '#2b190c'); base.addColorStop(1, '#1c1007');
  g.fillStyle = base; g.fillRect(0, 0, 1300, 2300);
  // Maserung: senkrechte Bretter (Hochformat)
  for (let i = 0; i < 340; i++) {
    const x0 = R() * 1300, amp = 4 + R() * 18, f = .002 + R() * .004, ph = R() * 6.28;
    g.strokeStyle = R() < .5 ? `rgba(15,7,2,${.1 + R() * .25})` : `rgba(120,72,36,${.05 + R() * .12})`;
    g.lineWidth = .6 + R() * 2.6;
    g.beginPath();
    for (let y = 0; y <= 2300; y += 20) g.lineTo(x0 + Math.sin(y * f + ph) * amp + Math.sin(y * f * 3.1 + ph) * amp * .3, y);
    g.stroke();
  }
  // Bretter-Fugen
  for (const x of [230, 610, 990]) {
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, 0, 5, 2300);
    g.fillStyle = 'rgba(160,100,50,.08)'; g.fillRect(x + 5, 0, 3, 2300);
  }
}

function napkin(ctx, S) {
  const h = S / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
  ctx.fillStyle = '#efe9dd'; ctx.fillRect(-h, -h, S, S);
  ctx.restore();
  // Faltung (Diagonale) und Schattierung
  const fg = ctx.createLinearGradient(-h, -h, h, h);
  fg.addColorStop(0, 'rgba(255,255,255,.35)'); fg.addColorStop(.495, 'rgba(255,255,255,0)');
  fg.addColorStop(.5, 'rgba(120,100,70,.18)'); fg.addColorStop(.51, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(90,70,40,.14)');
  ctx.fillStyle = fg; ctx.fillRect(-h, -h, S, S);
  // Geprägter Rand
  ctx.strokeStyle = 'rgba(150,130,100,.35)'; ctx.lineWidth = 3; ctx.setLineDash([2, 9]);
  ctx.strokeRect(-h + 34, -h + 34, S - 68, S - 68);
  ctx.strokeRect(-h + 48, -h + 48, S - 96, S - 96);
  ctx.setLineDash([]);
}

export function draw(ctx, _, { W, H, t }) {
  const vis = prog(t, 10.75, 11.15) * (1 - prog(t, 19.3, 19.55));
  ctx.save(); ctx.globalAlpha = vis;
  const cam = lerp(1.0, 1.1, easeInOut(prog(t, 10.75, 19.5)));
  ctx.translate(W / 2, H / 2); ctx.scale(cam, cam); ctx.translate(-W / 2, -H / 2);
  ctx.drawImage(wood, -110, -190);
  // Spot
  const sp = ctx.createRadialGradient(W / 2, 900, 80, W / 2, 940, 1100);
  sp.addColorStop(0, 'rgba(255,214,150,.18)'); sp.addColorStop(.45, 'rgba(0,0,0,0)'); sp.addColorStop(1, 'rgba(0,0,0,.85)');
  ctx.fillStyle = sp; ctx.fillRect(-200, -200, W + 400, H + 400);

  // Serviette schiebt sich rein
  const nk = easeOut(prog(t, EV.napkinIn, EV.napkinArrive));
  const nx = lerp(1650, 540, nk), nr = lerp(-.32, -.05, nk);
  ctx.save(); ctx.translate(nx, 930); ctx.rotate(nr);
  napkin(ctx, 640);
  // "Name: ......"
  const lk = prog(t, EV.lineDraw, EV.lineDraw + .7);
  if (lk > 0) {
    ctx.globalAlpha = vis * clamp(lk * 4);
    ctx.font = `400 italic 62px ${SERIF}`; ctx.fillStyle = '#4a4036'; ctx.textAlign = 'left';
    ctx.fillText('Name:', -240, 60);
    ctx.strokeStyle = '#6a5d4f'; ctx.lineWidth = 4; ctx.setLineDash([3, 12]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-70, 62); ctx.lineTo(lerp(-70, 240, easeOut(lk)), 62); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = vis;
  }
  // Fragezeichen
  const q = prog(t, EV.question, EV.question + .35), qOut = 1 - prog(t, 18.45, 18.7);
  if (q > 0 && qOut > 0) {
    ctx.save(); ctx.globalAlpha = vis * qOut * clamp(q * 3);
    ctx.translate(190, -120 - easeOut(q) * 40); ctx.rotate(Math.sin((t - EV.question) * 9) * .12 * (1 - q * .7));
    const s = easeOutBack(q, 3);
    ctx.scale(s, s);
    ctx.font = `900 190px ${SERIF}`; ctx.fillStyle = 'rgba(70,60,50,.8)'; ctx.textAlign = 'center';
    ctx.fillText('?', 0, 0); ctx.restore();
  }
  ctx.restore();

  // Goldener Stift rollt rein: "Eben."
  const pk = prog(t, EV.penRollStart, EV.penLand);
  if (pk > 0) {
    const e = easeOut(pk);
    const px = lerp(-380, 600, e), roll = (1 - e) * 18;
    const settle = t > EV.penLand ? Math.sin((t - EV.penLand) * 30) * Math.exp(-(t - EV.penLand) * 9) * 8 : 0;
    ctx.save(); ctx.translate(px + settle, 900); ctx.rotate(-1.32);
    drawPen(ctx, 560, ((roll * .35) % 1.6) - .3 + (t > EV.penLand ? lerp(0, 1.5, prog(t, EV.penLand, EV.penLand + .8)) : 0));
    ctx.restore();
  }
  ctx.restore();

  // EBEN.
  const ek = prog(t, EV.penLand, EV.penLand + .22), eOut = 1 - prog(t, 19.25, 19.5);
  if (ek > 0 && eOut > 0) {
    const s = lerp(1.8, 1, easeOutBack(ek, 2));
    ctx.save(); ctx.globalAlpha = clamp(ek * 3) * eOut;
    ctx.translate(W / 2, 400); ctx.scale(s, s);
    goldText(ctx, 'EBEN.', 0, 60, 210, { glow: 1.3, spacing: 6 });
    ctx.restore();
  }
}
