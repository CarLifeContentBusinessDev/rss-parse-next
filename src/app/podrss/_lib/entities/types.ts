export interface PodcastResult {
  rank?: number; // top podcast일 경우에만 존재
  rowIndex: number;
  channelName: string;
  appleId: string;
  rssUrl: string;
  status: "SUCCESS" | "FAILED";
  reason?: string;
}
