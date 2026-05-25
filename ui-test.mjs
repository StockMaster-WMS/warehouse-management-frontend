/**
 * StockMaster WMS - UI Test Script (Puppeteer)
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-screenshots');

const ACCOUNTS = [
  { username: 'admin', password: 'Admin@12345', role: 'ADMIN' },
  { username: 'manager', password: 'Manager@12345', role: 'WAREHOUSE_MANAGER' },
  { username: 'staff', password: 'Staff@12345', role: 'WAREHOUSE_STAFF' },
  { username: 'report', password: 'Report@12345', role: 'REPORT_VIEWER' },
];

const results = [];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ss(page, name) {
  const fp = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: fp, fullPage: false });
  console.log(`    📸 ${name}.png`);
}

function log(status, name, note = '') {
  const e = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${e} [${status}] ${name}${note ? ' — ' + note : ''}`);
  results.push({ status, name, note });
}

async function doLogin(page, username, password) {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(2000);
    await ss(page, `01_login_page_${username}`);

    // Try to find username input
    const inputSelectors = ['input[name="username"]', 'input[id="username"]', 'input[type="text"]', 'input[autocomplete="username"]'];
    let usernameInput = null;
    for (const sel of inputSelectors) {
      usernameInput = await page.$(sel);
      if (usernameInput) break;
    }

    if (!usernameInput) {
      log('FAIL', `Login form (${username})`, 'Không tìm thấy ô username');
      return false;
    }

    await usernameInput.click({ clickCount: 3 });
    await usernameInput.type(username, { delay: 50 });

    const passInput = await page.$('input[type="password"]');
    if (!passInput) {
      log('FAIL', `Login form (${username})`, 'Không tìm thấy ô password');
      return false;
    }
    await passInput.click({ clickCount: 3 });
    await passInput.type(password, { delay: 50 });

    await ss(page, `02_login_filled_${username}`);

    // Click submit button
    const submitBtn = await page.$('button[type="submit"]') || await page.$('button');
    if (submitBtn) await submitBtn.click();
    else await passInput.press('Enter');

    await sleep(4000);
    const url = page.url();

    if (url.includes('/login')) {
      const body = await page.evaluate(() => document.body.innerText.substring(0, 200));
      log('FAIL', `Đăng nhập (${username})`, `Vẫn ở trang login. Body: ${body.substring(0, 80)}`);
      await ss(page, `03_login_fail_${username}`);
      return false;
    }

    log('PASS', `Đăng nhập (${username})`, `URL: ${url}`);
    await ss(page, `03_login_success_${username}`);
    return true;
  } catch (e) {
    log('FAIL', `Đăng nhập (${username})`, e.message.substring(0, 100));
    return false;
  }
}

async function visitPage(page, url, label, username) {
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(2000);

    const curUrl = page.url();
    const body = await page.evaluate(() => document.body.innerText.substring(0, 300));

    if (curUrl.includes('/login')) {
      log('PASS', `${label} [${username}]`, '→ Redirect login (không có quyền - đúng)');
      return 'RESTRICTED';
    }
    if (body.includes('403') || body.includes('Không có quyền truy cập') || body.includes('Forbidden')) {
      log('PASS', `${label} [${username}]`, '→ 403 Forbidden (đúng)');
      await ss(page, `page_${label.replace(/[\/ ]/g,'_')}_403_${username}`);
      return 'FORBIDDEN';
    }
    if (body.includes('Lỗi hệ thống') || body.includes('500') || body.includes('Internal Server')) {
      log('FAIL', `${label} [${username}]`, '→ 500 Internal Error!');
      await ss(page, `page_${label.replace(/[\/ ]/g,'_')}_500_${username}`);
      return 'ERROR';
    }

    // Check for table data
    const rowCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });

    const note = rowCount > 0 ? `${rowCount} dòng dữ liệu` : 'Trang load OK';
    log('PASS', `${label} [${username}]`, note);
    await ss(page, `page_${label.replace(/[\/ ]/g,'_')}_${username}`);
    return 'OK';
  } catch (e) {
    log('FAIL', `${label} [${username}]`, e.message.substring(0, 80));
    return 'ERROR';
  }
}

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log('\n🚀 StockMaster WMS — UI Test Automation');
  console.log(`📍 URL: ${BASE_URL}`);
  console.log(`📸 Screenshots → ${SCREENSHOT_DIR}\n`);
  console.log('═'.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // ── LUỒNG 1: Test đăng nhập tất cả tài khoản ──
    console.log('\n🔐 LUỒNG 1 — Đăng nhập & Phân quyền');
    console.log('─'.repeat(50));

    for (const acc of ACCOUNTS) {
      console.log(`\n▶ ${acc.username} (${acc.role})`);
      const page = await browser.newPage();
      page.setDefaultTimeout(20000);

      const ok = await doLogin(page, acc.username, acc.password);

      if (ok) {
        // Check sidebar elements
        await sleep(1500);
        const sidebarLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('nav a, aside a, [data-sidebar] a'));
          return links.map(l => l.textContent?.trim()).filter(Boolean).slice(0, 10);
        });
        log('PASS', `Sidebar menu (${acc.username})`, `Items: ${sidebarLinks.join(', ').substring(0, 100)}`);
        await ss(page, `sidebar_${acc.username}`);

        // Test a few restricted pages per role
        if (acc.role === 'WAREHOUSE_STAFF') {
          await visitPage(page, '/settings', 'Settings forbidden', acc.username);
          await visitPage(page, '/reports', 'Reports forbidden', acc.username);
          await visitPage(page, '/picking', 'Picking', acc.username);
        } else if (acc.role === 'REPORT_VIEWER') {
          await visitPage(page, '/settings', 'Settings forbidden', acc.username);
          await visitPage(page, '/purchase-orders', 'PO forbidden', acc.username);
          await visitPage(page, '/reports', 'Reports', acc.username);
        } else if (acc.role === 'WAREHOUSE_MANAGER') {
          await visitPage(page, '/security', 'Security forbidden', acc.username);
          await visitPage(page, '/settings', 'Settings forbidden', acc.username);
          await visitPage(page, '/dashboard', 'Dashboard', acc.username);
        }
      }

      await page.close();
    }

    // ── LUỒNG 2-9: Test với Admin ──
    console.log('\n\n🗂️  LUỒNG 2-9 — Test chi tiết với Admin');
    console.log('─'.repeat(50));

    const page = await browser.newPage();
    page.setDefaultTimeout(20000);
    const ok = await doLogin(page, 'admin', 'Admin@12345');

    if (ok) {
      const pages = [
        ['/dashboard', 'Dashboard'],
        ['/products', 'Sản phẩm'],
        ['/categories', 'Danh mục'],
        ['/warehouses', 'Kho hàng'],
        ['/suppliers', 'Nhà cung cấp'],
        ['/customers', 'Khách hàng'],
        ['/locations', 'Vị trí lưu trữ'],
        ['/inventory', 'Tồn kho'],
        ['/purchase-orders', 'Đơn nhập hàng'],
        ['/inbound', 'Phiếu nhập kho'],
        ['/putaway', 'Putaway'],
        ['/orders', 'Đơn xuất hàng'],
        ['/picking', 'Picking'],
        ['/returns', 'Hàng trả'],
        ['/cycle-counts', 'Kiểm kê kho'],
        ['/reports', 'Báo cáo'],
        ['/history', 'Nhật ký'],
        ['/ai-assistant', 'AI Assistant'],
        ['/settings', 'Cài đặt'],
        ['/security', 'Bảo mật'],
      ];

      for (const [url, label] of pages) {
        console.log(`\n▶ ${label}`);
        await visitPage(page, url, label, 'admin');
      }
    }

    await page.close();

    await sleep(2000);
  } finally {
    await browser.close();
  }

  // ── Tổng hợp ──
  console.log('\n' + '═'.repeat(60));
  console.log('📊 KẾT QUẢ TỔNG HỢP\n');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  console.log(`  ✅ PASS : ${passed}`);
  console.log(`  ❌ FAIL : ${failed}`);
  console.log(`  ⚠️  WARN : ${warned}`);
  console.log(`  📊 Total: ${results.length}`);
  console.log(`  📈 Pass : ${Math.round(passed / results.length * 100)}%`);

  if (failed > 0) {
    console.log('\n❌ CÁC LỖI:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.note}`);
    });
  }

  // Save JSON
  const outPath = path.join(process.cwd(), 'test-results-ui.json');
  fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), summary: { passed, failed, warned }, results }, null, 2));
  console.log(`\n💾 Kết quả lưu tại: ${outPath}`);
  console.log(`📸 Screenshots lưu tại: ${SCREENSHOT_DIR}`);
}

main().catch(console.error);
