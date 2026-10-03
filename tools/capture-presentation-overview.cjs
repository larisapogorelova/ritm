const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('C:/Users/Milana/AppData/Local/Temp/opencode/ritm-pptx/node_modules/playwright');

async function main() {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'load' });
    await page.locator('#enter-platform').click();
    await page.locator('#platform-shell.is-open').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(root, 'presentation-assets', 'overview.png'), animations: 'disabled' });
    console.log('Captured current platform interface for slide 2.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
