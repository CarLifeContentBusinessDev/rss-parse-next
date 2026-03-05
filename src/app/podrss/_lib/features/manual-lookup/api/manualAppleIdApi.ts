import { kyInstance } from "@/app/podrss/_lib/shared/kyInstance";
import type { PodcastResult } from "@/app/podrss/_lib/entities/types";

interface ManualAppleIdParams {
  appleId: string;
  country?: string;
}

export const manualAppleIdApi = async (
  params: ManualAppleIdParams,
): Promise<PodcastResult[]> => {
  const response = await kyInstance
    .post("manual-lookup/apple-id", {
      json: {
        appleId: params.appleId,
        country: params.country || null,
      },
    })
    .json<{ data: PodcastResult[] }>();
  return response.data;
};



