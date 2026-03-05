import { kyInstance } from "@/app/podrss/_lib/shared/kyInstance";
import type { PodcastResult } from "@/app/podrss/_lib/entities/types";

interface ExcelChannelParams {
  file: File;
  sheetName: string;
  startRow: string;
  endRow: string;
  headerRow: string;
  channelNameColumn: string;
  appleIdColumn: string;
  rssColumn: string;
  country?: string;
}

export const excelChannelApi = async (
  params: ExcelChannelParams,
): Promise<PodcastResult[]> => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("sheetName", params.sheetName);
  formData.append("startRow", params.startRow);
  formData.append("endRow", params.endRow);
  formData.append("headerRow", params.headerRow);
  formData.append("channelNameColumn", params.channelNameColumn);
  formData.append("appleIdColumn", params.appleIdColumn);
  formData.append("rssColumn", params.rssColumn);
  // country는 optional이라 값이 있을 때만 추가
  if (params.country) {
    formData.append("country", params.country);
  }

  const response = await kyInstance
    .post("bulk-import/excel-file-channel", {
      body: formData,
    })
    .json<{ data: PodcastResult[] }>();

  return response.data;
};
