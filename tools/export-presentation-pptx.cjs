const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('C:/Users/Milana/AppData/Local/Temp/opencode/ritm-pptx/node_modules/playwright');
const pptxgen = require('C:/Users/Milana/AppData/Local/Temp/opencode/ritm-pptx/node_modules/pptxgenjs');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'Презентация платформы РИТМ.pptx');
const previewDir = path.join(root, '.pptx-frames');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function main() {
  fs.mkdirSync(previewDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: edge, headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'РИТМ';
  pptx.subject = 'Презентация платформы РИТМ';
  pptx.title = 'РИТМ — единая платформа управления';
  pptx.company = 'РИТМ';
  pptx.lang = 'ru-RU';
  pptx.defineSlideMaster({
    title: 'FRAME',
    background: { color: '0D1020' },
    objects: []
  });

  const presentationUrl = pathToFileURL(path.join(root, 'presentation.html')).href;
  const slideCount = await page.goto(presentationUrl, { waitUntil: 'load' }).then(() => page.locator('.slide').count());
  for (let slideNumber = 1; slideNumber <= slideCount; slideNumber += 1) {
    await page.goto(`${presentationUrl}?slide=${slideNumber}`, { waitUntil: 'load' });
    const slide = page.locator('.slide.active');
    await slide.waitFor({ state: 'visible' });
    await page.waitForTimeout(1800);
    const file = path.join(previewDir, `slide-${String(slideNumber).padStart(2, '0')}.png`);
    await slide.screenshot({ path: file });
    const pptSlide = pptx.addSlide('FRAME');
    pptSlide.addImage({ path: file, x: 0, y: 0, w: 13.333, h: 7.5 });
    pptSlide.addNotes(`Слайд ${slideNumber}/${slideCount}.`);
  }
  await browser.close();
  await pptx.writeFile({ fileName: output });
  fs.rmSync(previewDir, { recursive: true, force: true });
  console.log(`Created ${output} with ${slideCount} slides.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
