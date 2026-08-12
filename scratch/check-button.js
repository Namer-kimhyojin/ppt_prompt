import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:4174');
  await page.click('#tabBtnConceptMixer');
  await page.waitForTimeout(500);
  
  // Click the unsplash API button
  console.log('Clicking the unsplash API button...');
  await page.click('button:has-text("unsplash API")');
  await page.waitForTimeout(300);
  
  // Check details state
  const detailsState = await page.evaluate(() => {
    const details = document.querySelector('.mixer-settings');
    const panel = document.querySelector('.mixer-settings-panel');
    const panelStyle = panel ? window.getComputedStyle(panel) : null;
    
    return {
      isOpen: details ? details.open : false,
      hasPanel: !!panel,
      panelVisible: panelStyle ? panelStyle.display !== 'none' && panelStyle.visibility !== 'hidden' : false,
      panelOpacity: panelStyle ? panelStyle.opacity : 'n/a',
      panelBoundingRect: panel ? panel.getBoundingClientRect() : null
    };
  });
  
  console.log('Details State after first click:', JSON.stringify(detailsState, null, 2));
  
  // Click again to close
  await page.click('button:has-text("unsplash API")');
  await page.waitForTimeout(300);
  
  const detailsState2 = await page.evaluate(() => {
    const details = document.querySelector('.mixer-settings');
    return {
      isOpen: details ? details.open : false
    };
  });
  console.log('Details State after second click:', JSON.stringify(detailsState2, null, 2));
  
  await browser.close();
})();
