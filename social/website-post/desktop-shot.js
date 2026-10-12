// Desktop-Screenshot vom Start von socialclip.art, für den Laptop-Bildschirm in Slide 5.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('file://' + require('path').resolve(__dirname, '../../index.html'));
  await p.waitForTimeout(6000);
  await p.locator('.intro-enter').first().click({ force: true });
  await p.waitForTimeout(2500);
  if (await p.locator('#memoryNo').isVisible()) await p.locator('#memoryNo').click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: __dirname + '/ki/screen-hero.png' });
  await b.close();
})();
