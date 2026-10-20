const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.setContent(`<style>body{background:#060608;color:#f0c36e}.block{position:relative;width:240px;height:180px;display:inline-block}#line{height:60px}#cms{color:rgb(20,180,240)}canvas{pointer-events:none}</style>
    <div class="block" data-drone-grid="true" id="four"></div>
    <div class="block" data-drone-grid="true" data-drone-rows="3" data-drone-columns="3" id="three"></div>
    <div class="block" data-drone-grid="true" data-drone-rows="2" data-drone-columns="2" id="two"></div>
    <div class="block" data-drone-grid="true" data-drone-rows="1" data-drone-columns="8" id="line"></div>
    <div id="cms"><div class="block" data-drone-grid="true" data-drone-color="inherit" id="inherited"></div></div>`);
  await page.addScriptTag({ path: path.join(__dirname, 'HITS-drone-blocks-v1.js') });
  await page.waitForTimeout(150);
  assert.equal(await page.locator('canvas').count(), 5);
  const p = await page.evaluate(() => HITSDroneBlocks.points(240, 180, 4, 4, 16));
  assert.equal(p.length, 16); assert.deepEqual(p[0], {x:16,y:16}); assert.deepEqual(p[15], {x:224,y:164});
  const line = await page.evaluate(() => HITSDroneBlocks.points(240,60,8,1,16));
  assert(line.every(p => p.y === 30));
  const pixel = await page.locator('#inherited canvas').evaluate(c => [...c.getContext('2d').getImageData(16,16,1,1).data]);
  assert(pixel[2] > pixel[0] * 2 && pixel[1] > pixel[0] * 2, 'inherits CMS-like parent color');
  const before = await page.locator('#four canvas').evaluate(c => c.toDataURL());
  await page.waitForTimeout(150);
  assert.notEqual(await page.locator('#four canvas').evaluate(c=>c.toDataURL()), before, 'flicker animates');
  await page.evaluate(() => { const e = document.querySelector('#two'); const n=e.cloneNode(false); n.id='copy'; document.body.append(n); });
  await page.waitForTimeout(100); assert.equal(await page.locator('canvas').count(),6);
  await page.evaluate(() => document.querySelector('#copy').setAttribute('data-drone-grid','false'));
  await page.waitForTimeout(100); assert.equal(await page.locator('canvas').count(),5);
  await page.evaluate(() => {document.querySelector('#four').style.width='110px'; document.querySelector('#four').setAttribute('data-drone-columns','1');});
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#four canvas').evaluate(c=>c.width),110);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(100);
  const still = await page.locator('#three canvas').evaluate(c=>c.toDataURL());
  await page.waitForTimeout(100); assert.equal(await page.locator('#three canvas').evaluate(c=>c.toDataURL()),still);
  await page.screenshot({path:path.join(__dirname,'drone-blocks-check.png')});
  assert.deepEqual(errors, []);
  await browser.close(); console.log('PASS: layouts, inherited color, animation, duplication, removal, resizing, reduced motion, no browser errors');
})().catch(e=>{console.error(e);process.exit(1)});
