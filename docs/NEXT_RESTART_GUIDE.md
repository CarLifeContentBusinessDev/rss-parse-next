# Next.js 단일 레포 새출발 가이드

## 1) 목표

- 기존 CLI RSS 파이프라인을 버리고, Next.js 단일 레포로 새로 시작
- 프론트(React) + 서버(API Route) + 기존 로직(압축/R2/Supabase) 통합

## 2) 새 채팅에서 첫 메시지 템플릿

아래를 새 채팅 첫 메시지로 그대로 붙여넣으면 된다.

```text
Next.js 단일 레포로 새로 시작할게.
요구사항:
1) App Router 기반 Next.js 프로젝트 생성
2) /api/sync/rss POST 라우트 추가 (Node runtime)
3) 기존 RSS 동기화 로직을 서버에서만 실행
4) ffmpeg + R2 + Supabase service role key는 서버 전용으로 설정
5) 간단한 실행 UI(/)에서 RSS URL 입력 후 동기화 버튼
6) .env.example, README 실행 가이드 작성
7) 에러 로깅 명확하게
진행하면서 파일 생성/수정하고, 마지막에 실행 방법까지 알려줘.
```

## 3) 아키텍처 원칙

- 브라우저(클라이언트): 입력/결과 표시만
- Next 서버(route.ts): 실제 동기화 실행
- 비밀키(`SUPABASE_SERVICE_ROLE_KEY`, R2 키)는 서버 전용
- ffmpeg 사용 라우트는 `export const runtime = "nodejs"`

## 4) 초기 디렉토리 제안

```text
app/
  page.tsx
  api/
    sync/
      rss/
        route.ts
src/
  services/
    syncPodcastFromRss.ts
    syncPodcastFromExcel.ts
    syncPodcastCommon.ts
  lib/
    supabase.ts
    r2.ts
  utils/
    duration.ts
```

## 5) 환경변수 템플릿 (.env.local)

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
```

## 6) 최소 기능 우선순위(MVP)

1. `/api/sync/rss` 단건 실행
2. 홈 화면 입력폼 + 실행 버튼
3. 동기화 성공/실패 메시지 표시
4. R2 업로드 URL이 Supabase 컬럼에 반영되는지 검증

## 7) 검증 체크리스트

- `npm run dev`로 실행 가능
- API 호출 시 200/500 응답 명확
- 서버 로그에 업로드 URL 표시
- Supabase `audio_file`, `img_url` 컬럼 반영 확인
- duration 포맷(`00:32:23 -> 32:23`, 초 단위 입력) 정상

## 8) 운영 전 점검

- `episodes_test(program_id, title)` 유니크 제약 존재 확인
- ffmpeg 설치 및 PATH 설정 확인
- R2 공개 URL(r2.dev 또는 custom domain) 확인

## 9) 권장 진행 방식

- 먼저 RSS 단건 API를 완성
- 그 다음 Excel 업로드 API 추가
- 마지막으로 작업 이력(Job) 화면 확장

---

필요하면 다음 단계로 "Next 프로젝트 실제 생성 명령 + 파일 뼈대"까지 이어서 요청하면 된다.
