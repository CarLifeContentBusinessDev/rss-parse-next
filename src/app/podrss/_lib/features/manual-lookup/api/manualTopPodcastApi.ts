import { kyInstance } from "@/app/podrss/_lib/shared/kyInstance";
import type { PodcastResult } from "@/app/podrss/_lib/entities/types";

interface manualTopPodcastParams {
  limit?: string;
  country: string;
}

export const manualTopPodcastApi = async (
  params: manualTopPodcastParams,
): Promise<PodcastResult[]> => {
  const response = await kyInstance
    .post("manual-lookup/top-podcast", {
      json: {
        limit: params.limit,
        country: params.country || null,
      },
    })
    .json<{ data: PodcastResult[] }>();
  return response.data;
};



