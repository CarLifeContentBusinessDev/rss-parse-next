export const TOAST_IDS = {
  excelChannel: {
    success: "excel-channel-success",
    error: "excel-channel-error", // API 오류
    warning: "excel-channel-warning", // 입력값 오류
  },
  excelAppleId: {
    success: "excel-apple-id-success",
    error: "excel-apple-id-error",
    warning: "excel-apple-id-warning",
  },
  manualChannel: {
    success: "manual-channel-success",
    error: "manual-channel-error",
    warning: "manual-channel-warning",
  },
  manualAppleId: {
    success: "manual-apple-id-success",
    error: "manual-apple-id-error",
    warning: "manual-apple-id-warning",
  },
  topPodcast: {
    success: "top-podcast-success",
    error: "top-podcast-error",
    warning: "top-podcast-warning",
  },
} as const;
