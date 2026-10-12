// Macht die Bilder für die Slides: echte Screenshots von socialclip.art (gut)
// und die Gegenbeispiele aus ./mocks (schlecht). Ergebnis landet in ./fotos.
// Aufruf: NODE_PATH=$(npm root -g) node screenshots.js
const { chromium } = require('playwright');
const path = require('path');
const DIR = __dirname;
const SITE = 'file://' + path.resolve(DIR, '../../index.html');
const out = n => path.join(DIR, 'fotos', n);

(async () => {
  const b = await chromium.launch();
  const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 };

  const p = await b.newPage(phone);
  await p.goto(SITE);
  await p.waitForTimeout(6000);
  await p.locator('.intro-enter').first().click({ force: true });
  await p.waitForTimeout(2500);
  const no = p.locator('#memoryNo');
  if (await no.isVisible()) await no.click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: out('hero.png') });
  for (const id of ['nova', 'kontakt', 'tunnel', 'check']) {
    await p.evaluate(i => document.getElementById(i).scrollIntoView(), id);
    await p.waitForTimeout(2000);
    await p.screenshot({ path: out(id + '.png') });
  }
  // Check mit Ergebnis: ein paar Punkte abhaken, Ergebnis zeigen
  const items = p.locator('#check .check-item');
  for (const i of [0, 1, 2, 4, 5, 9]) await items.nth(i).click();
  await p.locator('.check-score').scrollIntoViewIfNeeded();
  await p.evaluate(() => window.scrollBy(0, -120));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out('check-ergebnis.png') });

  for (const m of ['alt-homepage', 'formular', 'mailbox']) {
    const q = await b.newPage(phone);
    await q.goto('file://' + path.join(DIR, 'mocks', m + '.html'));
    await q.screenshot({ path: out(m + '.png') });
  }
  // Desktop-Seite ohne Handy-Ansicht: wird am Handy winzig verkleinert
  const q = await b.newPage({ ...phone, isMobile: true });
  await q.goto('file://' + path.join(DIR, 'mocks', 'desktop-only.html'));
  await q.screenshot({ path: out('desktop-only.png') });
  await b.close();
})();
