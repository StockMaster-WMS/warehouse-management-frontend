"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Bot,
  Boxes,
  ClipboardList,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLazyStreamAiAnswerQuery } from "@/store/services/ai.service";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Tôi có thể hỗ trợ tra cứu tồn kho, đơn nhập/xuất, cảnh báo thiếu hàng và gợi ý thao tác vận hành. Bạn muốn kiểm tra nội dung nào?",
};

const SUGGESTIONS = [
  "Tóm tắt tình hình tồn kho hôm nay",
  "Những SKU nào đang gần hết hàng?",
  "Đơn xuất nào cần ưu tiên xử lý?",
  "Kiểm tra các đơn nhập đang chờ putaway",
];

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `warehouse-ai-${crypto.randomUUID()}`;
  }
  return `warehouse-ai-${createMessageId()}`;
}

export default function AiAssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [triggerStream, { data: streamResult, isFetching }] =
    useLazyStreamAiAnswerQuery();
  const currentAssistantMsgId = useRef<string | null>(null);
  const sessionIdRef = useRef(createSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamResult]);

  useEffect(() => {
    if (!streamResult || !currentAssistantMsgId.current) return;

    const msgId = currentAssistantMsgId.current;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, content: streamResult } : msg
      )
    );
  }, [streamResult]);

  async function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isFetching) return;

    const userMsg: Message = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };
    const assistantMsgId = createMessageId();
    currentAssistantMsgId.current = assistantMsgId;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);
    setInput("");

    try {
      await triggerStream({
        question: trimmed,
        sessionId: sessionIdRef.current,
      }).unwrap();
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "Không thể kết nối trợ lý AI lúc này. Vui lòng kiểm tra backend hoặc thử lại sau.",
              }
            : msg
        )
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(input);
  }

  function resetConversation() {
    currentAssistantMsgId.current = null;
    sessionIdRef.current = createSessionId();
    setInput("");
    setMessages([INITIAL_MESSAGE]);
  }

  return (
    <section className="flex h-[calc(100svh-7.5rem)] min-h-[38rem] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <header className="flex shrink-0 flex-col gap-4 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground">
              Trợ lý AI vận hành kho
            </h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isFetching ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
              {isFetching ? "Đang phân tích dữ liệu" : "Sẵn sàng hỗ trợ"}
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-lg sm:w-auto"
          onClick={resetConversation}
          disabled={isFetching}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Cuộc hội thoại mới
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-muted/30 p-4 lg:block">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Gợi ý nhanh
              </p>
              <div className="mt-3 space-y-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void sendQuestion(item)}
                    disabled={isFetching}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Boxes className="h-4 w-4 text-primary" />
                Phạm vi hỗ trợ
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Tồn kho, đơn hàng, nhập kho, putaway, kiểm kê, cảnh báo và báo
                cáo vận hành.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ClipboardList className="h-4 w-4 text-primary" />
                Lưu ý
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Với số liệu quan trọng, hãy đối chiếu lại trong màn hình nghiệp
                vụ trước khi ra quyết định.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-5 sm:px-5">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              {messages.map((msg) => {
                const isUser = msg.role === "user";

                return (
                  <article
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isUser ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                    ) : null}

                    <div
                      className={cn(
                        "max-w-[min(44rem,85%)] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-card-foreground"
                      )}
                    >
                      {msg.content ? (
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Đang soạn câu trả lời...</span>
                        </div>
                      )}
                    </div>

                    {isUser ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    ) : null}
                  </article>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-border bg-card p-3 sm:p-4"
          >
            <div className="mx-auto flex w-full max-w-4xl items-end gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendQuestion(input);
                  }
                }}
                placeholder="Hỏi AI về tồn kho, đơn hàng, cảnh báo hoặc quy trình vận hành..."
                className="max-h-36 min-h-12 resize-none rounded-lg bg-background text-sm"
                disabled={isFetching}
              />
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-lg"
                disabled={!input.trim() || isFetching}
                aria-label="Gửi câu hỏi"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mx-auto mt-2 max-w-4xl text-xs text-muted-foreground">
              Nhấn Enter để gửi, Shift + Enter để xuống dòng.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
