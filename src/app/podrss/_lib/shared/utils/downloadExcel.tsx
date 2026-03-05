import * as XLSX from "xlsx";
import type { PodcastResult } from "@/app/podrss/_lib/entities/types";
import {
  getColumnsByType,
  type ResultType,
} from "@/app/podrss/_lib/entities/config/columns";

export const downloadExcel = (
  results: PodcastResult[],
  fileName = "result.xlsx",
  type: ResultType = "excel",
) => {
  const columns = getColumnsByType(type);

  const data = results.map((r) => {
    const row: Record<string, string | number> = {};

    columns.forEach(({ key, label }) => {
      row[label] = (r[key] as string | number) ?? "";
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: columns.map((c) => c.label),
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
  XLSX.writeFile(workbook, fileName);
};



