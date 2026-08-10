const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/#explore', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'explore.png' });
  
  const btn = await page.\button[data-form="add_project_form"];
  if (btn) {
    const box = await btn.boundingBox();
    console.log('Button Box:', box);
    const isVisible = await page.evaluate(node => {
      const style = window.getComputedStyle(node);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }, btn);
    console.log('Button isVisible check:', isVisible);
  } else {
    console.log('Button not found');
  }

  await browser.close();
})();
