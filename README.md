# rss-parse-next

Next.js App Router 기반 RSS/Excel 동기화 웹 도구입니다.  
웹에서 작업(Job)을 생성하고, 진행률을 실시간으로 확인하며, 처리 결과를 Supabase에 반영합니다.

## 주요 기능

- RSS URL 기반 동기화 실행
- Excel 파일 배치 동기화 실행
- Job 큐/상태 관리 (`queued`, `running`, `succeeded`, `failed`)
- SSE 기반 실시간 진행률 스트리밍
- Supabase 업데이트 및 선택적 Cloudflare R2 업로드

## 기술 스택

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js`)
- Cloudflare R2 (`@aws-sdk/client-s3`)

## 빠른 시작

### 1) 의존성 설치

```bash
pnpm install
```

PowerShell 정책으로 `pnpm` 실행이 막히면:

```bash
cmd /c pnpm install
```

### 2) 환경변수 설정

`.env` 파일에 아래 값을 설정하세요.

필수:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

R2 업로드 사용 시 추가:

```env
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
```

### 3) 개발 서버 실행

```bash
pnpm dev
```

기본 접속 URL: `http://localhost:3000`

## 스크립트

- `pnpm dev`: 개발 서버
- `pnpm build`: 프로덕션 빌드
- `pnpm start`: 프로덕션 서버
- `pnpm lint`: ESLint 검사
- `pnpm format`: Prettier 포맷
- `pnpm format:check`: 포맷 검사
- `pnpm exec tsc --noEmit`: 타입 검사

## 인증/접근 제어

- 로그인 페이지: `/login`
- 기본 진입 경로(`/`, `/sync`)는 `/sync/rss`로 리다이렉트
- 보호 경로:
  - `/sync/*`
  - `/api/sync/*`
  - `/api/content/*`
  - `/api/jobs/*`
- 관리자로 허용된 이메일(`ADMIN_EMAILS`)만 보호 경로 접근 가능

## Vercel 배포

### 1) 프로젝트 연결

- Vercel Dashboard에서 Git 저장소를 Import
- Framework Preset은 `Next.js` 사용 (자동 감지)
- Root Directory는 저장소 루트(`.`)

### 2) Build 설정

- Install Command: `pnpm install`
- Build Command: `pnpm build`
- Output은 Next.js 기본값 사용

### 3) Environment Variables 등록

Vercel 프로젝트 Settings > Environment Variables에 아래 값 등록:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `ADMIN_EMAILS`
- (선택) `CLOUDFLARE_R2_ACCOUNT_ID`
- (선택) `CLOUDFLARE_R2_ACCESS_KEY_ID`
- (선택) `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- (선택) `CLOUDFLARE_R2_BUCKET`
- (선택) `CLOUDFLARE_R2_PUBLIC_BASE_URL`

운영 기준이면 최소 `Production` 환경에 필수 값들을 반드시 등록하세요.

### 4) 배포 후 점검

- `/login` 로그인 성공 여부
- `/sync/rss`, `/sync/excel` 접근/실행 여부
- `/api/sync/rss`, `/api/sync/excel` 호출 후 job 생성(`202`) 여부
- `/api/jobs/:id/events` SSE 스트리밍 수신 여부

## API 계약

### `POST /api/sync/rss`

- Content-Type: `application/json`
- Body:

```json
{
  "rssUrl": "https://example.com/feed.xml",
  "options": {
    "categoryId": 123
  }
}
```

- 성공 응답 (`202`):

```json
{
  "ok": true,
  "data": {
    "jobId": "..."
  }
}
```

### `POST /api/sync/excel`

- Content-Type: `multipart/form-data`
- Fields:
  - `excelFile` (required, `.xlsx`)
  - `sheetName` (optional)
  - `headerSkip` (optional, non-negative integer)
  - `countryCode` (optional)
  - `optionsJson` (optional, JSON string)
- 성공 응답 (`202`): RSS API와 동일하게 `jobId` 반환

### `GET /api/jobs/:id`

- Job 상태/진행률/결과 조회

### `GET /api/jobs/:id/events`

- `text/event-stream` 기반 실시간 이벤트
- 주요 이벤트 타입: `snapshot`, `status`, `progress`, `result`, `error`

## 프로젝트 구조

```text
src/
  app/
    sync/rss, sync/excel         # 실행 UI
    api/sync/*                   # Job 생성 API
    api/jobs/[id]/*              # Job 조회/SSE
  jobs/                          # Job manager/runner
  services/                      # RSS/Excel 도메인 동기화 로직
  lib/
    supabase.ts                  # Service Role 클라이언트
    auth/*                       # 로그인/세션/관리자 검증
    r2.ts                        # R2 업로드
```

## 변경 전 점검 권장

1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. 환경변수/로그에 시크릿 노출 여부 확인
