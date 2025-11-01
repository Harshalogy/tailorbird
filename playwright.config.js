const { defineConfig, devices } = require('@playwright/test');
const { execSync } = require('child_process');

process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 100 * 1000,
  retries: 0,
  workers:1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 55 * 1000,

    // ✅ Capture artifacts for failed tests only
    screenshot: 'only-on-failure',

    // ✅ Video only for failed cases
    video: 'retain-on-failure',

    // 🚫 Trace disabled
    trace: 'off',

    // ✅ Store all artifacts here
    outputDir: 'test-results/',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  
});
