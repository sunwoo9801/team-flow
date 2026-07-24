import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? 'http://localhost:3000';
const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:4000/api';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: CI ? 1 : 0,
  workers: 1,
  reporter: CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: CI
    ? [
        {
          command: 'npm run start:dev --workspace=backend',
          cwd: '../',
          url: BACKEND_URL,
          timeout: 60_000,
          reuseExistingServer: false,
        },
        {
          command: 'npm run dev --workspace=frontend',
          cwd: '../',
          url: FRONTEND_URL,
          timeout: 60_000,
          reuseExistingServer: false,
        },
      ]
    : undefined, // 로컬 실행 시엔 이미 떠 있는 dev 서버를 그대로 사용
});
