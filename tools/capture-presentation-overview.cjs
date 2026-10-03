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
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'load' });
    await mobile.locator('#enter-platform').click();
    const mobileNav = await mobile.locator('.main-nav').evaluate(nav => ({
      layout: getComputedStyle(nav).display,
      labelSize: getComputedStyle(nav.querySelector('.nav-item')).fontSize,
      contentWidth: nav.scrollWidth,
      viewportWidth: nav.clientWidth
    }));
    if (mobileNav.layout !== 'flex' || mobileNav.labelSize === '0px' || mobileNav.contentWidth <= mobileNav.viewportWidth) {
      throw new Error(`Mobile navigation is not readable and scrollable: ${JSON.stringify(mobileNav)}`);
    }
    console.log('Captured current platform interface for slide 2.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
