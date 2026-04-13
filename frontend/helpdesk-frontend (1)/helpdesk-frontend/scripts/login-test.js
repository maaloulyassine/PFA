const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3001', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    // select ADMIN role
    await page.click('button:has-text("Administrateur")');
    await page.click('button.btn-login');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('NAV_OK', page.url());
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('TEST_FAILED', err.message);
    await browser.close();
    process.exit(1);
  }
})();
