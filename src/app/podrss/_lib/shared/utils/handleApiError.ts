import { HTTPError } from "ky";

export const handleApiError = (error: unknown): string => {
  if (error instanceof HTTPError) {
    return error.message || "오류가 발생했습니다.";
  }
  if (error instanceof Error) {
    return error.message || "오류가 발생했습니다.";
  }
  return "오류가 발생했습니다.";
};
