"use client";

import { FormEvent, ReactNode, RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Boxes,
  ClipboardList,
  CheckCircle2,
  Pause,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AiActionRequest,
  AiActionResponse,
  AiResponseMetadata,
  useConfirmAiActionMutation,
  useLazyStreamAiAnswerQuery,
  usePreviewAiActionMutation,
} from "@/store/services/ai.service";
import { axiosInstance } from "@/lib/axios-instance";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  targetContent?: string;
  provider?: string;
  model?: string;
  modelConfirmed?: boolean;
  metadata?: AiResponseMetadata;
}

const AI_SESSION_STORAGE_KEY = "warehouse-ai-session-id";
const TYPEWRITER_INTERVAL_MS = 16;
const TYPEWRITER_CHARS_PER_TICK = 2;

const AI_PROVIDER = "ollama";
const AI_MODEL = "stockmaster-ai";

const SUGGESTIONS = [
  "Tóm tắt tình hình tồn kho hôm nay",
  "Những mã hàng nào đang gần hết hàng?",
  "Đơn xuất nào cần ưu tiên xử lý?",
  "Kiểm tra các đơn nhập đang chờ xếp hàng lên kệ",
  "Sản phẩm nào tồn kho cao nhất?",
  "Sản phẩm nào tồn kho thấp nhất?",
  "HN-TT-COLD-A01-R07-L02-B03 đang chứa gì",
];

const INITIAL_MESSAGE: Message = {
  id: "initial-assistant-message",
  role: "assistant",
  content:
    "Xin chào, tôi là trợ lý vận hành kho StockMaster-WMS. Bạn muốn kiểm tra tồn kho, đơn hàng hay báo cáo vận hành?",
};

function InlineMarkdown({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes.length ? nodes : text}</>;
}

function AiMessageContent({ content }: { content: string }) {
  return (
    <div className="break-words">
      {content.split("\n").map((line, index) => {
        if (!line.trim()) {
          return <div key={`blank-${index}`} className="h-2" />;
        }

        const isBullet = line.trimStart().startsWith("- ");
        return (
          <p key={`${index}-${line}`} className={cn(isBullet ? "pl-4 -indent-4" : "")}>
            <InlineMarkdown text={line} />
          </p>
        );
      })}
    </div>
  );
}

function AiStructuredMetadata({
  metadata,
  onAsk,
}: {
  metadata?: AiResponseMetadata;
  onAsk: (question: string) => void;
}) {
  if (!metadata) return null;
  const candidates = metadata.candidateSuggestions ?? [];
  const rows = metadata.resultRows ?? [];
  const actions = metadata.actions ?? [];
  const display = metadata.display;
  const columns = display?.columns?.filter((column) =>
    rows.some((row) => row[column] !== undefined && row[column] !== null && String(row[column]).trim() !== ""),
  ) ?? [];
  const visibleRows = rows.slice(0, 8);

  if (!actions.length && !candidates.length && (!visibleRows.length || !columns.length)) {
    return null;
  }

  return (
    <div className="space-y-3 border-t border-border/70 pt-3">
      {actions.length ? <AiActionPanel actions={actions} /> : null}

      {candidates.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            {display?.title || "Có phải bạn muốn hỏi?"}
          </p>
          <div className="flex flex-wrap gap-2">
            {candidates.slice(0, 4).map((candidate, index) => {
              const label = formatCandidateLabel(candidate);
              const query = firstString(candidate, ["query", "question"]) || label;
              return (
                <Button
                  key={`${label}-${index}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto max-w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium"
                  onClick={() => void onAsk(query)}
                >
                  <span className="truncate">{label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      {visibleRows.length && columns.length ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-semibold text-muted-foreground">
              {display?.title || "Dữ liệu trả về"}
            </p>
            {rows.length > visibleRows.length ? (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                Hiển thị {visibleRows.length}/{rows.length} dòng
              </span>
            ) : null}
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full table-fixed border-collapse text-xs">
              <thead className="bg-muted/70 text-muted-foreground">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="w-36 px-3 py-2 text-left font-medium">
                      {columnLabel(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {visibleRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => (
                      <td key={column} className="truncate px-3 py-2 text-foreground" title={formatCell(row[column])}>
                        {formatCell(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AiActionPanel({ actions }: { actions: Array<Record<string, unknown>> }) {
  return (
    <div className="space-y-2">
      {actions.map((action, index) => (
        <AiActionCard key={`${firstString(action, ["type", "actionType"])}-${index}`} action={action} />
      ))}
    </div>
  );
}

function AiActionCard({ action }: { action: Record<string, unknown> }) {
  const [previewAction, { isLoading: isPreviewing }] = usePreviewAiActionMutation();
  const [confirmAction, { isLoading: isConfirming }] = useConfirmAiActionMutation();
  const [preview, setPreview] = useState<AiActionResponse | null>(null);
  const [result, setResult] = useState<AiActionResponse | null>(null);
  const [error, setError] = useState("");

  const actionType = firstString(action, ["type", "actionType"]);
  const title = firstString(action, ["label", "title"]) || actionType;
  const description = firstString(action, ["description"]);
  const payload = action.payload && typeof action.payload === "object"
    ? action.payload as Record<string, unknown>
    : action;
  const request = toAiActionRequest(payload, actionType);
  const canRun = actionType === "MARK_PRODUCTS_OUT_OF_STOCK";

  async function handlePreview() {
    setError("");
    setResult(null);
    try {
      const response = await previewAction(request).unwrap();
      setPreview(response);
    } catch {
      setError("Không thể xem trước thao tác AI.");
    }
  }

  async function handleConfirm() {
    setError("");
    try {
      const response = await confirmAction(request).unwrap();
      setResult(response);
      setPreview(response);
    } catch {
      setError("Không thể xác nhận thao tác. Bạn cần quyền ADMIN hoặc WAREHOUSE_MANAGER.");
    }
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
        </div>
        {canRun ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={isPreviewing || isConfirming}
            onClick={handlePreview}
          >
            Xem trước
          </Button>
        ) : null}
      </div>

      {preview ? (
        <div className="mt-3 space-y-2 rounded-md border border-border bg-background p-2 text-xs">
          <p className="font-medium text-foreground">{result?.summary || preview.summary}</p>
          <p className="text-muted-foreground">
            Đủ điều kiện: {preview.eligibleCount}/{preview.candidateCount}; bỏ qua: {preview.skippedCount}
          </p>
          {preview.warnings.length ? (
            <div className="space-y-1 text-amber-700">
              {preview.warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          ) : null}
          {preview.candidates.length ? (
            <div className="max-h-40 overflow-y-auto rounded border border-border">
              {preview.candidates.slice(0, 8).map((candidate) => (
                <div key={candidate.sku} className="flex gap-2 border-b border-border px-2 py-1.5 last:border-b-0">
                  <span className="font-mono text-[11px]">{candidate.sku}</span>
                  <span className="min-w-0 flex-1 truncate">{candidate.productName}</span>
                  <span className={cn(candidate.eligible ? "text-emerald-600" : "text-muted-foreground")}>
                    {candidate.eligible ? "Có thể cập nhật" : "Bỏ qua"}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {!result ? (
            <Button
              type="button"
              size="sm"
              className="mt-1"
              disabled={isConfirming || preview.eligibleCount === 0}
              onClick={handleConfirm}
            >
              <CheckCircle2 className="size-3.5" />
              Xác nhận cập nhật
            </Button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function toAiActionRequest(payload: Record<string, unknown>, fallbackActionType: string): AiActionRequest {
  const skuList = Array.isArray(payload.skuList)
    ? payload.skuList.filter((item): item is string => typeof item === "string")
    : [];
  const limitValue = payload.limit;
  return {
    actionType: firstString(payload, ["actionType", "type"]) || fallbackActionType,
    source: firstString(payload, ["source"]) || "AI_SUGGESTION",
    skuList,
    targetStatus: firstString(payload, ["targetStatus"]) || "OUT_OF_STOCK",
    reason: firstString(payload, ["reason"]) || "Người dùng xác nhận thao tác AI",
    limit: typeof limitValue === "number" ? limitValue : undefined,
    metadata: payload,
  };
}

function firstString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function formatCandidateLabel(candidate: Record<string, unknown>) {
  const sku = firstString(candidate, ["sku", "code"]);
  const name = firstString(candidate, ["product_name", "name"]);
  if (sku && name) return `${sku} - ${name}`;
  return sku || name || "Chọn mục này";
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "number") return new Intl.NumberFormat("vi-VN").format(value);
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}

function columnLabel(column: string) {
  const labels: Record<string, string> = {
    sku: "SKU",
    product_name: "Sản phẩm",
    warehouse_code: "Kho",
    location_code: "Vị trí",
    lot_number: "Lô",
    expiry_date: "Hạn dùng",
    days_left: "Ngày còn lại",
    qty_on_hand: "Tồn",
    qty_reserved: "Giữ chỗ",
    qty_available: "Khả dụng",
    category_name: "Danh mục",
    status: "Trạng thái",
    code: "Mã",
    name: "Tên",
    product_count: "Số SP",
    contact_name: "Liên hệ",
    username: "Tài khoản",
    full_name: "Họ tên",
    roles: "Vai trò",
    warehouses: "Kho",
  };
  return labels[column] ?? column.replaceAll("_", " ");
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `warehouse-ai-${crypto.randomUUID()}`;
  }
  return `warehouse-ai-${createMessageId()}`;
}

function getInitialSessionId() {
  if (typeof window === "undefined") return createSessionId();
  return window.sessionStorage.getItem(AI_SESSION_STORAGE_KEY) ?? createSessionId();
}

function getInitialMessages(): Message[] {
  return [INITIAL_MESSAGE];
}

export default function AiAssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [triggerStream, { data: streamResult, isFetching }] =
    useLazyStreamAiAnswerQuery();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const currentAssistantMsgId = useRef<string | null>(null);
  const activeStreamMsgId = useRef<string | null>(null);
  const activeRequestId = useRef<string | null>(null);
  const activeTriggerRef = useRef<{ abort: () => void } | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  if (sessionIdRef.current === null) {
    sessionIdRef.current = getInitialSessionId();
  }
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
      prev.map((msg) =>
        msg.id === msgId
          ? {
              ...msg,
              targetContent: streamResult.text,
              provider: streamResult.provider || msg.provider,
              model: streamResult.model || msg.model,
              modelConfirmed: Boolean(streamResult.modelConfirmed) || msg.modelConfirmed,
              metadata: streamResult.metadata ?? msg.metadata,
            }
          : msg
      )
    );
    scrollMessagesToEnd();
  }, [scrollMessagesToEnd, streamResult]);

  useEffect(() => {
    if (!streamingMessageId) return;
    const message = messages.find((msg) => msg.id === streamingMessageId);
    if (!message) return;

    const targetContent = message.targetContent ?? "";
    if (!targetContent) return;

    if (message.content === targetContent) {
      if (!isStreaming) {
        const clearTimer = window.setTimeout(() => {
          activeStreamMsgId.current = null;
          setStreamingMessageId(null);
        }, 0);

        return () => window.clearTimeout(clearTimer);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== streamingMessageId) return msg;
          const target = msg.targetContent ?? "";
          if (!target || msg.content === target) return msg;
          const nextLength = Math.min(
            msg.content.length + TYPEWRITER_CHARS_PER_TICK,
            target.length,
          );
          return { ...msg, content: target.slice(0, nextLength) };
        })
      );
      scrollMessagesToEnd();
    }, TYPEWRITER_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [isStreaming, messages, scrollMessagesToEnd, streamingMessageId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(AI_SESSION_STORAGE_KEY, sessionIdRef.current!);
  }, []);

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
      { id: assistantMsgId, role: "assistant", content: "", targetContent: "" },
    ]);
    scrollMessagesToEnd();
    setInput("");

    try {
      setIsStreaming(true);
      const streamPromise = triggerStream({
        question: trimmed,
        sessionId: sessionIdRef.current!,
        requestId,
        provider: AI_PROVIDER,
        model: AI_MODEL,
      });
      activeTriggerRef.current = streamPromise;

      const result = await streamPromise.unwrap();
      if (result.aborted) {
        if (activeRequestId.current === requestId) {
          if (result.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, targetContent: result.text, metadata: result.metadata ?? msg.metadata }
                  : msg
              )
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
                  targetContent:
                    result.text ||
                    "Tôi chưa nhận được nội dung trả lời. Bạn vui lòng thử lại.",
                  provider: result.provider || msg.provider,
                  model: result.model || msg.model,
                  modelConfirmed: Boolean(result.modelConfirmed) || msg.modelConfirmed,
                  metadata: result.metadata ?? msg.metadata,
                }
              : msg
          )
        );
        scrollMessagesToEnd();
        activeRequestId.current = null;
        activeTriggerRef.current = null;
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
                    "Không thể kết nối trợ lý lúc này. Vui lòng kiểm tra hoặc thử lại sau.",
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
        params: { sessionId: sessionIdRef.current!, requestId: targetRequestId },
      });
      void cancelRequest.catch(() => undefined);
    } catch {
      // Stream cancellation is best-effort; the local UI has already stopped.
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
      window.sessionStorage.setItem(AI_SESSION_STORAGE_KEY, sessionIdRef.current);
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
            messages={messages}
            messagesEndRef={messagesEndRef}
            onAsk={sendQuestion}
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
    <header className="flex shrink-0 flex-col gap-4 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">
            Trợ lý vận hành kho
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
  messages,
  messagesEndRef,
  onAsk,
}: {
  messages: Message[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onAsk: (question: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-3 py-5 sm:px-5">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        {messages.map((msg) => (
          <AiMessageBubble
            key={msg.id}
            message={msg}
            onAsk={onAsk}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function AiMessageBubble({
  message,
  onAsk,
}: {
  message: Message;
  onAsk: (question: string) => void;
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
          <div className="space-y-3">
            <AiMessageContent content={message.content} />
            {!isUser ? (
              <AiStructuredMetadata metadata={message.metadata} onAsk={onAsk} />
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <TypingDots />
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
    <div className="flex h-6 items-center gap-1" aria-label="Trợ lý đang trả lời">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-2 rounded-full bg-muted-foreground animate-pulse"
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
          placeholder="Hỏi trợ lý về tồn kho, đơn hàng, cảnh báo hoặc quy trình vận hành…"
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
        ) : (
          <Button
            type="submit"
            size="icon"
            className="size-12 shrink-0 rounded-lg"
            disabled={!input.trim()}
            aria-label="Gửi câu hỏi"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>
      <div className="mx-auto mt-2 flex w-full max-w-4xl justify-end">
        <p className="text-xs text-muted-foreground">
          Nhấn Enter để gửi, Shift + Enter để xuống dòng.
        </p>
      </div>
    </form>
  );
}
