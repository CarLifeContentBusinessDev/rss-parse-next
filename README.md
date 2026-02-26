# RSS Parse Next

Next.js App Router 기반 RSS 동기화 실행기입니다.

## 필수 환경변수

아래 2개만 필수입니다.

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

R2 업로드를 사용할 때만 아래를 추가하세요.

```env
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
```

## 실행

```bash
npm install
npm run dev
```

## UI 조절 가능 항목

화면에서 직접 변경 가능합니다.

- 테이블 선택: `test / main / custom`
- `SHEET_NAME`, `COUNTRY_CODE`, `LANGUAGE_LIST`, `PROGRAM_TYPE`
- `EPISODE_LIMIT`, `DOWNLOAD_FILES`, `DOWNLOAD_LIMIT`, `IMAGE_TARGET_MAX_KB`
- `EXCEL_HEADER_SKIP`, `MIN_RANK`, `MAX_RANK`
- `SYNC_CATEGORY`, `GLOBAL_CATEGORY_ID`, `SYNC_THEMES`, `THEME_ID`

## API

- `POST /api/sync/rss` (`application/json`): `{ rssUrl, options? }`
- `POST /api/sync/excel` (`multipart/form-data`): `excelFile`, `sheetName?`, `headerSkip?`, `countryCode?`, `optionsJson?`
