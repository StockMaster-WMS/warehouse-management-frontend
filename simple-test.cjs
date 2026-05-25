/* eslint-disable @typescript-eslint/no-require-imports */
const puppeteer = require('puppeteer');
const fs = require('fs');

const LOG = 'D:/K22-DATN/warehouse-management/warehouse-management-frontend/simple-test.log';

function write(msg) {
  fs.appendFileSync(LOG, msg + '\n');
}

write('=== START ' + new Date().toISOString() + ' ===');
write('Node version: ' + process.version);

(async () => {
  try {
    write('Loading puppeteer...');
    write('Puppeteer keys: ' + Object.keys(puppeteer).join(', '));

    write('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true, // headless first to test
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    write('Browser launched!');

    const page = await browser.newPage();
    write('Page created');

    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    write('Navigated to login. URL: ' + page.url());

    const title = await page.title();
    write('Page title: ' + title);

    // Get page content
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    write('Body text (500 chars): ' + bodyText);

    // Find inputs
    const inputs = await page.$$('input');
    write('Input count: ' + inputs.length);

    const inputTypes = [];
    for (const inp of inputs) {
      const t = await page.evaluate(el => el.type + '|' + el.name + '|' + el.placeholder, inp);
      inputTypes.push(t);
    }
    write('Inputs: ' + inputTypes.join(', '));

    await page.screenshot({ path: 'D:/K22-DATN/warehouse-management/warehouse-management-frontend/test-screenshots/login-page.png' });
    write('Screenshot taken');

    await browser.close();
    write('=== DONE ===');
  } catch (e) {
    write('ERROR: ' + e.message);
    write('STACK: ' + e.stack);
  }
})();
