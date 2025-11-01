require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ProjectPage } = require('../pages/projectPage');
const { ProjectJob } = require('../pages/projectJob');
const { Logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

let context, page, projectPage, projectJob, projectData;

test.describe('Verify Create Project and Add Job flow', () => {

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext({ storageState: 'sessionState.json' });
        page = await context.newPage();
        projectPage = new ProjectPage(page);
        projectJob = new ProjectJob(page);

        // ✅ Load project data
        const filePath = path.join(__dirname, '../data/projectData.json');
        projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        await page.goto(process.env.DASHBOARD_URL, { waitUntil: 'load' });
        await expect(page).toHaveURL(process.env.DASHBOARD_URL);
        await page.waitForLoadState('networkidle');
    });

    test('User should be able to navigate to existing project', async () => {
        Logger.step('Navigating to Projects...');
        await projectPage.navigateToProjects();
        await page.waitForSelector('input[placeholder="Search..."]', { state: 'visible', timeout: 30000 });

        Logger.step(`Opening project "${projectData.projectName}"...`);
        const projectCard = page.locator('.mantine-SimpleGrid-root .mantine-Group-root', {
            hasText: projectData.projectName,
        });
        await projectCard.waitFor({ state: 'visible', timeout: 10000 });
        await projectCard.click();

        // Navigate to Jobs tab
        await projectJob.navigateToJobsTab();
    });

    test('User should be able to add and configure job details', async () => {
        Logger.step('Adding and editing Job...');
        await projectJob.addJob();
        await projectJob.editJobTitle('Mall in Noida');
        await projectJob.selectJobType('Capex');

        Logger.step('Opening Job Summary...');
        await projectJob.openJobSummary();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        await projectJob.fillJobDescription(projectData.description);
        await projectJob.selectStartEndDates();
    });

    test('User should be able to create bids and invite existing vendor', async () => {
        Logger.step('Creating Bid with Material...');
        await projectJob.createBidWithMaterial();

        // Invite Vendors
        Logger.step('Inviting Vendors...');
        await projectJob.inviteVendorsToBid();

        // Scroll to bottom to load all vendors
        await page.locator('.ag-body-viewport').last().evaluate(el => {
            el.scrollTop = el.scrollHeight;
        });

        // ✅ Invite existing vendor
        await page.locator(`.ag-pinned-left-cols-container div[role="row"]:has-text('testsumit') .ag-checkbox`).click();
        await page.locator(`button:has-text('Invite Selected Vendors to Bid')`).click();
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`div[col-id="vendor_name"]:has-text('testsumit')`)).toContainText('testsumit');


    });
    test('User should be able to invite new vendor', async () => {
        // ✅ Invite new vendor
        Logger.step('Inviting new vendor...');
        await page.locator("button:has-text('Invite Vendors To Bid')").click();
        await page.locator(`button:has-text('Invite a New Vendor to Bid')`).click();
        await page.locator(`input[placeholder="Enter Vendor Organization Name"]`).fill('Sumit_Corp');
        await page.locator(`input[placeholder="Enter Contact Name"]`).fill('Sumit');
        await page.locator(`input[placeholder="Enter Contact Email"]`).fill(projectPage.generateRandomEmail());
        await page.locator(`input[placeholder="Search for address..."]`).fill('Noida');
        await page.waitForTimeout(3000);
        await page.locator(`.mantine-Stack-root:has-text('Invite a New Vendor to Bid') button:has-text('Invite Vendor')`).click();
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`div[col-id="vendor_name"]:has-text('Sumit_Corp')`)).toBeVisible();
        Logger.success('✅ New vendor invited successfully.');
    });

    test('User should be able to edit bid on behalf of new vendor and submit', async () => {
        Logger.step('Editing Bid on behalf of vendor...');
        const actionButton = page.locator('button:has(svg.lucide-ellipsis-vertical)').nth(1);
        await actionButton.click();
        await page.locator('.mantine-Menu-dropdown .mantine-Menu-itemLabel:has-text("Edit On Behalf of Vendor")').click();
        await page.waitForTimeout(2000);
        await page.locator('h2.m_615af6c9.mantine-Modal-title').waitFor({ state: 'visible' });

        // ✅ Edit total price
        const totalCostCell = page.locator('div[row-index="0"] [role="gridcell"][col-id="total_price"]').last();
        await totalCostCell.dblclick();
        const costInput = page.locator('input[data-testid="bird-table-currency-input"]').first();
        await costInput.waitFor({ state: 'visible', timeout: 10000 });
        await costInput.fill('1000');

        page.once('dialog', async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept();
        });

        // ✅ Submit bid
        const submitButton = page.locator('button:has-text("Submit Bid")');
        await submitButton.click({ force: true });
        await page.waitForTimeout(3000);

        // ✅ Close modal
        const closeButton = page.locator('header.mantine-Modal-header button.mantine-Modal-close');
        await closeButton.waitFor({ state: 'visible', timeout: 10000 });
        await closeButton.click();

        // ✅ Save last visited URL
        const currentUrl = page.url();
        const urlFilePath = path.join(__dirname, '../data/lastVisitedUrl.json');
        fs.writeFileSync(urlFilePath, JSON.stringify({ lastUrl: currentUrl }, null, 2));
        Logger.success(`💾 Saved last visited URL: ${currentUrl}`);

        await context.storageState({ path: 'jobsessionState.json' }); // Save session
    });

    test.afterAll(async () => {
        if (context) {
            await context.close();
            Logger.success('🧹 Session saved and browser context closed successfully.');
        }
    });
});
