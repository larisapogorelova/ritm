const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('C:/Users/Milana/AppData/Local/Temp/opencode/ritm-pptx/node_modules/playwright');

async function main() {
  const root = path.resolve(__dirname, '..');
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto(pathToFileURL(path.join(root, 'presentation.html')).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const output = path.join(root, 'Презентация проекта РИТМ.pdf');
    await page.pdf({ path: output, width: '13.333in', height: '7.5in', printBackground: true, preferCSSPageSize: true });
    console.log(`Created ${output}`);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
