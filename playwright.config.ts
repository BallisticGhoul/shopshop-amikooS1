import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // auth tests share state — keep sequential
  retries: 0,
  reporter: [
    ['list'],
    ['@muuktest/amikoo-reporter']
  ],
  use: {
    baseURL: 'http://localhost:5173', // adjust if your dev server runs on a different port
    video: 'on',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
