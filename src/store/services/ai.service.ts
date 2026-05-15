import { baseApi } from "./api";
import { getToken } from "@/lib/auth-token";
import { API_BASE_URL } from "@/lib/constants";

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    streamAiAnswer: builder.query<string, { question: string; sessionId: string }>({
      async queryFn(arg, { signal, dispatch }) {
        const token = getToken();
        const url = `${API_BASE_URL}/v1/ai/ask/stream?question=${encodeURIComponent(
          arg.question
        )}&sessionId=${arg.sessionId}`;

        let fullText = "";

        try {
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "text/event-stream",
            },
            signal, // Hỗ trợ abort request khi component unmount
          });

          if (!response.ok) throw new Error("Stream failed");

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
        } catch (err: unknown) {
          console.error("AI Stream Error:", err);
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

export const { useLazyStreamAiAnswerQuery } = aiApi;
