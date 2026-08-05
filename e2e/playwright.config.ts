import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? 'http://localhost:3000';
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
  // CI에서는 백엔드를 Playwright의 webServer가 아니라 워크플로우 단계에서 직접
  // 빌드/기동하고 헬스체크까지 확인한 뒤 테스트를 실행한다 (Playwright의 webServer는
  // 실패 시 로그를 거의 보여주지 않아 디버깅이 어려웠음). 프론트엔드만 Playwright가 관리.
  webServer: CI
    ? [
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
