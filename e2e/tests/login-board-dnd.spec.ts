import { test, expect, type Page } from '@playwright/test';

// AWS 관련 요청(첨부파일 업로드)은 이 플로우에서 전혀 호출되지 않으므로
// 별도 mocking 없이도 S3/과금 이슈가 발생하지 않는다.

async function dragTo(page: Page, source: string, target: string) {
  const sourceBox = await page.locator(source).boundingBox();
  const targetBox = await page.locator(target).boundingBox();
  if (!sourceBox || !targetBox) throw new Error('드래그 대상 요소를 찾을 수 없습니다.');

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // dnd-kit PointerSensor의 activation distance(5px)를 넘기기 위해 여러 단계로 이동
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      startX + ((endX - startX) * i) / steps,
      startY + ((endY - startY) * i) / steps
    );
  }
  await page.mouse.up();
}

test('로그인 → 보드 생성 → 드래그앤드롭 플로우', async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-${stamp}@example.com`;
  const password = 'password1234';
  const workspaceName = `E2E 워크스페이스 ${stamp}`;
  const boardTitle = `E2E 보드 ${stamp}`;

  // ── 회원가입 (신규 유저로 로그인까지 한 번에) ──
  await page.goto('/register');
  await page.getByPlaceholder('홍길동').fill('E2E 테스터');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('8자 이상').fill(password);
  await page.getByPlaceholder('동일하게 입력').fill(password);
  await page.getByRole('button', { name: '회원가입' }).click();

  await page.waitForURL('**/workspace');

  // ── 워크스페이스 생성 ──
  await page.getByRole('button', { name: '첫 워크스페이스 만들기' }).click();
  await page.waitForURL('**/workspace/new');
  await page.getByPlaceholder(/마케팅팀/).fill(workspaceName);
  await page.getByRole('button', { name: '워크스페이스 만들기' }).click();

  await page.waitForURL(
    url => /\/workspace\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/new')
  );

  // ── 보드 생성 ──
  await page.getByRole('button', { name: '첫 번째 보드 만들기 →' }).click();
  await page.waitForURL('**/board/new');
  await page.getByPlaceholder(/Sprint 1/).fill(boardTitle);
  await page.getByRole('button', { name: '보드 만들기' }).click();

  await page.waitForURL(
    url => /\/board\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/new')
  );

  // ── 컬럼 2개 생성 ──
  for (const columnName of ['Todo', 'Done']) {
    await page.getByRole('button', { name: '컬럼 추가' }).click();
    await page.getByPlaceholder('컬럼 이름 입력 후 Enter').fill(columnName);
    await page.keyboard.press('Enter');
    await expect(
      page.locator('[data-testid="board-column"][data-column-name="' + columnName + '"]')
    ).toBeVisible();
  }

  // ── Todo 컬럼에 카드 생성 ──
  const cardName = `테스트 카드 ${stamp}`;
  const todoColumn = page.locator('[data-testid="board-column"][data-column-name="Todo"]');
  await todoColumn.getByRole('button', { name: '카드 추가' }).click();
  await page.getByPlaceholder('카드 이름 입력 후 Enter').fill(cardName);
  await page.keyboard.press('Enter');

  const card = page.locator(`[data-testid="board-card"][data-card-name="${cardName}"]`);
  await expect(card).toBeVisible();
  await expect(todoColumn).toContainText(cardName);

  // ── Todo → Done 드래그앤드롭 ──
  const doneColumn = page.locator('[data-testid="board-column"][data-column-name="Done"]');
  await dragTo(
    page,
    `[data-testid="board-card"][data-card-name="${cardName}"]`,
    '[data-testid="board-column"][data-column-name="Done"]'
  );

  await expect(doneColumn).toContainText(cardName);
  await expect(todoColumn).not.toContainText(cardName);
});
