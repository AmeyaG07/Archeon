const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  console.log('2. Logging in as client_user...');
  await page.fill('input[type="text"]', 'client_user@studioarcheon.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/client**', { timeout: 10000 });
  console.log('Logged in to client portal. Current URL:', page.url());

  console.log('3. Navigating to /client/projects...');
  await page.goto('http://localhost:3000/client/projects');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/verified_client_projects_list.png' });
  console.log('Captured verified_client_projects_list.png');

  // Click on the project workspace
  const workspaceBtn = await page.$('text=OPEN PROJECT WORKSPACE');
  if (workspaceBtn) {
    await workspaceBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  } else {
    await page.goto('http://localhost:3000/client/projects/a87052c8-9c1d-4651-a554-fd8bb31e038a');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  console.log('Current URL in workspace:', page.url());
  await page.screenshot({ path: 'C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/verified_client_project_bills_workspace.png', fullPage: true });
  console.log('Captured fullpage screenshot verified_client_project_bills_workspace.png');

  // Verify page sections order
  const textContent = await page.evaluate(() => document.body.innerText);
  const billsIdx = textContent.indexOf('Project Bills & Invoices');
  const galleryIdx = textContent.indexOf('Project Progress Gallery & Architect Notes');
  const vendorsIdx = textContent.indexOf('Assigned Vendors & Expense Breakdown');
  const cashIdx = textContent.indexOf('Cash Payment Approval Queue');

  console.log('Order of sections:');
  console.log('Bills index:', billsIdx);
  console.log('Gallery index:', galleryIdx);
  console.log('Vendors index:', vendorsIdx);
  console.log('Cash Approval Queue index:', cashIdx);
  console.log('Correct order (Bills < Gallery < Vendors < Cash):', billsIdx < galleryIdx && galleryIdx < vendorsIdx && vendorsIdx < cashIdx);

  await browser.close();
})();
