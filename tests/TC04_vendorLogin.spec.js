require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/loginPage');
const { Logger } = require('../utils/logger');

test.describe('Tailorbird Login and Bid Acceptance Flow', () => {
    let context;
    let page;
    let login;
    let projectData;
    let projectName;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
        login = new LoginPage(page);
    });

    test('User should be able to login with valid credentials & store session', async () => {
        Logger.info('Starting Tailorbird login test...');

        await test.step('Go to login page', async () => {
            Logger.step('Navigating to login URL...');
            await page.goto(process.env.LOGIN_URL, { waitUntil: 'load' });
        });

        await test.step('Perform login', async () => {
            Logger.step('Using credentials from .env...');
            await login.login(process.env.VENDOR_EMAIL, process.env.VENDOR_PASSWORD);
        });

        await test.step('Verify login success', async () => {
            Logger.step('Checking redirected dashboard URL...');
            await expect(page).toHaveURL(process.env.DASHBOARD_URL);
            Logger.success('User logged in successfully!');
        });

        await test.step('Store Session', async () => {
            await page.context().storageState({ path: 'Vendor_sessionState.json' });
            Logger.success('💾 Session stored successfully at Vendor_sessionState.json');
        });
    });

    test('User should be able to navigate to Bids & Contracts and open a project', async () => {
        const bidsAndContractsLink = page.locator('a:has-text("Bids & Contracts")');
        await bidsAndContractsLink.waitFor({ state: 'visible', timeout: 10000 });
        await bidsAndContractsLink.click();
        await page.waitForTimeout(5000);
        await page.waitForSelector('input[placeholder="Search..."]', {
            state: 'visible',
            timeout: 30000,
        });

        // ✅ Load project data dynamically
        const filePath = path.join(__dirname, '../data/projectData.json');
        projectData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        projectName = projectData.projectName;

        await page.locator(`input[placeholder="Search..."]`).fill(projectName);
        await page.getByText(projectName, { exact: true }).click();
        await page.waitForLoadState('networkidle');

        const backButton = page.locator('button:has-text("Back")');
        await backButton.waitFor({ state: 'visible', timeout: 10000 });

        console.log('✅ Back button is now visible on the page');
    });

    test('User should be able to accept bid and edit total price', async () => {
        // Handle confirmation dialog early


        // Locate and click "Accept Bid"
        const acceptBidButtons = page.locator('button:has-text("Accept Bid")');
        if (await acceptBidButtons.isVisible()) {
            page.once('dialog', async (dialog) => {
                console.log(`Dialog message: ${dialog.message()}`);
                await dialog.accept();
            });
            
            await acceptBidButtons.click();
        }
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);
        // ✅ Edit bid amount in total price column
        const totalCostCell = page.locator(
            'div[row-index="0"] [role="gridcell"][col-id="total_price"]'
        ).last();
        await totalCostCell.dblclick();

        const costInput = page.locator('input[data-testid="bird-table-currency-input"]').first();
        await costInput.waitFor({ state: 'visible', timeout: 10000 });
        await costInput.fill('2000');
    });

    test('User should be able to submit bid successfully', async () => {
        await page.waitForTimeout(2000);

        page.once('dialog', async (dialog) => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept();
        });

        const submitButton = page.locator('button:has-text("Submit Bid")');
        await submitButton.click({ force: true });
        await page.waitForTimeout(2000);
    });

    test.afterAll(async () => {
        await context.close();
        Logger.success('🧹 Browser context closed successfully.');
    });
});
