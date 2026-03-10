# Web 전환 기능 명세 v0.1

## 1. 목표

- 기존 CLI 기반 RSS 수집/압축/R2 업로드 파이프라인을 웹에서 실행/모니터링 가능하게 전환한다.
- 운영자가 `엑셀 업로드` 또는 `RSS URL 직접 입력`으로 작업을 생성하고 상태/결과를 확인할 수 있어야 한다.
- 최종적으로 Supabase 컬럼(`audio_file`, `img_url`)에는 R2 URL이 반영되어야 한다.

## 2. 범위

### 포함

- 작업 생성 UI (Excel 모드, RSS 단건 모드)
- 작업 목록/상세/로그 UI
- 작업 실행 백엔드 API
- 백그라운드 워커(기존 서비스 로직 재사용)
- 실행 설정(국가, 에피소드 개수, 다운로드/압축 옵션) 저장

### 제외(다음 단계)

- 사용자 권한(Role) 세분화
- 멀티 테넌트
- 실시간 알림(푸시/슬랙)

## 3. 사용자 시나리오

1. 운영자가 웹에서 국가/모드/옵션을 선택한다.
2. Excel 파일 업로드 또는 RSS URL 입력 후 작업을 생성한다.
3. 작업이 큐에 들어가고 워커가 비동기로 처리한다.
4. 운영자는 웹에서 진행률/로그/에러를 본다.
5. 완료 후 프로그램/에피소드 결과 및 R2 URL 반영 상태를 확인한다.

## 4. 핵심 기능 정의

### F1. 작업 생성

- 입력 항목
  - `mode`: `excel | rss`
  - `countryCode`: `JP/IT/...`
  - `episodeLimit`, `downloadLimit`, `downloadFiles`, `syncCategory`, `syncThemes`
  - `rssUrl` (rss 모드)
  - `options.categoryId` (rss 모드, `syncCategory` 사용 시 선택 입력)
  - `excelFile` (excel 모드)
- 검증
  - rss 모드: `rssUrl` 필수, `http/https` URL 형식 검증
  - excel 모드: 파일 필수, 확장자 `xlsx`

### F2. 작업 실행(백엔드)

- Job 상태: `queued -> running -> succeeded | failed | canceled`
- 기존 함수 재사용
  - `syncPodcastFromExcel`
  - `syncPodcastFromRss`
  - `syncPodcastCommon` 내 압축/R2 업로드

### F3. 로그/진행률

- 로그 레벨: `info | warn | error`
- 작업 상세에서 타임라인 제공
- 실패 시 에러 메시지와 실패 지점 표시

### F4. 결과 확인

- 처리된 프로그램 수/에피소드 수
- R2 업로드 성공 수/실패 수
- Supabase URL 업데이트 성공 수/실패 수

## 5. 화면(IA)

- `/jobs` 작업 목록
- `/jobs/new` 작업 생성
- `/jobs/:id` 작업 상세(로그/통계/재시도)
- `/settings` 실행 기본값 관리

## 6. 백엔드 API 초안

- `POST /api/jobs` 작업 생성
- `GET /api/jobs` 작업 목록
- `GET /api/jobs/:id` 작업 상세
- `POST /api/jobs/:id/retry` 실패 작업 재시도
- `POST /api/jobs/:id/cancel` 실행 취소 요청

## 7. 데이터 모델 초안

### jobs

- `id` (uuid)
- `mode` (text)
- `status` (text)
- `country_code` (text)
- `payload` (jsonb)
- `result` (jsonb)
- `error_message` (text)
- `created_at`, `started_at`, `finished_at`

### job_logs

- `id` (bigint)
- `job_id` (uuid)
- `level` (text)
- `message` (text)
- `meta` (jsonb)
- `created_at`

## 8. 권장 아키텍처

- 프론트: Next.js
- API: Next.js Route Handler 또는 별도 Node API
- 워커: 별도 Node 프로세스(`tsx src/worker.ts`)
- 큐: 초기엔 Supabase `jobs` 테이블 polling(5~10초)

## 9. 기존 코드 재사용 전략

- `services/*`는 도메인 로직으로 유지
- `constants.ts`의 정적 설정은 Job payload 기반 동적 설정으로 분리
- 콘솔 로그는 `job_logs` 저장 함수로 추상화

## 10. 리스크

- 현재 로직이 `constants.ts`에 강결합(동시 다중 작업 어려움)
- FFmpeg/R2 오류 시 재시도 전략 필요
- 프로그램/에피소드 업데이트 매칭 키(id/title) 일관성 유지 필요

## 11. 1차 구현 순서(권장)

1. `jobs`, `job_logs` 테이블 생성
2. 작업 생성/조회 API 구현
3. 워커 구현(기존 sync 함수 호출)
4. `/jobs`, `/jobs/:id` UI 구현
5. `/jobs/new` + 파일 업로드 구현
6. 재시도/취소/요약 통계 추가

## 12. 완료 기준(DoD)

- 웹에서 작업 생성 후 끝까지 처리 가능
- 실패/성공 상태와 로그가 웹에서 확인 가능
- R2 업로드 URL이 Supabase 컬럼에 반영됨
- 최소 1개 excel job, 1개 rss job E2E 통과
