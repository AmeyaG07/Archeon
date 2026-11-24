import puppeteer from 'puppeteer';

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

  // Scroll to bottom footer
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 2000));

  // Find clock element or footer
  const clockHandle = await page.$('footer svg') || await page.$('footer');
  if (clockHandle) {
    await clockHandle.screenshot({
      path: 'C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/footer_clock_verified.png'
    });
    console.log('Captured footer clock screenshot');
  } else {
    await page.screenshot({
      path: 'C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/footer_clock_verified.png'
    });
    console.log('Captured full page bottom screenshot');
  }

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
