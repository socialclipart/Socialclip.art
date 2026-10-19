// Rendert eine Szene Bild für Bild: node render.js <scene.html> <ausgabeordner> [fps] [sekunden] [einzelzeiten...]
// Die Szene muss window.seek(t) bereitstellen; optional window.HITS, window.BIG, window.DURATION.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [,, html, out, fpsArg = '30', durArg, ...stills] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(html)); await p.evaluate(() => document.fonts.ready);
  const fps = Number(fpsArg), dur = Number(durArg || await p.evaluate(() => window.DURATION || 20));
  fs.mkdirSync(out, { recursive: true });
  const meta = await p.evaluate(() => ({ hits: window.HITS || [], big: window.BIG || [] }));
  fs.writeFileSync(path.join(out, 'hits.json'), JSON.stringify({ fps, duration: dur, ...meta }));
  const times = stills.length ? stills.map(Number) : [...Array(Math.round(fps * dur)).keys()].map(i => i / fps);
  for (let i = 0; i < times.length; i++) {
    await p.evaluate(t => seek(t), times[i]);
    await p.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
  }
  await b.close();
})();
