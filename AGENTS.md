# AGENTS.md

This file defines project-specific guidance for coding agents working in this repository.

## 1) Project Overview

- Name: `rss-parse-next`
- Stack: Next.js App Router, React, TypeScript, Tailwind CSS
- Core domain: Run RSS sync and Excel batch sync jobs from a web UI, then process/upload media and update Supabase records.

## 2) Primary Commands

- Install dependencies: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Start production server: `pnpm start`
- Lint: `pnpm lint`
- Format: `pnpm format`
- Format check: `pnpm format:check`
- Type check: `pnpm exec tsc --noEmit`

If PowerShell script policy blocks `pnpm`, use `cmd /c pnpm ...`.

## 3) Required Environment Variables

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (required only when R2 upload is enabled):

- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_BASE_URL`

Never print secrets in logs or commit `.env`.

## 4) Source Map (High-Level)

- UI layer: `src/app/*`
  - Main page: `src/app/page.tsx`
  - Panels: `src/app/_components/panels/*`
  - Runtime option models: `src/app/_lib/runtime-options*`
  - Upload mode metadata: `src/app/_lib/upload-modes.ts`
- API routes: `src/app/api/*`
  - `POST /api/sync/rss`
  - `POST /api/sync/excel`
  - Job status/event routes under `src/app/api/jobs/[id]/*`
- Job runtime: `src/jobs/*`
  - `jobManager.ts`, `runners.ts`, `types.ts`
- Domain services: `src/services/*`
  - `syncPodcastFromRss.ts`
  - `syncPodcastFromExcel.ts`
  - `syncPodcastCommon.ts`
- Integrations:
  - Supabase: `src/lib/supabase.ts`
  - Cloudflare R2: `src/lib/r2.ts`

## 5) Architecture Rules

- Keep transformation and validation at I/O boundaries:
  - Route handlers parse and validate request payloads.
  - Services consume typed, normalized options.
- Do not mix transport concerns (HTTP/form parsing) inside domain services.
- Prefer extending existing job flow (`createJob`, job channel updates) over adding ad-hoc background logic.
- Keep RSS and Excel flows isolated; share only truly common logic.

## 6) UI/Frontend Conventions

- Upload flows are separated by sidebar mode selection.
- Add new upload types through metadata first:
  - Extend `UploadMode` and `uploadModeMeta` in `src/app/_lib/upload-modes.ts`.
  - Add a dedicated panel component under `src/app/_components/panels/`.
  - Wire rendering in `src/app/page.tsx`.
- Reuse existing primitives (`SectionCard`, `RuntimeOptions`, `ProgressBar`) before creating new wrappers.
- Keep component files small and focused:
  - Soft limit: around 200 lines per component file.
  - If a file approaches/exceeds 200 lines, split into domain-focused child components (`types`, `view`, `item`, `controls`).
  - Keep data-fetch/container logic separate from dense presentational blocks where possible.

## 7) API Contracts (Current)

- `POST /api/sync/rss` (JSON)
  - body: `{ rssUrl, options? }`
- `POST /api/sync/excel` (multipart/form-data)
  - fields: `excelFile`, `sheetName?`, `headerSkip?`, `countryCode?`, `optionsJson?`

When changing contracts:

- Update route validation and error responses.
- Update corresponding panel submit logic.
- Update docs (`README.md`, optionally `docs/WEB_SPEC.md`) in the same change.

## 8) Change Safety Checklist

Before finishing a change:

1. Run `pnpm exec tsc --noEmit`.
2. Run `pnpm lint` for non-trivial code changes.
3. Ensure no secrets are logged or committed.
4. Keep file encoding as UTF-8 (no BOM).
5. Avoid unrelated refactors in the same patch.

## 9) Common Pitfalls

- Do not break SSE/job event flow used by `use-sync-job-channel`.
- Avoid introducing global mutable runtime options that can conflict across concurrent jobs.
- Be careful with large file handling in Excel uploads (`.job_tmp` lifecycle, error paths).
- Do not silently swallow failures from R2/Supabase operations; surface actionable errors.

## 10) Documentation Policy

If behavior changes, update at least one of:

- `README.md` for developer/operator usage
- `docs/WEB_SPEC.md` for product/flow-level behavior

Keep docs aligned with actual routes, payloads, and UI labels.
