require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/loginPage');
const { ProjectPage } = require('../pages/projectPage');
const { ProjectJob } = require('../pages/projectJob');
const { Logger } = require('../utils/logger');
import fs from 'fs';
import path from 'path';

let context, page, projectPage, projectJob;

test.describe('Tailorbird Bid Award & Contract Flow', () => {

  test.beforeAll(async ({ browser }) => {
    const urlFilePath = path.join(__dirname, '../data/lastVisitedUrl.json');
    const { lastUrl } = JSON.parse(fs.readFileSync(urlFilePath, 'utf8'));

    context = await browser.newContext({ storageState: 'sessionState.json' });
    page = await context.newPage();
    projectPage = new ProjectPage(page);
    projectJob = new ProjectJob(page);

    await page.goto(lastUrl, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    // await expect(page).toHaveURL(lastUrl);
    await page.waitForLoadState('networkidle');
  });

  test('User should be able to open Bids tab and verify bid leveling table', async () => {
    await page.waitForTimeout(3000);

    // ✅ Navigate to Bids tab
    await page.locator('.mantine-Tabs-tabLabel:has-text("Bids")').click();
    await expect(page).toHaveURL(/\/jobs\/\d+\?tab=bids&propertyId=\d+/);
    console.log('✅ Navigated to Bids tab successfully');

    // ✅ Click bid leveling button
    await page.locator('button.mantine-ActionIcon-root:has(svg.lucide-scale)').click();
    await page.waitForTimeout(3000);

    const totalCost = page.locator('div[role="row"]:has-text("Total")');
    await totalCost.waitFor({ state: 'visible', timeout: 10000 });

    // Optional assertion (commented in your original)
    // await expect(totalCost).toHaveText(/\b[1-9]\d*\b/);
  });

  test('User should be able to manage vendors and award bid', async () => {
    // ✅ If "Invite Vendors To Bid" is not visible, click "Manage Vendors"
    if (!(await page.locator("button:has-text('Invite Vendors To Bid')").isVisible())) {
      await page.locator('p:has-text("Manage Vendors")').click();
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    // ✅ Click action menu and award the bid
    const secondVendorAction = page.locator('button:has(svg.lucide-ellipsis-vertical)').nth(0);
    await secondVendorAction.waitFor({ state: 'visible' })
    await secondVendorAction.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page
      .locator('.mantine-Menu-dropdown .mantine-Menu-itemLabel:has-text("Award Bid")')
      .click();

    // ✅ Wait for dialog and verify buttons
    await page.waitForSelector('section[role="dialog"]', { state: 'visible' });

    const cancelButton = page.locator('section[role="dialog"] button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();

    const awardButton = page.locator('section[role="dialog"] button:has-text("Award")');
    await expect(awardButton).toBeVisible();

    await awardButton.click();
  });

  test('User should be able to verify awarded status and finalize contract', async () => {
    // ✅ Wait for Awarded row
    const awardedRow = page.locator('div[role="row"]:has-text("Awarded") div[col-id="status"] p');
    await awardedRow.waitFor({ state: 'visible', timeout: 10000 });
    await expect(awardedRow).toHaveText('Awarded');
    console.log('✅ Vendor has been awarded successfully');

    // ✅ Move to Contracts tab
    await page.locator('.mantine-Tabs-tabLabel:has-text("Contracts")').click();

    // ✅ Finalize contract
    await page.locator('button:has-text("Finalize Contract")').click();
    await page.locator('.mantine-Modal-content button:has-text("Finalize Contract")').click();

    await page
      .locator('.mantine-Modal-content button:has-text("Finalize Contract")')
      .waitFor({ state: 'hidden' });

    await expect(page.locator('button:has-text("Bulk Update Status")')).toBeDisabled();

    Logger.success('✅ Contract finalized and verified successfully');
  });

  test.afterAll(async () => {
    await context.close();
    Logger.success('🧹 Browser context closed successfully.');
  });
});
