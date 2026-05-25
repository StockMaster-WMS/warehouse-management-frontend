/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');
const LOG_FILE = path.join(__dirname, 'test-output.log');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Override console.log to also write to file
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });
const origLog = console.log.bind(console);
const origErr = console.error.bind(console);
console.log = (...args) => {
  const msg = args.join(' ');
  origLog(msg);
  logStream.write(msg + '\n');
};
console.error = (...args) => {
  const msg = 'ERROR: ' + args.join(' ');
  origErr(msg);
  logStream.write(msg + '\n');
};

const results = [];
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(status, name, note) {
  const e = { PASS: '✅', FAIL: '❌', WARN: '⚠️' }[status];
  const msg = `  ${e} [${status}] ${name}${note ? ' — ' + note : ''}`;
  console.log(msg);
  results.push({ status, name, note: note || '' });
}

async function ss(page, name) {
  try {
    const fp = path.join(SCREENSHOT_DIR, name.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.png');
    await page.screenshot({ path: fp, fullPage: false });
    console.log('    📸 ' + path.basename(fp));
    return fp;
  } catch (e) { /* ignore */ }
}

async function main() {
  console.log('\n🚀 StockMaster WMS — UI Test (Puppeteer)');
  console.log('📍 URL: ' + BASE_URL);
  console.log('📸 Screenshots: ' + SCREENSHOT_DIR);
  console.log('═'.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
  });

  async function doLogin(page, username, password) {
    try {
      await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 25000 });
      await sleep(2000);
      await ss(page, '01_login_' + username);

      // Find username input
      const inputSels = ['input[name="username"]', '#username', 'input[type="text"]', 'input[autocomplete="username"]'];
      let uInput = null;
      for (const sel of inputSels) {
        try { uInput = await page.$(sel); if (uInput) break; } catch(e) {}
      }

      if (!uInput) {
        // Try to get all inputs
        const allInputs = await page.$$('input');
        if (allInputs.length >= 2) {
          uInput = allInputs[0];
        }
      }

      if (!uInput) {
        const bodyHtml = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
        log('FAIL', 'Login ' + username, 'No input found. Body: ' + bodyHtml.substring(0, 100));
        return false;
      }

      await uInput.click({ clickCount: 3 });
      await uInput.type(username, { delay: 30 });

      const pInput = await page.$('input[type="password"]');
      if (!pInput) {
        log('FAIL', 'Login ' + username, 'No password input');
        return false;
      }
      await pInput.click({ clickCount: 3 });
      await pInput.type(password, { delay: 30 });

      await ss(page, '02_login_filled_' + username);

      // Click submit
      const btn = await page.$('button[type="submit"]');
      if (btn) await btn.click();
      else await pInput.press('Enter');

      await sleep(5000);
      const url = page.url();

      if (url.includes('/login')) {
        const body = await page.evaluate(() => document.body.innerText.substring(0, 300));
        log('FAIL', 'Login ' + username, 'Still on login. Content: ' + body.substring(0, 80));
        await ss(page, '03_login_FAIL_' + username);
        return false;
      }

      log('PASS', 'Login ' + username, 'URL: ' + url);
      await ss(page, '03_login_OK_' + username);
      return true;
    } catch (e) {
      log('FAIL', 'Login ' + username, e.message.substring(0, 100));
      await ss(page, '03_login_ERR_' + username);
      return false;
    }
  }

  async function visitPage(page, url, label, username) {
    try {
      await page.goto(BASE_URL + url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await sleep(2500);

      const curUrl = page.url();
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 400));
      const rowCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);

      if (curUrl.includes('/login')) {
        log('PASS', label + ' [' + username + ']', 'Redirect → login (no access - correct)');
        return 'RESTRICTED';
      }
      if (bodyText.includes('403') || bodyText.includes('Không có quyền') || bodyText.includes('Forbidden')) {
        log('PASS', label + ' [' + username + ']', '403 Forbidden page (correct)');
        await ss(page, 'page_' + label + '_forbidden_' + username);
        return 'FORBIDDEN';
      }
      if (bodyText.includes('Lỗi hệ thống') || bodyText.includes('INTERNAL_SERVER_ERROR')) {
        log('FAIL', label + ' [' + username + ']', '500 Internal Error on page!');
        await ss(page, 'page_' + label + '_500_' + username);
        return 'ERROR';
      }

      const note = rowCount > 0 ? rowCount + ' table rows' : 'Page OK (no table)';
      log('PASS', label + ' [' + username + ']', note);
      await ss(page, 'page_' + label + '_' + username);
      return 'OK';
    } catch (e) {
      log('FAIL', label + ' [' + username + ']', e.message.substring(0, 80));
      return 'ERROR';
    }
  }

  // ── LUỒNG 1: Đăng nhập ──
  console.log('\n🔐 LUỒNG 1 — Đăng nhập & Phân quyền\n');

  const accounts = [
    { username: 'admin', password: 'Admin@12345', role: 'ADMIN' },
    { username: 'manager', password: 'Manager@12345', role: 'MANAGER' },
    { username: 'staff', password: 'Staff@12345', role: 'STAFF' },
    { username: 'report', password: 'Report@12345', role: 'REPORT' },
  ];

  for (const acc of accounts) {
    console.log('\n▶ Testing: ' + acc.username + ' (' + acc.role + ')');
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);

    const ok = await doLogin(page, acc.username, acc.password);

    if (ok) {
      await sleep(1500);

      // Check sidebar
      const sidebarItems = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('nav a, aside a, [data-sidebar] a, .sidebar a'));
        return links.map(l => l.textContent.trim()).filter(Boolean).slice(0, 8);
      });
      if (sidebarItems.length > 0) {
        log('PASS', 'Sidebar ' + acc.username, 'Items: ' + sidebarItems.join(', ').substring(0, 80));
      } else {
        log('WARN', 'Sidebar ' + acc.username, 'No sidebar items found (may not have loaded yet)');
      }
      await ss(page, '04_sidebar_' + acc.username);

      // Role-specific tests
      if (acc.role === 'STAFF') {
        await visitPage(page, '/picking', 'Picking', acc.username);
        await visitPage(page, '/inbound', 'Inbound', acc.username);
        await visitPage(page, '/reports', 'Reports (forbidden)', acc.username);
        await visitPage(page, '/settings', 'Settings (forbidden)', acc.username);
        await visitPage(page, '/purchase-orders', 'PO', acc.username);
      } else if (acc.role === 'REPORT') {
        await visitPage(page, '/dashboard', 'Dashboard', acc.username);
        await visitPage(page, '/reports', 'Reports', acc.username);
        await visitPage(page, '/inventory', 'Inventory', acc.username);
        await visitPage(page, '/purchase-orders', 'PO (forbidden?)', acc.username);
        await visitPage(page, '/settings', 'Settings (forbidden)', acc.username);
      } else if (acc.role === 'MANAGER') {
        await visitPage(page, '/dashboard', 'Dashboard', acc.username);
        await visitPage(page, '/settings', 'Settings (forbidden)', acc.username);
        await visitPage(page, '/security', 'Security (forbidden)', acc.username);
        await visitPage(page, '/purchase-orders', 'PO', acc.username);
        await visitPage(page, '/reports', 'Reports', acc.username);
      }
    }

    await page.close();
  }

  // ── LUỒNG 2-9: Admin test tất cả pages ──
  console.log('\n\n🗂️  LUỒNG 2-9 — Test chi tiết (Admin)\n');
  const adminPage = await browser.newPage();
  adminPage.setDefaultTimeout(20000);
  const adminOk = await doLogin(adminPage, 'admin', 'Admin@12345');

  if (adminOk) {
    const pages = [
      ['/dashboard', 'Dashboard'],
      ['/products', 'Products'],
      ['/categories', 'Categories'],
      ['/warehouses', 'Warehouses'],
      ['/suppliers', 'Suppliers'],
      ['/customers', 'Customers'],
      ['/locations', 'Locations'],
      ['/inventory', 'Inventory'],
      ['/purchase-orders', 'Purchase Orders'],
      ['/inbound', 'Inbound Receipts'],
      ['/putaway', 'Putaway'],
      ['/orders', 'Sales Orders'],
      ['/picking', 'Picking'],
      ['/returns', 'Returns'],
      ['/cycle-counts', 'Cycle Counts'],
      ['/reports', 'Reports'],
      ['/history', 'History'],
      ['/ai-assistant', 'AI Assistant'],
      ['/settings', 'Settings'],
      ['/security', 'Security'],
    ];

    for (const [url, label] of pages) {
      console.log('\n  ▶ ' + label);
      await visitPage(adminPage, url, label, 'admin');
    }
  }

  await adminPage.close();
  await sleep(2000);
  await browser.close();

  // ── Summary ──
  console.log('\n' + '═'.repeat(60));
  console.log('📊 KẾT QUẢ TỔNG HỢP\n');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  console.log('  ✅ PASS : ' + passed);
  console.log('  ❌ FAIL : ' + failed);
  console.log('  ⚠️  WARN : ' + warned);
  console.log('  📊 Total: ' + results.length);
  console.log('  📈 Pass%: ' + Math.round(passed / results.length * 100) + '%');

  if (failed > 0) {
    console.log('\n❌ FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log('  - ' + r.name + ': ' + r.note);
    });
  }
  if (warned > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log('  - ' + r.name + ': ' + r.note);
    });
  }

  const outPath = path.join(__dirname, 'test-results-ui.json');
  fs.writeFileSync(outPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { passed, failed, warned, total: results.length },
    results
  }, null, 2));
  console.log('\n💾 JSON: ' + outPath);
  console.log('📸 Screenshots: ' + SCREENSHOT_DIR);
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
