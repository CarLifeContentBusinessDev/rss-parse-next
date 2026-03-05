import ky from "ky";

export const kyInstance = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  timeout: 10000,
  hooks: {
    beforeError: [
      async (error) => {
        try {
          const body = (await error.response
            .clone()
            .json()) as { message?: string };
          if (body?.message) {
            error.message = body.message;
          }
        } catch {
          // Keep the original error message when response body is not JSON.
        }
        return error;
      },
    ],
  },
});
