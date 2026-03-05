import type { PodcastResult } from "@/app/podrss/_lib/entities/types";

export type ResultType =
  | "topPodcast"
  | "manualAppleId"
  | "manualChannel"
  | "excel";

export interface ColumnConfig {
  key: keyof PodcastResult;
  label: string;
}

export const getColumnsByType = (type: ResultType): ColumnConfig[] => {
  switch (type) {
    case "topPodcast":
      return [
        { key: "rank", label: "순위" },
        { key: "channelName", label: "채널명" },
        { key: "appleId", label: "Apple ID" },
        { key: "rssUrl", label: "RSS URL" },
        { key: "status", label: "상태" },
        { key: "reason", label: "기타" },
      ];

    case "manualAppleId":
      return [
        { key: "appleId", label: "Apple ID" },
        { key: "rssUrl", label: "RSS URL" },
        { key: "status", label: "상태" },
        { key: "reason", label: "기타" },
      ];

    case "manualChannel":
      return [
        { key: "channelName", label: "채널명" },
        { key: "appleId", label: "Apple ID" },
        { key: "rssUrl", label: "RSS URL" },
        { key: "status", label: "상태" },
        { key: "reason", label: "기타" },
      ];

    default:
      return [
        { key: "rowIndex", label: "행" },
        { key: "channelName", label: "채널명" },
        { key: "appleId", label: "Apple ID" },
        { key: "rssUrl", label: "RSS URL" },
        { key: "status", label: "상태" },
        { key: "reason", label: "기타" },
      ];
  }
};




