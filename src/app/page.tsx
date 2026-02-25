"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type SyncSuccess = {
  ok: true;
  data: {
    rssUrl: string;
    feedTitle: string | null;
    totalItems: number;
    processedItems: number;
    skippedItems: number;
    uploadedCount: number;
    updatedSupabaseCount: number;
  };
};

type ExcelSyncSuccess = {
  ok: true;
  data: {
    totalRows: number;
    succeededRows: number;
    failedRows: number;
    uploadedCount: number;
    updatedSupabaseCount: number;
    failures: Array<{ row: number; rssUrl: string | null; message: string }>;
    failureReportCsv: string;
  };
};

type SyncFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
};

type TablePreset = "test" | "main" | "custom";

type RuntimeState = {
  tablePreset: TablePreset;
  customProgramsTable: string;
  customProgramsCategoriesTable: string;
  customEpisodesTable: string;
  customThemesProgramsTable: string;
  countryCode: string;
  languageList: string;
  programType: string;
  episodeLimit: string;
  downloadFiles: boolean;
  downloadLimit: string;
  imageTargetMaxKb: string;
  keepLocalFiles: boolean;
  minRank: string;
  maxRank: string;
  syncCategory: boolean;
  globalCategoryId: string;
  syncThemes: boolean;
  themeId: string;
};

type JobEvent =
  | { type: "snapshot"; job: { status: string; progress?: { percent: number; message: string } } }
  | { type: "progress"; progress: { percent: number; message: string } }
  | { type: "result"; result: unknown }
  | { type: "error"; error: string }
  | { type: "status"; status: string };

const TEST_TABLES = {
  programs: "programs_test",
  programsCategories: "programs_categories_test",
  episodes: "episodes_test",
  themesPrograms: "themes_programs_test",
};

const MAIN_TABLES = {
  programs: "programs",
  programsCategories: "programs_categories",
  episodes: "episodes",
  themesPrograms: "themes_programs",
};

const defaultRuntimeState: RuntimeState = {
  tablePreset: "test",
  customProgramsTable: "programs_test",
  customProgramsCategoriesTable: "programs_categories_test",
  customEpisodesTable: "episodes_test",
  customThemesProgramsTable: "themes_programs_test",
  countryCode: "IT",
  languageList: "it",
  programType: "podcast",
  episodeLimit: "4",
  downloadFiles: true,
  downloadLimit: "10",
  imageTargetMaxKb: "50",
  keepLocalFiles: false,
  minRank: "60",
  maxRank: "60",
  syncCategory: true,
  globalCategoryId: "65",
  syncThemes: true,
  themeId: "16",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-zinc-300/80 bg-white/90 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-200";

function FieldHelp({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="mt-1 text-xs leading-relaxed text-zinc-500">{children}</p>;
}

function SectionCard({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle?: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/85 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] backdrop-blur">
      <h2 className="text-base font-semibold tracking-tight text-zinc-900">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ProgressBar({ value }: Readonly<{ value: number }>) {
  return (
    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function RuntimeOptions({
  label,
  state,
  setState,
}: {
  label: string;
  state: RuntimeState;
  setState: React.Dispatch<React.SetStateAction<RuntimeState>>;
}) {
  return (
    <SectionCard title={label} subtitle="실행 직전 값만 적용됩니다.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Table Preset</label>
          <select
            value={state.tablePreset}
            onChange={(e) => setState((prev) => ({ ...prev, tablePreset: e.target.value as TablePreset }))}
            className={inputClass}
          >
            <option value="test">test tables</option>
            <option value="main">main tables</option>
            <option value="custom">custom tables</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Country</label>
          <input value={state.countryCode} onChange={(e) => setState((prev) => ({ ...prev, countryCode: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Language List</label>
          <input value={state.languageList} onChange={(e) => setState((prev) => ({ ...prev, languageList: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Program Type</label>
          <input value={state.programType} onChange={(e) => setState((prev) => ({ ...prev, programType: e.target.value }))} className={inputClass} />
        </div>
        <div><label className="block text-sm font-medium text-zinc-700">Episode Limit</label><input type="number" value={state.episodeLimit} onChange={(e) => setState((prev) => ({ ...prev, episodeLimit: e.target.value }))} className={inputClass} /></div>
        <div><label className="block text-sm font-medium text-zinc-700">Download Limit</label><input type="number" value={state.downloadLimit} onChange={(e) => setState((prev) => ({ ...prev, downloadLimit: e.target.value }))} className={inputClass} /></div>
        <div><label className="block text-sm font-medium text-zinc-700">Image Max KB</label><input type="number" value={state.imageTargetMaxKb} onChange={(e) => setState((prev) => ({ ...prev, imageTargetMaxKb: e.target.value }))} className={inputClass} /></div>
        <div><label className="block text-sm font-medium text-zinc-700">Theme ID</label><input type="number" value={state.themeId} onChange={(e) => setState((prev) => ({ ...prev, themeId: e.target.value }))} className={inputClass} /></div>
        <div><label className="block text-sm font-medium text-zinc-700">Min Rank</label><input type="number" value={state.minRank} onChange={(e) => setState((prev) => ({ ...prev, minRank: e.target.value }))} className={inputClass} /></div>
        <div><label className="block text-sm font-medium text-zinc-700">Max Rank</label><input type="number" value={state.maxRank} onChange={(e) => setState((prev) => ({ ...prev, maxRank: e.target.value }))} className={inputClass} /></div>
        <div><label className="block text-sm font-medium text-zinc-700">Global Category ID</label><input type="number" value={state.globalCategoryId} onChange={(e) => setState((prev) => ({ ...prev, globalCategoryId: e.target.value }))} className={inputClass} /></div>
        <label className="mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"><input type="checkbox" checked={state.downloadFiles} onChange={(e) => setState((prev) => ({ ...prev, downloadFiles: e.target.checked }))} />Download files</label>
        <label className="mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"><input type="checkbox" checked={state.keepLocalFiles} onChange={(e) => setState((prev) => ({ ...prev, keepLocalFiles: e.target.checked }))} />Keep local files</label>
        <label className="mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"><input type="checkbox" checked={state.syncCategory} onChange={(e) => setState((prev) => ({ ...prev, syncCategory: e.target.checked }))} />Sync category</label>
        <label className="mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"><input type="checkbox" checked={state.syncThemes} onChange={(e) => setState((prev) => ({ ...prev, syncThemes: e.target.checked }))} />Sync themes</label>
      </div>

      {state.tablePreset === "custom" ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input placeholder="programs table" value={state.customProgramsTable} onChange={(e) => setState((prev) => ({ ...prev, customProgramsTable: e.target.value }))} className={inputClass} />
          <input placeholder="programs_categories table" value={state.customProgramsCategoriesTable} onChange={(e) => setState((prev) => ({ ...prev, customProgramsCategoriesTable: e.target.value }))} className={inputClass} />
          <input placeholder="episodes table" value={state.customEpisodesTable} onChange={(e) => setState((prev) => ({ ...prev, customEpisodesTable: e.target.value }))} className={inputClass} />
          <input placeholder="themes_programs table" value={state.customThemesProgramsTable} onChange={(e) => setState((prev) => ({ ...prev, customThemesProgramsTable: e.target.value }))} className={inputClass} />
        </div>
      ) : null}
    </SectionCard>
  );
}

function buildOptions(state: RuntimeState, sheetName: string, headerSkip: string) {
  const resolvedTables =
    state.tablePreset === "main"
      ? MAIN_TABLES
      : state.tablePreset === "custom"
        ? {
            programs: state.customProgramsTable,
            programsCategories: state.customProgramsCategoriesTable,
            episodes: state.customEpisodesTable,
            themesPrograms: state.customThemesProgramsTable,
          }
        : TEST_TABLES;

  return {
    sheetName,
    countryCode: state.countryCode,
    languageList: state.languageList,
    programType:
      state.programType.trim().toLowerCase() === "null" ? null : state.programType,
    episodeLimit: Number(state.episodeLimit),
    downloadFiles: state.downloadFiles,
    downloadLimit: Number(state.downloadLimit),
    imageTargetMaxKb: Number(state.imageTargetMaxKb),
    keepLocalFiles: state.keepLocalFiles,
    excelHeaderSkip: Number(headerSkip),
    minRank: state.minRank.trim() ? Number(state.minRank) : null,
    maxRank: state.maxRank.trim() ? Number(state.maxRank) : null,
    syncCategory: state.syncCategory,
    globalCategoryId: Number(state.globalCategoryId),
    syncThemes: state.syncThemes,
    themeId: Number(state.themeId),
    tables: resolvedTables,
  };
}

export default function Home() {
  const [rssUrl, setRssUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [rssProgress, setRssProgress] = useState(0);
  const [rssMessage, setRssMessage] = useState("");
  const [result, setResult] = useState<SyncSuccess | SyncFailure | null>(null);
  const [rssOptions, setRssOptions] = useState<RuntimeState>(defaultRuntimeState);

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [sheetName, setSheetName] = useState("IT_이탈리아");
  const [headerSkip, setHeaderSkip] = useState("2");
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelProgress, setExcelProgress] = useState(0);
  const [excelMessage, setExcelMessage] = useState("");
  const [excelResult, setExcelResult] = useState<ExcelSyncSuccess | SyncFailure | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const [excelOptions, setExcelOptions] = useState<RuntimeState>(defaultRuntimeState);

  const rssSourceRef = useRef<EventSource | null>(null);
  const excelSourceRef = useRef<EventSource | null>(null);

  const subscribeJob = (
    jobId: string,
    type: "rss" | "excel",
  ) => {
    const source = new EventSource(`/api/jobs/${jobId}/events`);

    const close = () => {
      source.close();
      if (type === "rss") rssSourceRef.current = null;
      if (type === "excel") excelSourceRef.current = null;
    };

    source.onmessage = (evt) => {
      if (!evt.data) return;
      const event = JSON.parse(evt.data) as JobEvent;

      if (event.type === "snapshot" && event.job.progress) {
        if (type === "rss") {
          setRssProgress(event.job.progress.percent);
          setRssMessage(event.job.progress.message);
        } else {
          setExcelProgress(event.job.progress.percent);
          setExcelMessage(event.job.progress.message);
        }
      }

      if (event.type === "progress") {
        if (type === "rss") {
          setRssProgress(event.progress.percent);
          setRssMessage(event.progress.message);
        } else {
          setExcelProgress(event.progress.percent);
          setExcelMessage(event.progress.message);
        }
      }

      if (event.type === "result") {
        if (type === "rss") {
          setResult({ ok: true, data: event.result as SyncSuccess["data"] });
          setLoading(false);
          setRssProgress(100);
          setRssMessage("completed");
        } else {
          setExcelResult({ ok: true, data: event.result as ExcelSyncSuccess["data"] });
          setExcelLoading(false);
          setExcelProgress(100);
          setExcelMessage("completed");
        }
        close();
      }

      if (event.type === "error") {
        if (type === "rss") {
          setResult({ ok: false, error: { code: "JOB_FAILED", message: event.error } });
          setLoading(false);
        } else {
          setExcelResult({ ok: false, error: { code: "JOB_FAILED", message: event.error } });
          setExcelLoading(false);
        }
        close();
      }

      if (event.type === "status" && event.status === "failed") {
        if (type === "rss") setLoading(false);
        else setExcelLoading(false);
        close();
      }
    };

    source.onerror = () => {
      if (type === "rss") {
        setLoading(false);
        setResult({ ok: false, error: { code: "STREAM_ERROR", message: "job stream disconnected" } });
      } else {
        setExcelLoading(false);
        setExcelResult({ ok: false, error: { code: "STREAM_ERROR", message: "job stream disconnected" } });
      }
      close();
    };

    if (type === "rss") rssSourceRef.current = source;
    else excelSourceRef.current = source;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setRssProgress(2);
    setRssMessage("job queued");

    rssSourceRef.current?.close();

    try {
      const response = await fetch("/api/sync/rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rssUrl,
          options: buildOptions(rssOptions, sheetName, headerSkip),
        }),
      });

      const json = (await response.json()) as { ok: boolean; data?: { jobId?: string } };
      const jobId = json.data?.jobId;
      if (!jobId) throw new Error("Failed to create RSS job");
      subscribeJob(jobId, "rss");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected request failure";
      setLoading(false);
      setResult({ ok: false, error: { code: "NETWORK_ERROR", message } });
    }
  };

  const onExcelSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!excelFile) {
      setExcelResult({ ok: false, error: { code: "INVALID_REQUEST", message: "엑셀 파일을 선택하세요." } });
      return;
    }

    setExcelLoading(true);
    setExcelResult(null);
    setCopyDone(false);
    setExcelProgress(2);
    setExcelMessage("job queued");

    excelSourceRef.current?.close();

    try {
      const formData = new FormData();
      formData.append("excelFile", excelFile);
      formData.append("sheetName", sheetName.trim());
      formData.append("headerSkip", headerSkip.trim());
      formData.append("countryCode", excelOptions.countryCode.trim());
      formData.append("optionsJson", JSON.stringify(buildOptions(excelOptions, sheetName, headerSkip)));

      const response = await fetch("/api/sync/excel", {
        method: "POST",
        body: formData,
      });

      const json = (await response.json()) as { ok: boolean; data?: { jobId?: string } };
      const jobId = json.data?.jobId;
      if (!jobId) throw new Error("Failed to create Excel job");
      subscribeJob(jobId, "excel");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected request failure";
      setExcelLoading(false);
      setExcelResult({ ok: false, error: { code: "NETWORK_ERROR", message } });
    }
  };

  const rssSummary = useMemo(() => {
    if (!result || !result.ok) return null;
    return `RSS 처리 ${result.data.processedItems}/${result.data.totalItems} · 업로드 ${result.data.uploadedCount} · 업데이트 ${result.data.updatedSupabaseCount}`;
  }, [result]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1700px] flex-col gap-6 px-5 py-10 sm:px-8 xl:px-10">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.08)] backdrop-blur">
        <div className="pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full bg-cyan-200/60 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-teal-200/60 blur-2xl" />
        <h1 className="relative text-3xl font-semibold tracking-tight text-zinc-900">RSS Sync Console</h1>
        <p className="relative mt-2 text-sm text-zinc-600">RSS 단건과 Excel 배치를 독립 옵션으로 실행합니다.</p>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <RuntimeOptions label="RSS 단건 옵션" state={rssOptions} setState={setRssOptions} />

          <SectionCard title="RSS 단건 실행">
            <form onSubmit={onSubmit}>
              <input type="url" required placeholder="https://example.com/feed.xml" value={rssUrl} onChange={(event) => setRssUrl(event.target.value)} className={inputClass} />
              <button type="submit" disabled={loading} className="mt-4 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60">
                {loading ? "동기화 중..." : "동기화 실행"}
              </button>
              {loading ? <ProgressBar value={rssProgress} /> : null}
              {loading ? <p className="mt-2 text-xs text-zinc-500">{rssMessage}</p> : null}
            </form>
          </SectionCard>

          {result && !result.ok ? <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">[{result.error.code}] {result.error.message}</section> : null}
          {rssSummary ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{rssSummary}</section> : null}
        </div>

        <div className="flex flex-col gap-6">
          <RuntimeOptions label="Excel 배치 옵션" state={excelOptions} setState={setExcelOptions} />

          <SectionCard title="Excel 배치 실행">
            <form onSubmit={onExcelSubmit}>
              <input type="file" accept=".xlsx" required onChange={(event) => setExcelFile(event.target.files?.[0] ?? null)} className="w-full text-sm text-zinc-700" />
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={sheetName} onChange={(e) => setSheetName(e.target.value)} placeholder="Sheet Name" className={inputClass} />
                <input value={headerSkip} onChange={(e) => setHeaderSkip(e.target.value)} type="number" min={0} placeholder="Header Skip" className={inputClass} />
              </div>
              <FieldHelp>`Sheet Name`: 읽을 시트 이름, `Header Skip`: 건너뛸 행 수</FieldHelp>
              <button type="submit" disabled={excelLoading} className="mt-4 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60">
                {excelLoading ? "배치 실행 중..." : "Excel 실행"}
              </button>
              {excelLoading ? <ProgressBar value={excelProgress} /> : null}
              {excelLoading ? <p className="mt-2 text-xs text-zinc-500">{excelMessage}</p> : null}
            </form>
          </SectionCard>

          {excelResult && !excelResult.ok ? <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">[{excelResult.error.code}] {excelResult.error.message}</section> : null}
          {excelResult && excelResult.ok ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p className="font-medium">Excel 성공 {excelResult.data.succeededRows}/{excelResult.data.totalRows}, 실패 {excelResult.data.failedRows}</p>
              {excelResult.data.failures.length > 0 ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(excelResult.data.failureReportCsv);
                      setCopyDone(true);
                    }}
                    className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    실패 CSV 복사
                  </button>
                  {copyDone ? <p className="mt-1 text-xs">복사 완료</p> : null}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
