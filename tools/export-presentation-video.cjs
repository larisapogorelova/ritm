const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('C:/Users/Milana/AppData/Local/Temp/opencode/ritm-pptx/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const videoDir = path.join(root, '.presentation-video');
const output = path.join(root, 'Презентация проекта РИТМ.webm');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const slideDuration = 5000;

async function main() {
  fs.mkdirSync(videoDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: edge, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1600, height: 900 } }
  });
  const page = await context.newPage();
  const url = pathToFileURL(path.join(root, 'presentation.html')).href;
  for (let slide = 1; slide <= 8; slide += 1) {
    await page.goto(`${url}?slide=${slide}`, { waitUntil: 'load' });
    await page.locator('.slide.active').waitFor({ state: 'visible' });
    await page.waitForTimeout(slideDuration);
  }
  const video = page.video();
  await context.close();
  await browser.close();
  if (!video) throw new Error('Видео не было записано.');
  const recordingPath = await video.path();
  fs.copyFileSync(recordingPath, output);
  fs.rmSync(recordingPath, { force: true });
  fs.rmSync(videoDir, { recursive: true, force: true });
  console.log(`Created ${output}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
