import { baseApi } from "./api";
import { getToken, setAccessToken } from "@/lib/auth-token";
import { axiosInstance } from "@/lib/axios-instance";
import { API_BASE_URL } from "@/lib/constants";
import type { ApiResponse } from "@/types/api";

type RefreshResponse = {
  accessToken?: string;
  data?: {
    accessToken?: string;
  };
};

export type AiStreamRequest = {
  question: string;
  sessionId: string;
  requestId: string;
  provider?: string;
  model?: string;
};

export type AiStreamResult = {
  requestId: string;
  text: string;
  provider?: string;
  model?: string;
  modelConfirmed?: boolean;
  aborted?: boolean;
};

export type AiCloudKeyStatus = {
  provider: string;
  label: string;
  configured: boolean;
  keyPreview?: string | null;
  updatedAt?: string | null;
};

export type UpdateAiCloudKeyRequest = {
  provider: string;
  apiKey: string;
};

async function refreshAccessToken() {
  const response = await axiosInstance.post<RefreshResponse>("/auth/refresh", {});
  const token = response.data.data?.accessToken ?? response.data.accessToken ?? "";

  if (token) {
    setAccessToken(token);
  }

  return token;
}

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAiProviderKeyStatuses: builder.query<AiCloudKeyStatus[], void>({
      query: () => ({
        url: "/v1/ai/config/providers",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<AiCloudKeyStatus[]>) => response.data,
      providesTags: [{ type: "AiConfig", id: "PROVIDERS" }],
    }),
    getAiCloudKeyStatus: builder.query<AiCloudKeyStatus, void>({
      query: () => ({
        url: "/v1/ai/config/cloud-key",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<AiCloudKeyStatus>) => response.data,
      providesTags: [{ type: "AiConfig", id: "CLOUD_KEY" }],
    }),
    updateAiCloudKey: builder.mutation<AiCloudKeyStatus, UpdateAiCloudKeyRequest>({
      query: ({ provider, apiKey }) => ({
        url: `/v1/ai/config/providers/${provider}/key`,
        method: "PUT",
        data: { apiKey },
      }),
      transformResponse: (response: ApiResponse<AiCloudKeyStatus>) => response.data,
      invalidatesTags: [
        { type: "AiConfig", id: "CLOUD_KEY" },
        { type: "AiConfig", id: "PROVIDERS" },
      ],
    }),
    clearAiCloudKey: builder.mutation<AiCloudKeyStatus, string>({
      query: (provider) => ({
        url: `/v1/ai/config/providers/${provider}/key`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<AiCloudKeyStatus>) => response.data,
      invalidatesTags: [
        { type: "AiConfig", id: "CLOUD_KEY" },
        { type: "AiConfig", id: "PROVIDERS" },
      ],
    }),
    streamAiAnswer: builder.query<AiStreamResult, AiStreamRequest>({
      async queryFn(arg, { signal, dispatch }) {
        let fullText = "";
        let provider = arg.provider;
        let model = arg.model;
        let modelConfirmed = false;

        try {
          let token = getToken();
          if (!token) {
            token = await refreshAccessToken();
          }

          const openStream = (accessToken: string) =>
            fetch(`${API_BASE_URL}/v1/ai/ask/stream`, {
              method: "POST",
              headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                Accept: "text/event-stream",
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(arg),
              signal,
            });

          let response = await openStream(token);
          if (response.status === 401) {
            token = await refreshAccessToken();
            response = await openStream(token);
          }

          if (!response.ok) {
            throw new Error(`AI stream failed (${response.status})`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            let buffer = "";

            const publishStreamState = () => {
              dispatch(
                aiApi.util.updateQueryData("streamAiAnswer", arg, () => {
                  return { requestId: arg.requestId, text: fullText, provider, model, modelConfirmed };
                })
              );
            };

            const appendEvent = (event: string) => {
              let eventName = "message";
              const dataLines: string[] = [];
              for (const line of event.split(/\r?\n/)) {
                if (line.startsWith("event:")) {
                  const value = line.slice("event:".length).trim();
                  eventName = value || "message";
                  continue;
                }
                if (line.startsWith("data:")) {
                  const data = line.slice("data:".length);
                  dataLines.push(data.startsWith(" ") ? data.slice(1) : data);
                }
              }
              const content = dataLines.join("\n");

              if (!content) return;

              if (eventName === "model") {
                try {
                  const meta = JSON.parse(content) as { provider?: string; model?: string };
                  provider = meta.provider || provider;
                  model = meta.model || model;
                  modelConfirmed = true;
                  publishStreamState();
                } catch {
                  // Ignore malformed metadata events; answer streaming can continue.
                }
                return;
              }
              if (eventName !== "message") return;

              fullText += content;
              // Cập nhật dữ liệu vào cache của Redux ngay lập tức để UI hiển thị
              publishStreamState();
            };

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const events = buffer.split(/\r?\n\r?\n/);
              buffer = events.pop() ?? "";

              for (const event of events) {
                appendEvent(event);
              }
            }

            buffer += decoder.decode();
            if (buffer) {
              appendEvent(buffer);
            }
          }
          return { data: { requestId: arg.requestId, text: fullText, provider, model, modelConfirmed } };
        } catch (err) {
          if (signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
            return { data: { requestId: arg.requestId, text: fullText, provider, model, modelConfirmed, aborted: true } };
          }
          return {
            error: {
              status: undefined,
              data: err instanceof Error ? err.message : "AI stream failed",
            },
          };
        }
      },
    }),
  }),
});

export const {
  useLazyStreamAiAnswerQuery,
  useGetAiProviderKeyStatusesQuery,
  useGetAiCloudKeyStatusQuery,
  useUpdateAiCloudKeyMutation,
  useClearAiCloudKeyMutation,
} = aiApi;
