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
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data:")) {
                  const content = line.replace("data:", "").trim();
                  if (content) {
                    fullText += content;
                    // Cập nhật dữ liệu vào cache của Redux ngay lập tức để UI hiển thị
                    dispatch(
                      aiApi.util.updateQueryData("streamAiAnswer", arg, (draft) => {
                        return fullText;
                      })
                    );
                  }
                }
              }
            }
          }
          return { data: fullText };
        } catch (err: any) {
          console.error("AI Stream Error:", err);
          return { error: { status: "FETCH_ERROR", error: err.message } };
        }
      },
    }),
  }),
});

export const { useLazyStreamAiAnswerQuery } = aiApi;
