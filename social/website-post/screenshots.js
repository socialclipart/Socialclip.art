// Macht Handy-Screenshots (390px, 3x) aller Bereiche von socialclip.art nach ./fotos.
// Aufruf aus diesem Ordner: NODE_PATH=$(npm root -g) node screenshots.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  await p.goto('file://' + require('path').resolve(__dirname, '../../index.html'));
  await p.waitForTimeout(6000);
  await p.screenshot({ path: __dirname + '/fotos/intro.png' });
  await p.locator('.intro-enter').first().click({ force: true });
  await p.waitForTimeout(2500);
  if (await p.locator('#memoryNo').isVisible()) await p.locator('#memoryNo').click();
  const secs = ['hero','categories','services','nova','tools','manifesto','visual-world','make-visible','check','instagram','contact'];
  for (const c of secs) {
    for (const off of [0, 500]) {
      await p.evaluate(([c,o]) => { const e=document.querySelector('section.'+c); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY + o); }, [c, off]);
      await p.waitForTimeout(1800);
      await p.screenshot({ path: `${__dirname}/fotos/${c}-${off}.png` });
    }
  }
  await b.close();
})();
