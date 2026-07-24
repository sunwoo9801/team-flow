# Team Flow

> 실시간 협업 칸반 보드 — NestJS + React 풀스택 SaaS 프로젝트

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs)](https://nestjs.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)](https://www.prisma.io)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socketdotio)](https://socket.io)
[![Playwright](https://img.shields.io/badge/Playwright-e2e-2EAD33?logo=playwright)](https://playwright.dev)
[![Storybook](https://img.shields.io/badge/Storybook-10.x-FF4785?logo=storybook)](https://storybook.js.org)

---

## 목차

- [프로젝트 소개](#프로젝트-소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [API 명세](#api-명세)
- [WebSocket 이벤트](#websocket-이벤트)
- [로컬 개발 환경 설정](#로컬-개발-환경-설정)
- [환경 변수](#환경-변수)
- [테스트 & 품질](#테스트--품질)
- [기술적 의사결정](#기술적-의사결정)
- [트러블슈팅](#트러블슈팅)
- [프로젝트 구조](#프로젝트-구조)
- [브랜치 전략](#브랜치-전략)

---

## 프로젝트 소개

Team Flow는 팀 단위 업무를 시각적으로 관리할 수 있는 칸반 기반 협업 툴입니다. Trello/Jira에서 영감을 받아, 실시간 동기화·이벤트 소싱 기반 활동 로그·라이브 커서 공유·S3 파일 업로드 등 실무 SaaS에서 요구되는 기능들을 백엔드(NestJS)와 프론트엔드(React) 양쪽 모두 직접 설계·구현했습니다.

현재는 로컬 Docker 환경 기준으로 완성된 프로젝트이며, 배포 파이프라인은 아직 구성 전입니다 (아래 [로컬 개발 환경 설정](#로컬-개발-환경-설정) 참고). 대신 GitHub Actions 기반 E2E 테스트 CI가 매 push/PR마다 로그인 → 보드 생성 → 드래그 앤 드롭 플로우를 자동 검증합니다.

---

## 주요 기능

### 인증 (Auth)

- 이메일/비밀번호 로컬 회원가입·로그인
- Google OAuth2 소셜 로그인
- JWT Access Token + Refresh Token 이중 인증 구조 (Refresh Token은 bcrypt 해시로 DB에 저장, 로테이션)
- HttpOnly 쿠키로 Refresh Token 관리 (XSS 방어)

### 워크스페이스 (Workspace)

- 워크스페이스 생성·수정·삭제
- 초대 링크(Invite Token) 발급 — 만료 시간·사용 여부 관리
- 역할 기반 접근 제어 (admin / member)

### 칸반 보드 (Kanban Board)

- 보드·컬럼·카드 전체 CRUD
- dnd-kit 기반 드래그 앤 드롭으로 카드/컬럼 순서 변경
- Optimistic Update — 서버 응답 전에 UI 선반영 후 실패 시 롤백
- WebSocket 실시간 동기화 — 같은 보드를 보는 모든 멤버에게 변경사항 즉시 반영

### 카드 Activity 로그 (Event Sourcing)

- 카드의 모든 변경사항을 이벤트로 기록 (생성·제목/설명 수정·이동·담당자/마감일 변경·댓글·첨부파일·라벨 등 12종)
- `metadata` JSON 필드에 `{ before, after }` 구조로 변경 전/후 값 저장
- Cursor-based 무한 스크롤 페이지네이션
- 이 이벤트 로그는 아래 **번다운 차트**와 **보드 스냅샷 복원**의 데이터 소스로도 재사용됩니다.

### 멘션 & 실시간 알림

- `Notification` 모델(수신자·발신자·타입·읽음 상태) + Socket.IO `userId → Set<socketId>` 맵으로 여러 탭에도 동시 push
- `@[이름](userId)` 멘션 직렬화 형식으로 프론트/백엔드가 통신, 표시 시 `@이름`으로 역직렬화 렌더링
- 담당자 지정·댓글 작성·멘션 시 자동 알림 생성
- 헤더의 알림 벨 — 읽음/안읽음 뱃지 + cursor 기반 무한 스크롤

### 카드 상세 — 댓글 & 첨부파일

- 댓글: cursor pagination, `@` 자동완성 멘션 입력, 낙관적 업데이트(임시 항목 선표시 → 서버 응답으로 교체), 멘션·담당자 알림 자동 연동
- 첨부파일: **AWS S3 presigned URL 3단계 업로드** (① presign 발급 → ② 브라우저가 S3에 직접 PUT → ③ 서버에 메타데이터 확정 등록), 다운로드는 presigned GET URL 발급 방식으로 비공개 버킷에서도 안전하게 서비스
- 모든 변경은 카드 Activity 로그에 자동 기록되고 Socket으로 실시간 반영

### 보드 필터 & 검색

- `?q=&assignee=&due=&label=` URL 쿼리 파라미터로 필터 상태 관리 (새로고침/공유해도 유지)
- 검색어 300ms 디바운스 + 제목·설명 매칭 하이라이트
- 담당자 다중 선택(미배정 포함), 마감일 5종(전체/기한초과/오늘/이번 주/없음), 라벨 다중 선택 복합 필터
- 클라이언트 사이드 `useMemo` 필터링 + 필터링된 카드 수 표시

### 라벨 시스템

- `Label` ↔ `Card` M:N 관계, 8색 팔레트
- 카드 상세에서 라벨 생성·부착·해제, 보드 카드에는 색상 pill로 표시
- 필터바에 라벨 다중 선택 연동

### 보드 히스토리 / 스냅샷 복원

- 현재 보드 상태(컬럼·카드·담당자·마감일·라벨)를 JSON 스냅샷으로 수동 저장
- 복원 시 트랜잭션으로 스냅샷 시점 상태를 upsert하고, 스냅샷 이후 새로 생긴 컬럼/카드는 삭제 — **Git의 `reset --hard`와 동일한 시맨틱**이므로 프론트에서 명시적 확인 다이얼로그로 되돌릴 수 없는 변경임을 경고

### 실시간 커서 공유

- 보드에 접속한 팀원의 마우스 위치를 Socket.IO로 브로드캐스트 (클라이언트 50ms 스로틀)
- 좌표를 보드 콘텐츠 영역 기준 백분율로 정규화해 전송 — 스크롤 위치·화면 크기가 달라도 커서가 서로 다른 사용자 화면에서 일관되게 정렬
- 4초 이상 갱신이 없으면 자동으로 제거 (연결 종료를 별도로 감지할 필요 없음)

### 대시보드 & 통계

- 컬럼별/담당자별 카드 분포 (Recharts Bar Chart)
- **번다운 차트** — CardActivity 이벤트 로그를 리플레이해 최근 14일간 누적 생성/완료 카드 수를 산출 (마지막 컬럼을 완료 기준으로 삼는 이벤트 소싱 기반 집계)
- `/workspace/:id/board/:id/dashboard` 라우트에서 확인

### E2E 테스트 & CI

- Playwright로 회원가입 → 워크스페이스/보드 생성 → 컬럼/카드 생성 → 드래그 앤 드롭까지 핵심 플로우 자동화
- GitHub Actions(`/.github/workflows/e2e.yml`)에서 Postgres 서비스 컨테이너 + 프론트/백엔드 dev 서버를 띄워 매 push/PR마다 실행
- 이 플로우는 S3(첨부파일) 엔드포인트를 호출하지 않으므로 CI에는 더미 AWS 자격증명만 사용 — 실제 AWS 키가 CI에 노출되거나 과금될 여지를 원천 차단

### Storybook 컴포넌트 문서화

- `frontend/.storybook` — Tailwind CSS, TanStack Query, React Router를 전역 데코레이터로 주입해 데이터 훅을 쓰는 컴포넌트도 바로 스토리 작성 가능
- `BoardFilterBar`(인터랙티브 컨트롤), `CursorOverlay`, `FilteredCardCount`, react-query 캐시를 시딩한 `NotificationBell` 스토리 제공

---

## 기술 스택

| 영역           | 기술                             | 선택 이유                                                    |
| -------------- | -------------------------------- | ------------------------------------------------------------- |
| 프론트엔드     | React 19, TypeScript             | 컴포넌트 기반 UI, 타입 안전성                                  |
| 상태 관리      | Zustand                          | 전역 상태는 최소화, 서버 상태는 TanStack Query로 분리          |
| 서버 상태      | TanStack Query                   | 캐싱·동기화·무한 스크롤·낙관적 업데이트를 선언적으로 처리      |
| 스타일링       | TailwindCSS v4                   | 유틸리티 기반으로 빠른 UI 구현                                 |
| 드래그 앤 드롭 | dnd-kit + 커스텀 훅 `useDnd.ts`  | 접근성 지원, Tree Shaking 가능한 경량 라이브러리               |
| 차트           | Recharts                         | 선언적 API, 대시보드 번다운/분포 차트 구현                     |
| 빌드           | Vite 8                           | 빠른 HMR, ESM 네이티브 지원                                    |
| 컴포넌트 문서화 | Storybook 10                    | 컴포넌트 단위 개발·시각적 회귀 확인                            |
| E2E 테스트     | Playwright                       | 실제 브라우저 기반 크로스 브라우징 테스트, CI 연동 용이        |
| 백엔드         | NestJS 11                        | 모듈 기반 구조, DI 컨테이너, 데코레이터 패턴                   |
| ORM            | Prisma 7                         | 타입 안전 쿼리, 마이그레이션 관리                              |
| 데이터베이스   | PostgreSQL 16                    | ACID 트랜잭션, JSON 컬럼 지원                                  |
| 파일 저장소    | AWS S3                           | Presigned URL로 서버를 거치지 않는 대용량 파일 업로드/다운로드 |
| 실시간         | Socket.IO                        | WebSocket 폴백 지원, Room 기반 브로드캐스트                    |
| 인증           | Passport.js (JWT, Google)        | NestJS 생태계 표준                                             |
| CI             | GitHub Actions                   | Postgres 서비스 컨테이너 + Playwright로 PR마다 자동 검증       |
| 인프라         | Docker Compose                   | 로컬 DB/Redis 환경 일관성 보장                                 |

> Redis 컨테이너는 `docker-compose.yml`에 준비되어 있으나, 현재 애플리케이션 코드에서는 아직 연결하지 않았습니다 (향후 세션/캐시 레이어로 확장 여지).

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (React 19)                        │
│  Zustand (auth/workspace) + TanStack Query (서버 상태)           │
│  Socket.IO Client (실시간/커서) + dnd-kit (D&D) + Recharts (통계)│
└──────────────────────────┬────────────────────────────────────────┘
                           │ HTTP (REST) / WebSocket
┌──────────────────────────▼────────────────────────────────────────┐
│                       NestJS API Server                            │
│ ┌─────────┐┌───────────┐┌───────┐┌────────┐┌──────────┐┌────────┐ │
│ │  Auth   ││ Workspace ││ Board ││ Kanban ││ Activity ││Notif.  │ │
│ │JWT+OAuth││ + Invite  ││ CRUD  ││Col/Card││(EventLog)││ +Socket│ │
│ └─────────┘└───────────┘└───────┘└────────┘└──────────┘└────────┘ │
│ ┌─────────┐┌───────────┐┌───────┐┌────────┐┌──────────┐          │
│ │ Comment ││ Attachment││ Label ││Snapshot││Dashboard │          │
│ │ +멘션    ││  (S3)     ││ (M:N) ││(Restore││ (집계)   │          │
│ └─────────┘└───────────┘└───────┘└────────┘└──────────┘          │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │     BoardGateway (Socket.IO + WsJwtGuard) — 보드 동기화/커서    │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────────────────────────┬────────────────┘
           │ Prisma ORM                            │ AWS SDK v3
┌──────────▼──────────┐                  ┌─────────▼──────────────┐
│   PostgreSQL 16      │                  │        AWS S3          │
│  (주 데이터 저장소)   │                  │  (첨부파일, presigned)  │
└──────────────────────┘                  └─────────────────────────┘
```

### 인증 플로우

```
[로컬 로그인]
Client → POST /auth/login
       ← Access Token (응답 body) + Refresh Token (HttpOnly Cookie)

Client → API 요청 (Authorization: Bearer <access_token>)
       ← 401 시 POST /auth/refresh → 새 Access Token 발급

[Google OAuth2]
Client → GET /auth/google → Google 동의 화면
       ← Redirect to /auth/google/callback
       ← Redirect to Frontend /auth/callback?token=...
```

### 첨부파일 업로드 플로우 (S3 Presigned URL)

```
Client → POST /cards/:id/attachments/presign  { fileName, mimeType, fileSize }
       ← { uploadUrl, key }                      (백엔드가 서명한 S3 PUT URL, 5분 유효)

Client → PUT <uploadUrl>  (파일 바이너리, S3로 직접 전송 — 서버를 거치지 않음)

Client → POST /cards/:id/attachments  { fileName, fileKey, mimeType, fileSize }
       ← Attachment 레코드 생성 + Activity 기록 + Socket 브로드캐스트

다운로드: GET /attachments/:id/download-url → presigned GET URL (5분 유효) 반환
```

---

## 데이터베이스 스키마

```
User ──< WorkspaceMember >── Workspace ──< Board ──< Column ──< Card
  │                                          │                   │
  │                                          ├──< Label >──(M:N)─┤
  │                                          └──< BoardSnapshot  │
  │                                                              │
  ├──< CardActivity >───────────────────────────────────────────┤
  ├──< Notification (received/sent) >────────────────────────────┤
  ├──< Comment >──────────────────────────────────────────────────┤
  └──< Attachment >─────────────────────────────────────────────── Card
```

### 핵심 설계 포인트

**Column/Card 정렬 — Lexicographic Float**

```sql
-- position: Float 컬럼, 앞뒤 값의 중간값으로 삽입
-- 예: 1000과 2000 사이에 삽입 → position = 1500
-- O(1) 삽입, 재정렬 불필요
@@index([boardId, position])  -- Column
@@index([columnId, position]) -- Card
```

**CardActivity — Event Sourcing 패턴**

```json
// metadata 구조 예시
{
  "field": "title",
  "before": "이전 제목",
  "after": "새 제목"
}
```

**Label — 암묵적 M:N (Prisma implicit many-to-many)**

```prisma
model Label {
  id      String @id @default(cuid())
  boardId String
  name    String
  color   String
  cards   Card[]   // 조인 테이블은 Prisma가 자동 생성/관리
}
```

**BoardSnapshot — 복원 가능한 JSON 스냅샷**

```json
// data 구조 예시
{
  "columns": [
    {
      "id": "col_1", "title": "Todo", "position": 1,
      "cards": [
        { "id": "card_1", "title": "...", "assigneeId": null, "labelIds": ["l1"] }
      ]
    }
  ]
}
```

---

## API 명세

### 인증

| Method | Path                        | 설명              | 인증 필요 |
| ------ | --------------------------- | ----------------- | --------- |
| POST   | `/api/auth/register`        | 회원가입          | ✗         |
| POST   | `/api/auth/login`           | 로그인            | ✗         |
| POST   | `/api/auth/refresh`         | 토큰 갱신         | ✗ (쿠키)  |
| POST   | `/api/auth/logout`          | 로그아웃          | ✓         |
| GET    | `/api/auth/google`          | Google OAuth 시작 | ✗         |
| GET    | `/api/auth/google/callback` | Google OAuth 콜백 | ✗         |

### 워크스페이스

| Method | Path                                   | 설명                 |
| ------ | --------------------------------------- | -------------------- |
| GET    | `/api/workspaces`                       | 내 워크스페이스 목록 |
| POST   | `/api/workspaces`                       | 워크스페이스 생성    |
| GET    | `/api/workspaces/:id`                   | 상세 조회            |
| PATCH  | `/api/workspaces/:id`                   | 수정                 |
| DELETE | `/api/workspaces/:id`                   | 삭제                 |
| POST   | `/api/workspaces/:id/invite`            | 초대 링크 생성       |
| POST   | `/api/workspaces/invite/:token/accept`  | 초대 토큰으로 참가   |

### 보드 / 칸반

| Method | Path                                     | 설명       |
| ------ | ----------------------------------------- | ---------- |
| GET    | `/api/workspaces/:wsId/boards`            | 보드 목록  |
| POST   | `/api/workspaces/:wsId/boards`            | 보드 생성  |
| GET    | `/api/boards/:boardId`                    | 보드 상세 (컬럼/카드 전체 트리) |
| PATCH  | `/api/boards/:boardId`                    | 보드 수정  |
| DELETE | `/api/boards/:boardId`                    | 보드 삭제  |
| POST   | `/api/boards/:boardId/columns`            | 컬럼 생성  |
| PATCH  | `/api/columns/:columnId`                  | 컬럼 수정  |
| PATCH  | `/api/columns/:columnId/move`             | 컬럼 이동  |
| DELETE | `/api/columns/:columnId`                  | 컬럼 삭제  |
| POST   | `/api/columns/:columnId/cards`            | 카드 생성  |
| PATCH  | `/api/cards/:cardId`                      | 카드 수정  |
| PATCH  | `/api/cards/:cardId/move`                 | 카드 이동  |
| DELETE | `/api/cards/:cardId`                      | 카드 삭제  |

### 활동 로그 / 알림

| Method | Path                             | 설명                           |
| ------ | --------------------------------- | ------------------------------ |
| GET    | `/api/cards/:cardId/activities`   | 카드 활동 로그 (cursor pagination) |
| GET    | `/api/notifications`              | 내 알림 목록 (cursor pagination) |
| GET    | `/api/notifications/unread-count` | 안읽은 알림 수                 |
| PATCH  | `/api/notifications/:id/read`     | 알림 읽음 처리                 |
| PATCH  | `/api/notifications/read-all`     | 전체 읽음 처리                 |

### 댓글 / 첨부파일

| Method | Path                                        | 설명                          |
| ------ | -------------------------------------------- | ----------------------------- |
| GET    | `/api/cards/:cardId/comments`                | 댓글 목록 (cursor pagination) |
| POST   | `/api/cards/:cardId/comments`                | 댓글 작성 (+ 멘션 알림)       |
| DELETE | `/api/comments/:commentId`                   | 댓글 삭제 (작성자만)          |
| GET    | `/api/cards/:cardId/attachments`             | 첨부파일 목록                 |
| POST   | `/api/cards/:cardId/attachments/presign`     | S3 presigned 업로드 URL 발급  |
| POST   | `/api/cards/:cardId/attachments`             | 업로드 완료 후 메타데이터 등록 |
| GET    | `/api/attachments/:attachmentId/download-url`| presigned 다운로드 URL 발급   |
| DELETE | `/api/attachments/:attachmentId`             | 첨부파일 삭제 (업로더만)      |

### 라벨 / 스냅샷 / 대시보드

| Method | Path                                   | 설명                       |
| ------ | ---------------------------------------- | -------------------------- |
| GET    | `/api/boards/:boardId/labels`            | 보드 라벨 목록             |
| POST   | `/api/boards/:boardId/labels`            | 라벨 생성                  |
| PATCH  | `/api/labels/:labelId`                   | 라벨 수정                  |
| DELETE | `/api/labels/:labelId`                   | 라벨 삭제                  |
| POST   | `/api/cards/:cardId/labels/:labelId`     | 카드에 라벨 부착           |
| DELETE | `/api/cards/:cardId/labels/:labelId`     | 카드에서 라벨 해제         |
| GET    | `/api/boards/:boardId/snapshots`         | 스냅샷 목록                |
| POST   | `/api/boards/:boardId/snapshots`         | 현재 상태 스냅샷 저장      |
| POST   | `/api/snapshots/:snapshotId/restore`     | 스냅샷 시점으로 복원       |
| DELETE | `/api/snapshots/:snapshotId`             | 스냅샷 삭제                |
| GET    | `/api/boards/:boardId/dashboard`         | 컬럼/담당자 분포 + 번다운  |

---

## WebSocket 이벤트

네임스페이스: `/boards` (JWT 인증 — `socket.handshake.auth.token`)

| 이벤트            | 방향 | 설명                                                              |
| ----------------- | ---- | ------------------------------------------------------------------ |
| `board:join`      | C→S  | 보드 Room 입장                                                    |
| `board:leave`     | C→S  | 보드 Room 퇴장                                                    |
| `cursor:move`     | C→S  | 커서 위치 전송 (50ms 클라이언트 스로틀)                            |
| `board:update`    | S→C  | `card:*` / `column:*` / `comment:*` / `attachment:*` / `label:*` / `board:restored` 이벤트를 감싼 브로드캐스트 |
| `notification`    | S→C  | 특정 유저에게만 실시간 알림 push                                   |
| `cursor:move`     | S→C  | 다른 팀원의 커서 위치 relay (본인 제외)                            |

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 22.x LTS
- Docker & Docker Compose
- Git

### 설치 및 실행

```bash
# 1. 레포지토리 클론
git clone https://github.com/sunwoo9801/team-flow.git
cd team-flow

# 2. 인프라 실행 (PostgreSQL + Redis)
docker-compose up -d

# 3. 루트에서 워크스페이스 의존성 일괄 설치 (backend/frontend/e2e)
npm install

# 4. 백엔드 마이그레이션 및 실행
cd backend
npx prisma migrate dev
npx prisma generate
npm run start:dev        # http://localhost:4000

# 5. 프론트엔드 실행 (새 터미널)
cd frontend
npm run dev              # http://localhost:3000
```

### E2E 테스트 실행

```bash
# 프론트/백엔드가 이미 로컬에서 떠 있는 상태에서
npm run test:e2e --workspace=e2e
```

### Storybook 실행

```bash
cd frontend
npm run storybook        # http://localhost:6006
```

---

## 환경 변수

### 백엔드 (`backend/.env`)

```env
# 데이터베이스
DATABASE_URL=postgresql://teamflow:teamflow1234@localhost:5432/teamflow?schema=public

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# AWS S3 (첨부파일 업로드)
AWS_REGION=eu-west-2
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# 서버
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### 프론트엔드 (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api
```

---

## 테스트 & 품질

| 항목             | 도구             | 범위                                                        |
| ---------------- | ---------------- | ------------------------------------------------------------ |
| E2E 테스트       | Playwright       | 회원가입 → 워크스페이스/보드 생성 → D&D (`e2e/tests`)         |
| CI               | GitHub Actions   | PR/push마다 Postgres 서비스 컨테이너 기동 후 E2E 자동 실행    |
| 컴포넌트 문서화  | Storybook        | 프레젠테이셔널 컴포넌트 + react-query 훅 컴포넌트 스토리 제공 |
| 타입 체크        | TypeScript strict| 프론트(`tsc -p tsconfig.app.json`), 백엔드(`tsc -p tsconfig.build.json`) |

CI에서는 첨부파일(S3) 엔드포인트를 호출하지 않는 플로우만 검증하며, `AWS_*` 환경변수에는 부팅용 더미 값만 주입합니다 — 실제 AWS 자격증명이 CI에 노출되거나 비용이 발생할 여지가 없습니다.

---

## 기술적 의사결정

### 1. Cursor-based Pagination vs Offset Pagination

Activity 로그·댓글·알림처럼 실시간으로 데이터가 추가되는 피드에서 offset 방식을 사용하면, 새 항목이 삽입될 때 페이지가 밀려 **중복 또는 누락**이 발생합니다.

```typescript
// cursor pagination 구현 핵심 (activity.service.ts / comment.service.ts / notification.service.ts 공통 패턴)
const items = await prisma.cardActivity.findMany({
  where: { cardId },
  take: limit + 1, // 1개 더 가져와서 다음 페이지 존재 여부 확인
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0, // cursor 항목 자체는 건너뜀
  orderBy: { createdAt: 'desc' },
});
const hasNextPage = items.length > limit;
const nextCursor = hasNextPage ? items[limit - 1].id : null;
```

### 2. Optimistic Update + 롤백 전략

카드 D&D, 댓글 작성 시 서버 응답을 기다리면 UI가 딜레이됩니다. TanStack Query의 `onMutate` / `onError` 훅으로 낙관적 업데이트와 롤백을 구현했습니다.

```typescript
onMutate: async (moveData) => {
  await queryClient.cancelQueries({ queryKey: ['boards', boardId] });
  const prev = queryClient.getQueryData(['boards', boardId]);
  queryClient.setQueryData(['boards', boardId], old => applyMove(old, moveData)); // UI 선반영
  return { prev };
},
onError: (_err, _vars, ctx) => {
  if (ctx?.prev) queryClient.setQueryData(['boards', boardId], ctx.prev); // 실패 시 롤백
},
```

### 3. Lexicographic Float 정렬

컬럼/카드 순서 변경 시마다 전체 position을 재계산하면 O(n) 업데이트가 발생합니다. 앞뒤 항목의 position 중간값을 사용하면 단일 레코드만 업데이트하면 됩니다.

```
삽입 전: [1000] ─── [2000] ─── [3000]
1000과 2000 사이에 삽입: position = (1000 + 2000) / 2 = 1500
삽입 후: [1000] ─── [1500] ─── [2000] ─── [3000]
```

### 4. WebSocket 인증 (`ws-jwt.guard.ts`)

HTTP 요청과 달리 WebSocket handshake는 Authorization 헤더를 지원하지 않는 경우가 있습니다. Socket.IO의 `auth` 옵션으로 토큰을 전달받아 NestJS Guard에서 검증합니다.

```typescript
// 클라이언트
const socket = io(WS_URL, { auth: { token: accessToken } });

// afterInit — 연결 시점에 JWT 검증 후 socket.data.userId 세팅
// 이후 userId → Set<socketId> 맵으로 여러 탭에도 동시 알림 push
```

### 5. Event Sourcing 패턴의 재사용 — 활동 로그 · 번다운 · 스냅샷

카드 상태를 직접 스냅샷으로 저장하는 대신 **변경 이벤트**(`CardActivity`)만 누적하는 설계를 세 곳에서 재사용했습니다.

- **활동 로그**: `before`/`after`를 그대로 타임라인으로 렌더링
- **번다운 차트**: `CARD_MOVED` 이벤트 중 "완료 컬럼으로 이동"한 시점을 리플레이해 일자별 누적 완료 수를 역산
- **보드 스냅샷**: 매 순간의 완전한 상태를 별도로 `BoardSnapshot.data`에 JSON으로 저장해두고, 복원 시점에는 트랜잭션으로 upsert — 세밀한 이벤트 리플레이 대신 스냅샷을 택한 이유는 `Card`의 `onDelete: Cascade`로 댓글/첨부파일까지 함께 삭제되는 구조상, 삭제된 카드의 활동 이력만으로는 과거 상태를 완전히 재구성할 수 없기 때문입니다.

### 6. S3 Presigned URL 3단계 업로드

서버가 파일 바이너리를 직접 받아 S3로 프록시하면 서버 메모리·대역폭을 낭비하고 업로드 속도도 느려집니다. presigned URL 방식으로 브라우저가 S3에 직접 업로드하도록 하고, 서버는 (1) 업로드 권한 발급 (2) 메타데이터 확정 등록 (3) 다운로드 시 presigned GET 발급까지만 담당합니다. 버킷은 비공개로 유지하면서도 5분 만료의 서명 URL로 접근을 제한합니다.

### 7. 실시간 커서 좌표 정규화

마우스 좌표를 픽셀 값으로 그대로 전송하면 보낸 사람과 받는 사람의 화면 크기·스크롤 위치가 다를 때 커서 위치가 어긋납니다. 보드 콘텐츠 영역의 `getBoundingClientRect()` 기준 백분율(0~1)로 정규화해서 전송하고, 수신 측에서는 동일한 비율을 자신의 컨테이너에 적용해 렌더링합니다 — 별도의 좌표 변환 로직 없이 CSS `%` 포지셔닝만으로 해결됩니다.

---

## 트러블슈팅

### Q. NestJS 서버 구동 시 `Cannot find module '@prisma/client'` 오류

```bash
cd backend
npx prisma generate
npm run build
```

Prisma Client는 `generate` 명령 후 `node_modules/@prisma/client`에 생성됩니다. 스키마 변경 후에는 반드시 재실행이 필요합니다.

### Q. Google OAuth 콜백 후 `redirect_uri_mismatch` 오류

Google Cloud Console → OAuth 2.0 클라이언트 → 승인된 리디렉션 URI에 아래 주소를 추가하세요.

```
http://localhost:4000/api/auth/google/callback
```

### Q. Docker 컨테이너 재시작 후 DB 연결 실패

```bash
docker-compose down -v   # 볼륨 포함 삭제 (데이터 초기화됨)
docker-compose up -d
cd backend && npx prisma migrate dev
```

### Q. Socket.IO 연결이 즉시 끊기는 경우

`backend/src/main.ts`의 CORS 설정과 `FRONTEND_URL` 환경변수가 프론트엔드 실제 origin과 일치하는지 확인하세요. WebSocket도 동일한 origin이 허용되어 있어야 합니다.

### Q. 카드 첨부파일 업로드 시 403/CORS 오류

S3 버킷의 CORS 설정에 프론트엔드 origin(`PUT`, `GET` 메서드)이 허용되어 있는지 확인하세요. presigned URL이 만료(5분)되었을 가능성도 있습니다 — 업로드 버튼을 다시 눌러 새 URL을 발급받으세요.

### Q. 보드 스냅샷을 복원했더니 최근 댓글/첨부파일이 사라졌어요

의도된 동작입니다. 스냅샷 복원은 해당 시점 이후의 모든 변경(새 카드, 댓글, 첨부파일 포함)을 되돌립니다. 복원 전 히스토리 패널에서 한 번 더 확인 다이얼로그가 뜨는 이유이기도 합니다.

### Q. Prisma migrate 시 `P3006` 오류 (마이그레이션 실패)

```bash
npx prisma migrate resolve --rolled-back "migration_name"
npx prisma migrate dev
```

---

## 프로젝트 구조

```
team-flow/
├── backend/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── auth/                ← JWT + Google OAuth2
│   │   ├── workspace/           ← 워크스페이스 + 초대 링크
│   │   ├── board/               ← 보드 CRUD
│   │   ├── kanban/              ← Column / Card
│   │   ├── activity/            ← Event Sourcing 활동 로그
│   │   ├── notification/        ← 알림 + 멘션 파서
│   │   ├── comment/             ← 댓글 (+ 멘션 연동)
│   │   ├── attachment/          ← S3 presigned 업로드/다운로드
│   │   ├── label/                ← 라벨 (M:N)
│   │   ├── snapshot/             ← 보드 스냅샷/복원
│   │   ├── dashboard/            ← 집계/번다운 API
│   │   ├── gateway/              ← Socket.IO (보드 동기화 + 커서)
│   │   └── prisma/
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── frontend/
│   ├── .storybook/               ← Storybook 설정 (전역 데코레이터)
│   ├── src/
│   │   ├── api/                  ← axios 인스턴스 + 도메인별 API 함수
│   │   ├── components/
│   │   │   ├── activity/         ← CardActivityFeed
│   │   │   ├── board/            ← BoardFilterBar, HistoryPanel, CursorOverlay 등
│   │   │   ├── card/              ← CardDetailModal, CommentSection, AttachmentSection, LabelPicker
│   │   │   ├── notification/     ← NotificationBell
│   │   │   └── layout/
│   │   ├── hooks/                ← useAuth, useKanban, useSocket, useDnd, useComments, useLabels, useSnapshots, useDashboard 등
│   │   ├── pages/
│   │   │   ├── auth/ · board/ (BoardPage, BoardNewPage, BoardDashboardPage) · invite/ · workspace/
│   │   ├── router/
│   │   ├── store/                ← Zustand (auth, workspace)
│   │   └── utils/
│   └── .env
├── e2e/                           ← Playwright E2E 테스트 워크스페이스
│   ├── playwright.config.ts
│   └── tests/
├── .github/workflows/e2e.yml      ← CI: PR/push마다 E2E 자동 실행
└── docker-compose.yml
```

---

## 브랜치 전략

```
main          ← 프로덕션 배포 브랜치
develop       ← 통합 개발 브랜치
feature/*     ← 기능 개발 (feature/card-activity-log, feature/mention-notification 등)
fix/*         ← 버그 수정
```

---

## 라이선스

MIT License © 2026 Team Flow
