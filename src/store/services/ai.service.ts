import { baseApi } from "./api";
import { getToken, setAccessToken } from "@/lib/auth-token";
import { axiosInstance } from "@/lib/axios-instance";
import { API_BASE_URL } from "@/lib/constants";

type RefreshResponse = {
  accessToken?: string;
  data?: {
    accessToken?: string;
  };
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
    streamAiAnswer: builder.query<string, { question: string; sessionId: string }>({
      async queryFn(arg, { signal, dispatch }) {
        const url = `${API_BASE_URL}/v1/ai/ask/stream?question=${encodeURIComponent(
          arg.question
        )}&sessionId=${encodeURIComponent(arg.sessionId)}`;

        let fullText = "";

        try {
          let token = getToken();
          if (!token) {
            token = await refreshAccessToken();
          }

          const openStream = (accessToken: string) => {
            const globalAny = window as any;
            const usedSignal = globalAny.__aiAbortControllers?.[arg.sessionId]?.signal ?? signal;
            return fetch(url, {
              headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                Accept: "text/event-stream",
              },
              credentials: "include",
              signal: usedSignal, // Hỗ trợ abort request khi component unmount hoặc user dừng
            });
          };

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

            const appendEvent = (event: string) => {
              const content = event
                .split(/\r?\n/)
                .filter((line) => line.startsWith("data:"))
                .map((line) => {
                  const data = line.slice("data:".length);
                  return data.startsWith(" ") ? data.slice(1) : data;
                })
                .join("\n");

              if (!content) return;

              fullText += content;
              // Cập nhật dữ liệu vào cache của Redux ngay lập tức để UI hiển thị
              dispatch(
                aiApi.util.updateQueryData("streamAiAnswer", arg, () => {
                  return fullText;
                })
              );
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
          return { data: fullText };
        } catch (err) {
          console.error("AI Stream Error:", err);
          return {
            error: {
              status: undefined,
              data: err instanceof Error ? err.message : "AI stream failed",
            },
          };
        } finally {
          try {
            const globalAny = window as any;
            if (globalAny.__aiAbortControllers) {
              delete globalAny.__aiAbortControllers[arg.sessionId];
            }
          } catch {
            // ignore
          }
        }
      },
    }),
  }),
});

export const { useLazyStreamAiAnswerQuery } = aiApi;
