"use client";

import { FormEvent, ReactNode, RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Boxes,
  ClipboardList,
  Pause,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLazyStreamAiAnswerQuery } from "@/store/services/ai.service";
import { axiosInstance } from "@/lib/axios-instance";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const AI_SESSION_STORAGE_KEY = "warehouse-ai-session-id";
const AI_MESSAGES_STORAGE_KEY = "warehouse-ai-messages";

const SUGGESTIONS = [
  "Tóm tắt tình hình tồn kho hôm nay",
  "Những SKU nào đang gần hết hàng?",
  "Đơn xuất nào cần ưu tiên xử lý?",
  "Kiểm tra các đơn nhập đang chờ putaway",
];

const INITIAL_MESSAGE: Message = {
  id: "initial-assistant-message",
  role: "assistant",
  content:
    "Xin chào, tôi là trợ lý AI vận hành kho StockMaster-WMS. Bạn muốn kiểm tra tồn kho, đơn hàng hay báo cáo vận hành?",
};

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const currentAssistantMsgId = useRef<string | null>(null);
  const activeStreamMsgId = useRef<string | null>(null);
  const activeRequestId = useRef<string | null>(null);
  const activeTriggerRef = useRef<{ abort: () => void } | null>(null);
  const sessionIdRef = useRef(createSessionId());
  const hasRestoredRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const busy = isStreaming || streamingMessageId !== null;

  const scrollMessagesToEnd = useCallback(() => {
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  useEffect(() => {
    if (!streamResult) return;
    if (streamResult.requestId !== activeRequestId.current) return;
    const msgId = activeStreamMsgId.current ?? currentAssistantMsgId.current;
    if (!msgId) return;

    setMessages((prev) =>
      prev.map((msg) => (msg.id === msgId ? { ...msg, content: streamResult.text } : msg))
    );
    scrollMessagesToEnd();
  }, [scrollMessagesToEnd, streamResult]);

  useEffect(() => {
    if (hasRestoredRef.current || typeof window === "undefined") return;
    hasRestoredRef.current = true;

    const storedSessionId = window.localStorage.getItem(AI_SESSION_STORAGE_KEY);
    if (storedSessionId) {
      sessionIdRef.current = storedSessionId;
    }

    const storedMessages = window.localStorage.getItem(AI_MESSAGES_STORAGE_KEY);
    if (!storedMessages) return;

    try {
      const parsed = JSON.parse(storedMessages) as Message[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
      }
    } catch {
      window.localStorage.removeItem(AI_MESSAGES_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AI_SESSION_STORAGE_KEY, sessionIdRef.current);
    window.localStorage.setItem(AI_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  async function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    if (busy || isFetching) {
      // cancel any in-progress stream before sending a new question
      await cancelStream();
    }

    const userMsg: Message = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };
    const assistantMsgId = createMessageId();
    const requestId = assistantMsgId;
    currentAssistantMsgId.current = assistantMsgId;
    activeStreamMsgId.current = assistantMsgId;
    activeRequestId.current = requestId;
    setStreamingMessageId(assistantMsgId);

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);
    scrollMessagesToEnd();
    setInput("");

    try {
      setIsStreaming(true);
      const streamPromise = triggerStream({
        question: trimmed,
        sessionId: sessionIdRef.current,
        requestId,
      });
      activeTriggerRef.current = streamPromise;

      const result = await streamPromise.unwrap();
      if (result.aborted) {
        if (activeRequestId.current === requestId) {
          if (result.text) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, content: result.text } : msg))
            );
          }
          activeStreamMsgId.current = null;
          activeRequestId.current = null;
          activeTriggerRef.current = null;
          setStreamingMessageId(null);
          setIsStreaming(false);
        }
        return;
      }
      // clear active streaming id after stream finishes
      if (activeRequestId.current === requestId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    result.text ||
                    "Tôi chưa nhận được nội dung trả lời. Bạn vui lòng thử lại.",
                }
              : msg
          )
        );
        scrollMessagesToEnd();
        activeStreamMsgId.current = null;
        activeRequestId.current = null;
        activeTriggerRef.current = null;
        setStreamingMessageId(null);
        setIsStreaming(false);
      }
    } catch {
      if (activeRequestId.current === requestId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    "Không thể kết nối trợ lý AI lúc này. Vui lòng kiểm tra hoặc thử lại sau.",
                }
              : msg
          )
        );
        scrollMessagesToEnd();
        activeStreamMsgId.current = null;
        activeRequestId.current = null;
        activeTriggerRef.current = null;
        setStreamingMessageId(null);
        setIsStreaming(false);
      }
    }
  }

  async function cancelStream() {
    const targetRequestId = activeRequestId.current;
    try {
      // Optimistically mark the active streaming assistant message as cancelled
      const targetId = activeStreamMsgId.current ?? currentAssistantMsgId.current;
      if (targetId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === targetId
              ? { ...m, content: m.content ? `${m.content}\n(Đã huỷ)` : "(Đã huỷ)" }
              : m
          )
        );
        scrollMessagesToEnd();
      }
      activeTriggerRef.current?.abort();
      activeStreamMsgId.current = null;
      activeRequestId.current = null;
      activeTriggerRef.current = null;
      setStreamingMessageId(null);
      setIsStreaming(false);

      const cancelRequest = axiosInstance.post("/v1/ai/cancel", null, {
        params: { sessionId: sessionIdRef.current, requestId: targetRequestId },
      });
      void cancelRequest.catch((error) => {
        console.error("Cancel stream error", error);
      });
    } catch (err) {
      console.error("Cancel stream error", err);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(input);
  }

  function resetConversation() {
    void cancelStream();
    currentAssistantMsgId.current = null;
    activeRequestId.current = null;
    activeTriggerRef.current = null;
    sessionIdRef.current = createSessionId();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AI_SESSION_STORAGE_KEY, sessionIdRef.current);
      window.localStorage.removeItem(AI_MESSAGES_STORAGE_KEY);
    }
    setStreamingMessageId(null);
    setIsStreaming(false);
    setInput("");
    setMessages([INITIAL_MESSAGE]);
    scrollMessagesToEnd();
  }

  return (
    <section className="flex h-[calc(100svh-7.5rem)] min-h-[38rem] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <AiAssistantHeader
        busy={busy}
        onReset={resetConversation}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <AiAssistantSidebar onAsk={sendQuestion} />

        <div className="flex min-h-0 flex-col">
          <AiMessages
            busy={busy}
            messages={messages}
            streamingMessageId={streamingMessageId}
            messagesEndRef={messagesEndRef}
            onCancel={cancelStream}
          />
          <AiComposer
            busy={busy}
            input={input}
            onInputChange={setInput}
            onCancel={cancelStream}
            onSubmit={handleSubmit}
            onSend={sendQuestion}
          />
        </div>
      </div>
    </section>
  );
}

function AiAssistantHeader({
  busy,
  onReset,
}: {
  busy: boolean;
  onReset: () => void;
}) {
  return (
    <header className="flex shrink-0 flex-col gap-4 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">
            Trợ lý AI vận hành kho
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("size-2 rounded-full", busy ? "bg-amber-500" : "bg-emerald-500")} />
            {busy ? "Đang phân tích dữ liệu" : "Sẵn sàng hỗ trợ"}
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full rounded-lg sm:w-auto"
        onClick={onReset}
      >
        <RotateCcw className="mr-1.5 size-4" />
        Cuộc hội thoại mới
      </Button>
    </header>
  );
}

function AiAssistantSidebar({ onAsk }: { onAsk: (question: string) => void }) {
  return (
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
                onClick={() => void onAsk(item)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <AiInfoBlock icon={Boxes} title="Phạm vi hỗ trợ">
          Tồn kho, đơn hàng, nhập kho, putaway, kiểm kê, cảnh báo và báo cáo vận hành.
        </AiInfoBlock>
        <AiInfoBlock icon={ClipboardList} title="Lưu ý">
          Với số liệu quan trọng, hãy đối chiếu lại trong màn hình nghiệp vụ trước khi ra quyết định.
        </AiInfoBlock>
      </div>
    </aside>
  );
}

function AiInfoBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Boxes;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{children}</p>
    </div>
  );
}

function AiMessages({
  busy,
  messages,
  streamingMessageId,
  messagesEndRef,
  onCancel,
}: {
  busy: boolean;
  messages: Message[];
  streamingMessageId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onCancel: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-5 sm:px-5">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        {messages.map((msg) => (
          <AiMessageBubble
            key={msg.id}
            busy={busy}
            message={msg}
            isStreaming={streamingMessageId === msg.id}
            onCancel={onCancel}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function AiMessageBubble({
  busy,
  message,
  isStreaming,
  onCancel,
}: {
  busy: boolean;
  message: Message;
  isStreaming: boolean;
  onCancel: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <article className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="size-4" />
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[min(44rem,85%)] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card text-card-foreground",
        )}
      >
        {message.content ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <TypingDots />
            {busy && isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onCancel}
                className="size-7 p-0"
                aria-label="Dừng trả lời"
              >
                <Pause className="size-4" />
              </Button>
            ) : null}
          </div>
        )}
      </div>

      {isUser ? (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground">
          <User className="size-4" />
        </div>
      ) : null}
    </article>
  );
}

function TypingDots() {
  return (
    <div className="flex h-6 items-center gap-1" aria-label="AI đang trả lời">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: `${dot * 120}ms` }}
        />
      ))}
    </div>
  );
}

function AiComposer({
  busy,
  input,
  onInputChange,
  onCancel,
  onSubmit,
  onSend,
}: {
  busy: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSend: (question: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-border bg-card p-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-4xl items-end gap-2">
        <Textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void onSend(input);
            }
          }}
          placeholder="Hỏi AI về tồn kho, đơn hàng, cảnh báo hoặc quy trình vận hành…"
          className="max-h-36 min-h-12 resize-none rounded-lg bg-background text-sm"
        />
        {busy ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="size-12 shrink-0 rounded-lg"
            onClick={onCancel}
            aria-label="Dừng trả lời"
          >
            <Pause className="size-4" />
          </Button>
        ) : null}
        <Button
          type="submit"
          size="icon"
          className="size-12 shrink-0 rounded-lg"
          disabled={!input.trim()}
          aria-label="Gửi câu hỏi"
        >
          <Send className="size-4" />
        </Button>
      </div>
      <p className="mx-auto mt-2 max-w-4xl text-xs text-muted-foreground">
        Nhấn Enter để gửi, Shift + Enter để xuống dòng.
      </p>
    </form>
  );
}
