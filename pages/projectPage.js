const { expect } = require('@playwright/test');
const { Logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class ProjectPage {
    constructor(page) {
        this.page = page;

        // Locators
        this.projectsTab = page.locator('span.m_1f6ac4c4.mantine-NavLink-label', { hasText: 'Projects & Jobs' });
        this.modal = page.locator('section[role="dialog"][data-modal-content="true"]');
        this.modalTitle = page.getByRole('heading', { name: /Add project/i });

        // Modal fields
        this.nameInput = page.getByLabel('Name');
        this.propertyDropdown = page.getByRole('textbox', { name: 'Property' });
        this.descInput = page.getByLabel('Description');
        this.startDateInput = page.getByLabel('Start Date');
        this.endDateInput = page.getByLabel('End Date');

        // Buttons
        this.cancelBtn = page.getByRole('button', { name: 'Cancel' });
        this.addProjectBtn = page.getByRole('button', { name: /add project/i });
    }

    async navigateToProjects() {
        Logger.step('Navigating to "Projects & Jobs"...');
        await this.projectsTab.waitFor({ state: 'visible', timeout: 10000 });
        await this.projectsTab.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
        Logger.success('✅ Navigated to "Projects & Jobs" section.');
    }

    async openCreateProjectModal() {
        Logger.step('Opening Create Project modal...');
        await this.page.waitForLoadState('networkidle');

        await this.page.waitForLoadState('networkidle');
        const startTime = Date.now();
        await this.page.waitForSelector('input[placeholder="Search..."]', { state: 'visible' });
        const endTime = Date.now();
        const loadTime = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`⏱️ Project Page fully loaded in ${loadTime} seconds`);

        const createProjectBtn = this.page.locator(`button:has-text('Create Project')`);
        const count = await createProjectBtn.count();
        console.log(`ℹ️ Locator matched ${count} element(s).`);

        await expect(createProjectBtn).toBeVisible({ timeout: 5000 });
        Logger.success('✅ Create Project button is visible.');

        await createProjectBtn.waitFor({ state: 'visible' });
        await createProjectBtn.click();
        Logger.success('✅ Clicked on Create Project button.');

        await this.page.waitForTimeout(800);


        const modal = this.page.locator('section[role="dialog"][data-modal-content="true"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const modalTitle = this.page.getByRole('heading', { name: /Add project/i });
        await expect(modalTitle).toBeVisible({ timeout: 5000 });
        Logger.success(' "Add project" modal opened successfully.');
    }

    async verifyModalFields() {
        Logger.step('Verifying fields inside Add Project modal...');
        await expect(this.nameInput).toBeVisible();
        await expect(this.propertyDropdown).toBeVisible();
        await expect(this.descInput).toBeVisible();
        await expect(this.startDateInput).toBeVisible();
        await expect(this.endDateInput).toBeVisible();
        await expect(this.cancelBtn).toBeVisible();
        await expect(this.addProjectBtn).toBeVisible();
        Logger.success(' All modal fields and buttons are visible.');
    }

    generateRandomProjectName(prefix = 'Automa_Test') {
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        return `${prefix}_${date}_${random}`;
    }

    generateRandomEmail(prefix = 'sumit') {
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        return `${prefix}_${date}_${random}@gmail.com`;
    }

    get createdProjectName() {
        return this.page.locator(`.mantine-Grid-inner:has-text('Project Name')`);
    }

    get createdDescription() {
        return this.page.locator(`.mantine-Grid-inner:has-text('Description')`);
    }

    async assertProjectCreated(name, description) {
        const verifyText = async (locator, expectedText, label) => {
            Logger.step(`Verifying project ${label} "${expectedText}" is visible on the dashboard...`);

            const element = locator.locator(`p:has-text("${expectedText}")`).last();
            await element.waitFor({ state: 'visible' });
            await expect(element).toContainText(expectedText);

            const actualText = (await element.textContent())?.trim();
            expect(actualText).toBe(expectedText);

            Logger.success(`✅ Project ${label} "${expectedText}" is correctly visible on the dashboard.`);
        };

        await verifyText(this.createdProjectName, name, 'name');
        await verifyText(this.createdDescription, description, 'description');
    }

    // async getStartDate() {
    //     const today = new Date();

    //     const startDate = today.toLocaleDateString('en-GB', {
    //         day: 'numeric',
    //         month: 'long',
    //         year: 'numeric',
    //     });

    //     return startDate;
    // }

    // async getEndDate() {
    //     const today = new Date();
    //     const tomorrow = new Date(today);
    //     tomorrow.setDate(today.getDate() + 30);

    //     const endDate = tomorrow.toLocaleDateString('en-GB', {
    //         day: 'numeric',
    //         month: 'long',
    //         year: 'numeric',
    //     });

    //     return endDate;
    // }

    async getStartDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        return `${day}-${month}-${year}`;
    }

    async getEndDate() {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 30); // adds 30 days

        const day = String(endDate.getDate()).padStart(2, '0');
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const year = endDate.getFullYear();

        return `${day}-${month}-${year}`;
    }

    async fillProjectDetails({ name, property, description, startDate, endDate }) {
        Logger.step('Filling project details inside modal...');

        // 🔹 Generate random name and description
        const projectName = this.generateRandomProjectName();
        const randomDescription = `${description || 'Auto_Description'}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        await this.nameInput.fill(projectName);
        Logger.info(`Entered project name: ${projectName}`);

        await this.propertyDropdown.waitFor({ state: 'visible' });
        await this.propertyDropdown.click();
        await this.page.waitForTimeout(800);

        const firstOption = this.page.locator('div[data-combobox-option="true"]').first();
        await firstOption.waitFor({ state: 'visible' });
        await firstOption.click();
        Logger.info('Selected the first property from dropdown.');

        await this.descInput.fill(randomDescription);
        Logger.info(`Entered description: ${randomDescription}`);

        await this.startDateInput.type(startDate, { delay: 30 });
        await this.endDateInput.type(endDate, { delay: 30 });
        Logger.info(`Entered dates: ${startDate} → ${endDate}`);

        Logger.success('All modal fields filled successfully.');

        await expect(this.addProjectBtn).toBeVisible();
        await this.addProjectBtn.click();
        await expect(this.page).toHaveURL(/projects/);
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1500);
        Logger.success('Landed on property page successfully.');

        // ✅ Assert project is visible with correct data
        await this.assertProjectCreated(projectName, randomDescription);

        // ✅ Save data to JSON file
        const dataToSave = { projectName, description: randomDescription, createdAt: new Date().toISOString() };
        const filePath = path.join(__dirname, '../data/projectData.json');

        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath));
        }

        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        Logger.success(`Project data saved to: ${filePath}`);

        return { projectName, description: randomDescription };
    }

}

module.exports = { ProjectPage };
