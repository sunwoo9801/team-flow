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
          // CI에서는 nest start --watch(SWC 감시 모드)의 자식 프로세스 stdio 전달이
          // 불안정해 컴파일 후 부트스트랩 로그 없이 멈추는 경우가 있어, 감시 모드 대신
          // 실제 빌드 후 실행(Dockerfile의 프로덕션 실행과 동일한 경로)으로 기동한다.
          command: 'npm run build --workspace=backend && npm run start --workspace=backend',
          cwd: '../',
          url: BACKEND_URL,
          timeout: 120_000,
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
