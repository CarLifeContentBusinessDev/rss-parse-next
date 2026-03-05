import { kyInstance } from "@/app/podrss/_lib/shared/kyInstance";
import type { PodcastResult } from "@/app/podrss/_lib/entities/types";

interface ManualChannelParams {
  channelName: string;
  country?: string;
}

export const manualChannelApi = async (
  params: ManualChannelParams,
): Promise<PodcastResult[]> => {
  const response = await kyInstance
    .post("manual-lookup/channel-name", {
      json: {
        channelName: params.channelName,
        country: params.country || null,
      },
    })
    .json<{ data: PodcastResult[] }>();
  return response.data;
};



