# Team Flow

> 실시간 협업 칸반 보드 — NestJS + React 풀스택 SaaS 프로젝트

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs)](https://nestjs.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma)](https://www.prisma.io)

---

## 목차

- [프로젝트 소개](#프로젝트-소개)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [아키텍처](#아키텍처)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [API 명세](#api-명세)
- [로컬 개발 환경 설정](#로컬-개발-환경-설정)
- [환경 변수](#환경-변수)
- [기술적 의사결정](#기술적-의사결정)
- [트러블슈팅](#트러블슈팅)
- [프로젝트 구조](#프로젝트-구조)

---

## 프로젝트 소개

Team Flow는 팀 단위 업무를 시각적으로 관리할 수 있는 칸반 기반 협업 툴입니다. Trello/Jira에서 영감을 받아, 실시간 동기화·초대 링크·카드 활동 로그 등 실무 SaaS에서 필요한 핵심 기능들을 직접 설계하고 구현했습니다.

**배포 주소**

- Frontend: [https://team-flow.vercel.app](https://team-flow.vercel.app)
- Backend API: [https://team-flow-api.railway.app](https://team-flow-api.railway.app)

---

## 주요 기능

### 인증 (Auth)

- 이메일/비밀번호 로컬 회원가입·로그인
- Google OAuth2 소셜 로그인
- JWT Access Token + Refresh Token 이중 인증 구조
- HttpOnly 쿠키로 Refresh Token 관리 (XSS 방어)

### 워크스페이스 (Workspace)

- 워크스페이스 생성·수정·삭제
- 초대 링크(Invite Token) 발급 — 만료 시간·사용 여부 관리
- 역할 기반 접근 제어 (admin / member)

### 칸반 보드 (Kanban Board)

- 보드·컬럼·카드 전체 CRUD
- 드래그 앤 드롭으로 카드/컬럼 순서 변경
- Optimistic Update — 서버 응답 전에 UI 선반영 후 실패 시 롤백
- WebSocket 실시간 동기화 — 같은 보드를 보는 모든 멤버에게 변경사항 즉시 반영

### 카드 Activity 로그

- 카드의 모든 변경사항 이벤트 기록 (생성·제목 수정·이동·담당자 변경 등)
- 변경 전/후 값(`before`/`after`) JSON으로 저장
- Cursor-based 무한 스크롤 페이지네이션

### Event Sourcing 패턴 적용
카드의 모든 변경사항을 `CardActivity` 테이블에 이벤트로 기록합니다.
`metadata` JSON 필드에 `{ before, after }` 구조로 변경 전/후 값을 저장해
"누가, 언제, 무엇을, 어떻게 바꿨는지" 완전한 감사 추적이 가능합니다.

### Cursor-based Pagination
offset 방식은 데이터 삽입 시 페이지 밀림 문제가 발생합니다.
Activity 피드처럼 실시간으로 추가되는 데이터에는 마지막 항목의 ID를
커서로 사용하는 cursor pagination이 더 안정적입니다.

### 실시간 알림 전달 전략
SSE와 WebSocket 중 WebSocket을 선택했습니다.
이미 칸반 실시간 동기화에 Socket.IO가 연결되어 있으므로,
별도 연결 없이 `userId → socketId` 맵으로 특정 유저에게 직접 push합니다.
한 유저가 여러 탭을 열어도 `Set<socketId>` 구조로 모든 탭에 전달됩니다.

### @mention 직렬화 형식
프론트에서 `@[이름](userId)` 형식으로 직렬화 후 전송,
백엔드에서 동일 정규식으로 파싱하여 userId를 추출합니다.
표시할 때는 `@이름`으로 역직렬화하여 렌더링합니다.
---

## 기술 스택

| 영역           | 기술                            | 선택 이유                                             |
| -------------- | ------------------------------- | ----------------------------------------------------- |
| 프론트엔드     | React 18, TypeScript            | 컴포넌트 기반 UI, 타입 안전성                         |
| 상태 관리      | Zustand                         | 전역 상태는 최소화, 서버 상태는 TanStack Query로 분리 |
| 서버 상태      | TanStack Query                  | 캐싱·동기화·무한 스크롤을 선언적으로 처리             |
| 스타일링       | TailwindCSS                     | 유틸리티 기반으로 빠른 UI 구현                        |
| 드래그 앤 드롭 | dnd-kit + 커스텀 훅 `useDnd.ts` | 접근성 지원, Tree Shaking 가능한 경량 라이브러리      |
| 빌드           | Vite 6.x                        | 빠른 HMR, ESM 네이티브 지원                           |
| 백엔드         | NestJS 11.x                     | 모듈 기반 구조, DI 컨테이너, 데코레이터 패턴          |
| ORM            | Prisma 6.x                      | 타입 안전 쿼리, 마이그레이션 관리                     |
| 데이터베이스   | PostgreSQL 16                   | ACID 트랜잭션, JSON 컬럼 지원                         |
| 캐시           | Redis 7                         | Refresh Token 블랙리스트, 세션 관리                   |
| 실시간         | Socket.IO                       | WebSocket 폴백 지원, Room 기반 브로드캐스트           |
| 인증           | Passport.js (JWT, Google)       | NestJS 생태계 표준                                    |
| 배포           | Vercel (FE), Railway (BE)       | 무료 티어, GitHub 연동 자동 배포                      |
| 인프라         | Docker Compose                  | 로컬 DB/Redis 환경 일관성 보장                        |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Client (React)                      │
│  Zustand (auth/workspace) + TanStack Query (서버 상태)   │
│  Socket.IO Client (실시간) + dnd-kit (D&D)               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (REST) / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   NestJS API Server                      │
│  ┌───────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐ │
│  │  AuthModule│ │Workspace │ │ Board  │ │   Kanban    │ │
│  │ JWT+OAuth  │ │ + Invite │ │  CRUD  │ │ Column/Card │ │
│  └───────────┘ └──────────┘ └────────┘ └─────────────┘ │
│  ┌──────────────────────────────────────────────────┐   │
│  │            ActivityModule (Event Log)             │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         BoardGateway (Socket.IO + WsJwtGuard)     │   │
│  └──────────────────────────────────────────────────┘   │
└──────────┬──────────────────────────┬───────────────────┘
           │ Prisma ORM               │ ioredis
┌──────────▼──────────┐   ┌───────────▼───────────────────┐
│   PostgreSQL 16      │   │         Redis 7               │
│  (주 데이터 저장소)   │   │  (Refresh Token 블랙리스트)    │
└─────────────────────┘   └───────────────────────────────┘
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

---

## 데이터베이스 스키마

```
User ──< WorkspaceMember >── Workspace ──< Board ──< Column ──< Card
                                │
                                └──< InviteToken

Card ──< CardActivity >── User
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

| Method | Path                          | 설명                 |
| ------ | ----------------------------- | -------------------- |
| GET    | `/api/workspaces`             | 내 워크스페이스 목록 |
| POST   | `/api/workspaces`             | 워크스페이스 생성    |
| GET    | `/api/workspaces/:id`         | 상세 조회            |
| PATCH  | `/api/workspaces/:id`         | 수정                 |
| DELETE | `/api/workspaces/:id`         | 삭제                 |
| POST   | `/api/workspaces/:id/invite`  | 초대 링크 생성       |
| POST   | `/api/workspaces/join/:token` | 초대 토큰으로 참가   |

### 보드 / 칸반

| Method | Path                                    | 설명                          |
| ------ | --------------------------------------- | ----------------------------- |
| GET    | `/api/workspaces/:wsId/boards`          | 보드 목록                     |
| POST   | `/api/workspaces/:wsId/boards`          | 보드 생성                     |
| GET    | `/api/boards/:boardId/columns`          | 컬럼 목록                     |
| POST   | `/api/boards/:boardId/columns`          | 컬럼 생성                     |
| PATCH  | `/api/boards/:boardId/columns/:id/move` | 컬럼 이동                     |
| GET    | `/api/columns/:columnId/cards`          | 카드 목록                     |
| POST   | `/api/columns/:columnId/cards`          | 카드 생성                     |
| PATCH  | `/api/columns/:columnId/cards/:id`      | 카드 수정                     |
| PATCH  | `/api/columns/:columnId/cards/:id/move` | 카드 이동                     |
| GET    | `/api/cards/:cardId/activities`         | 활동 로그 (cursor pagination) |

### WebSocket 이벤트

| 이벤트          | 방향 | 설명                        |
| --------------- | ---- | --------------------------- |
| `joinBoard`     | C→S  | 보드 Room 입장              |
| `leaveBoard`    | C→S  | 보드 Room 퇴장              |
| `cardMoved`     | S→C  | 카드 이동 브로드캐스트      |
| `cardUpdated`   | S→C  | 카드 내용 변경 브로드캐스트 |
| `columnCreated` | S→C  | 컬럼 생성 브로드캐스트      |

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 22.x LTS
- Docker & Docker Compose
- Git

### 설치 및 실행

```bash
# 1. 레포지토리 클론
git clone https://github.com/your-username/team-flow.git
cd team-flow

# 2. 인프라 실행 (PostgreSQL + Redis)
docker-compose up -d

# 3. 백엔드 의존성 설치 및 실행
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run start:dev        # http://localhost:4000

# 4. 프론트엔드 의존성 설치 및 실행 (새 터미널)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

### 시드 데이터 삽입 (선택)

```bash
cd backend
npx prisma db seed
```

---

## 환경 변수

### 백엔드 (`backend/.env`)

```env
# 데이터베이스
DATABASE_URL=postgresql://postgres:password@localhost:5432/teamflow
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=teamflow

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# 서버
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 프론트엔드 (`frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4000
```

---

## 기술적 의사결정

### 1. Cursor-based Pagination vs Offset Pagination

Activity 로그처럼 실시간으로 데이터가 추가되는 피드에서 offset 방식을 사용하면, 새 항목이 삽입될 때 페이지가 밀려 **중복 또는 누락**이 발생합니다.

```
Offset 방식의 문제:
1페이지(0~19) 조회 후 새 항목 삽입 →
2페이지(20~39) 조회 시 기존 20번째 항목이 21번으로 밀려 중복 노출

Cursor 방식:
마지막으로 받은 항목의 id를 커서로 사용 →
삽입과 무관하게 항상 정확한 다음 페이지 조회
```

```typescript
// cursor pagination 구현 핵심
const activities = await prisma.cardActivity.findMany({
  where: { cardId },
  take: limit + 1, // 1개 더 가져와서 다음 페이지 존재 여부 확인
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0, // cursor 항목 자체는 건너뜀
  orderBy: { createdAt: 'desc' },
});
const hasNextPage = activities.length > limit;
const nextCursor = hasNextPage ? activities[limit - 1].id : null;
```

### 2. Optimistic Update + 롤백 전략

카드 D&D 시 서버 응답을 기다리면 UI가 딜레이됩니다. TanStack Query의 `onMutate` / `onError` 훅으로 낙관적 업데이트와 롤백을 구현했습니다.

```typescript
// useKanban.ts 핵심 패턴
onMutate: async (moveData) => {
  await queryClient.cancelQueries({ queryKey: ['columns', boardId] });
  const previousData = queryClient.getQueryData(['columns', boardId]);

  // UI 선반영
  queryClient.setQueryData(['columns', boardId], (old) => applyMove(old, moveData));

  return { previousData }; // 롤백용 스냅샷 반환
},
onError: (err, moveData, context) => {
  // 실패 시 이전 상태로 복원
  queryClient.setQueryData(['columns', boardId], context.previousData);
  toast.error('이동에 실패했습니다. 다시 시도해주세요.');
},
```

### 3. Lexicographic Float 정렬

컬럼/카드 순서 변경 시마다 전체 position을 재계산하면 O(n) 업데이트가 발생합니다. 앞뒤 항목의 position 중간값을 사용하면 단일 레코드만 업데이트하면 됩니다.

```
삽입 전: [1000] ─── [2000] ─── [3000]
1000과 2000 사이에 삽입: position = (1000 + 2000) / 2 = 1500
삽입 후: [1000] ─── [1500] ─── [2000] ─── [3000]

position이 너무 가까워지면 (차이 < 1) rebalancing 실행
```

### 4. WebSocket 인증 (`ws-jwt.guard.ts`)

HTTP 요청과 달리 WebSocket handshake는 Authorization 헤더를 지원하지 않는 경우가 있습니다. Socket.IO의 `auth` 옵션으로 토큰을 전달받아 NestJS Guard에서 검증합니다.

```typescript
// 클라이언트
const socket = io(WS_URL, {
  auth: { token: accessToken },
});

// WsJwtGuard
const token =
  client.handshake.auth?.token ?? client.handshake.headers?.authorization?.split(' ')[1];
```

### 5. Event Sourcing 패턴 (`CardActivity`)

카드 상태를 직접 스냅샷으로 저장하는 대신, **변경 이벤트**만 누적합니다. 이 방식은 Undo/Redo, 감사 로그, 타임라인 뷰 등 다양한 기능을 동일한 데이터로 구현할 수 있는 기반이 됩니다.

```
CARD_CREATED        → { after: { title: "카드명" } }
CARD_TITLE_UPDATED  → { before: "이전 제목", after: "새 제목" }
CARD_MOVED          → { before: { columnId: "col_A" }, after: { columnId: "col_B" } }
CARD_ASSIGNEE_CHANGED → { before: null, after: { id: "user_1", name: "홍길동" } }
```

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
http://localhost:4000/api/auth/google/callback  (개발)
https://your-api.railway.app/api/auth/google/callback  (프로덕션)
```

### Q. Docker 컨테이너 재시작 후 DB 연결 실패

```bash
docker-compose down -v   # 볼륨 포함 삭제 (데이터 초기화됨)
docker-compose up -d
cd backend && npx prisma migrate dev
```

### Q. Socket.IO 연결이 즉시 끊기는 경우

CORS 설정 확인:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') ?? 'http://localhost:3000',
  credentials: true,
});
```

WebSocket도 동일한 origin이 허용되어 있어야 합니다.

### Q. 카드 D&D 후 position 값이 소수점이 너무 깊어지는 경우

position 차이가 임계값(기본 1) 미만이 되면 rebalancing을 실행합니다:

```typescript
// column.service.ts / card.service.ts
if (Math.abs(after - before) < 1) {
  await this.rebalancePositions(boardId); // 1000 간격으로 재배치
}
```

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
│   │   ├── activity/            ← Event Sourcing 활동 로그
│   │   │   ├── activity.controller.ts
│   │   │   ├── activity.service.ts
│   │   │   ├── activity.helper.ts
│   │   │   └── activity.module.ts
│   │   ├── auth/                ← JWT + Google OAuth2
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   └── strategies/
│   │   ├── board/
│   │   ├── gateway/             ← Socket.IO WebSocket
│   │   ├── kanban/              ← Column / Card
│   │   ├── prisma/
│   │   └── workspace/
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── frontend/
│   ├── src/
│   │   ├── api/                 ← axios 인스턴스 + API 함수
│   │   ├── components/
│   │   │   ├── activity/        ← CardActivityFeed
│   │   │   └── layout/
│   │   ├── hooks/               ← useAuth, useKanban, useSocket, useDnd, useActivity
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── board/
│   │   │   ├── invite/
│   │   │   └── workspace/
│   │   ├── router/
│   │   ├── store/               ← Zustand (auth, workspace)
│   │   └── utils/
│   └── .env
└── docker-compose.yml
```

---

## 브랜치 전략

```
main          ← 프로덕션 배포 브랜치
develop       ← 통합 개발 브랜치
feature/*     ← 기능 개발 (feature/card-activity-log 등)
fix/*         ← 버그 수정
```

---

## 라이선스

MIT License © 2025 Team Flow
