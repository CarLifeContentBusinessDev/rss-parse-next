import type { PodcastResult } from "@/app/podrss/_lib/entities/types";
import { CopyButton } from "@/app/podrss/_lib/shared/ui/CopyButton";
import { downloadExcel } from "@/app/podrss/_lib/shared/utils/downloadExcel";
import { CopyCell } from "./CopyCell";
import { getColumnsByType } from "@/app/podrss/_lib/entities/config/columns";
import { Download } from "lucide-react";

interface ResultTableProps {
  results: PodcastResult[];
  fileName?: string;
  type?: "manualAppleId" | "manualChannel" | "excel" | "topPodcast";
}

const COPYABLE_KEYS: (keyof PodcastResult)[] = [
  "channelName",
  "appleId",
  "rssUrl",
];

export const ResultTable = ({
  results,
  fileName = "result.xlsx",
  type = "excel",
}: ResultTableProps) => {
  const handleDownloadExcel = () => {
    downloadExcel(results, fileName, type);
  };

  const columns = getColumnsByType(type);

  return (
    <div className="border border-gray-500 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm text-gray-400 tracking-widest uppercase">
          총 {results.length}개 항목
        </span>
        <button
          onClick={handleDownloadExcel}
          className="text-xs bg-secondary-color hover:bg-light-secondary-color text-white font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer"
        >
          <Download className="inline mr-1 h-5" />
          엑셀 다운로드
        </button>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-100 scrollbar scrollbar-thumb-gray-600 scrollbar-track-gray-900 scrollbar-thumb">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-600">
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  className="px-4 py-3 text-sm text-slate-500 tracking-wider uppercase"
                >
                  <div className="flex items-center justify-center gap-2">
                    {label}
                    {COPYABLE_KEYS.includes(key) && (
                      <CopyButton
                        text={results.map((r) => String(r[key])).join("\n")}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-b border-gray-700">
                {columns.map(({ key }) => (
                  <td
                    key={String(key)}
                    className={`px-4 py-3 text-sm text-center ${
                      key === "status"
                        ? r.status === "SUCCESS"
                          ? "text-secondary-color"
                          : r.status === "FAILED"
                            ? "text-red-500"
                            : "text-gray-400"
                        : "text-gray-400"
                    }`}
                  >
                    {COPYABLE_KEYS.includes(key) ? (
                      <CopyCell value={String(r[key] ?? "")} />
                    ) : (
                      String(r[key] ?? "")
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



