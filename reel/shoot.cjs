const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
const b = await chromium.launch();
for (const [name, vp] of [['desk',{width:1440,height:900}],['mob',{width:390,height:844}]]) {
  const p = await b.newPage({viewport:vp, deviceScaleFactor: name==='mob'?3:2});
  await p.goto('https://socialclip.art', {waitUntil:'networkidle'});
  await p.addStyleTag({content:'.reveal{opacity:1!important;transform:none!important}'});
  await p.waitForTimeout(1500);
  await p.screenshot({path:`assets/site/${name}-hero.png`});
  await p.screenshot({path:`assets/site/${name}-full.png`, fullPage:true});
}
await b.close();
})();
