require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/loginPage');
const { ProjectPage } = require('../pages/projectPage');
const { Logger } = require('../utils/logger');

let context, page, projectPage;

test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ storageState: 'sessionState.json' });
    page = await context.newPage();
    projectPage = new ProjectPage(page);

    await page.goto(process.env.DASHBOARD_URL, { waitUntil: 'load' });
    await expect(page).toHaveURL(process.env.DASHBOARD_URL);
    await page.waitForLoadState('networkidle');
});

test('User should be able to navigate to Projects tab', async () => {
    await projectPage.navigateToProjects();
});

test('User should be able to open the Create Project ', async () => {
    await projectPage.openCreateProjectModal();
    await projectPage.verifyModalFields();
});

test('User should be able to fill the Create Project form', async () => {
    const startDate = await projectPage.getStartDate();
    const endDate = await projectPage.getStartDate();
    await projectPage.fillProjectDetails({
        name: 'Automation Test Project',
        description: 'Created via Playwright automation',
        startDate: startDate,
        endDate: endDate,
    });
});

test.afterAll(async () => {
    await context.close();
});
