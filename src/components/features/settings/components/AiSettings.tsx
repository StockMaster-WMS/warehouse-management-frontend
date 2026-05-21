"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, Cloud, KeyRound, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsField, SettingsPanel } from "@/components/settings/settings-layout";
import {
  type AiCloudKeyStatus,
  useClearAiCloudKeyMutation,
  useGetAiProviderKeyStatusesQuery,
  useUpdateAiCloudKeyMutation,
} from "@/store/services/ai.service";
import { apiErrMessage } from "@/types/api";
import { cn } from "@/lib/utils";

const FALLBACK_PROVIDERS: AiCloudKeyStatus[] = [
  { provider: "gemini", label: "Trợ lý Google", configured: false, keyPreview: null, updatedAt: null },
  { provider: "openai", label: "Trợ lý OpenAI", configured: false, keyPreview: null, updatedAt: null },
];

function mergeProviderStatuses(
  statuses: AiCloudKeyStatus[] | undefined,
  overrides: Record<string, AiCloudKeyStatus>,
) {
  const byProvider = new Map<string, AiCloudKeyStatus>();

  for (const item of FALLBACK_PROVIDERS) {
    byProvider.set(item.provider, item);
  }
  for (const item of statuses ?? []) {
    byProvider.set(item.provider, item);
  }
  for (const item of Object.values(overrides)) {
    byProvider.set(item.provider, item);
  }

  return Array.from(byProvider.values());
}

export function AiSettings() {
  const { data: statuses, isFetching, isError } = useGetAiProviderKeyStatusesQuery();
  const [updateKey, { isLoading: isSaving }] = useUpdateAiCloudKeyMutation();
  const [clearKey, { isLoading: isClearing }] = useClearAiCloudKeyMutation();
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [localStatuses, setLocalStatuses] = useState<Record<string, AiCloudKeyStatus>>({});

  const providerOptions = mergeProviderStatuses(statuses, localStatuses);
  const status = providerOptions.find((item) => item.provider === selectedProvider) ?? providerOptions[0];
  const configured = Boolean(status?.configured);
  const busy = isSaving || isClearing;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập khóa kết nối.");
      return;
    }

    try {
      const saved = await updateKey({ provider: selectedProvider, apiKey: trimmed }).unwrap();
      setLocalStatuses((prev) => ({ ...prev, [saved.provider]: saved }));
      setApiKey("");
      toast.success("Đã lưu khóa kết nối.");
    } catch (error) {
      toast.error(apiErrMessage(error, "Không thể lưu khóa kết nối."));
    }
  }

  async function handleClearKey() {
    try {
      const cleared = await clearKey(selectedProvider).unwrap();
      setLocalStatuses((prev) => ({ ...prev, [cleared.provider]: cleared }));
      setApiKey("");
      toast.success("Đã xóa khóa kết nối.");
    } catch (error) {
      toast.error(apiErrMessage(error, "Không thể xóa khóa kết nối."));
    }
  }

  return (
    <div className="space-y-6">
      <SettingsPanel
        icon={Cloud}
        title="Nhà cung cấp trợ lý đám mây"
        description="Chọn nhà cung cấp rồi nhập khóa kết nối. Mô hình cụ thể được chọn tại màn hình Trợ lý thông minh."
      >
          {isError ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Không tải được trạng thái</AlertTitle>
              <AlertDescription>
                Vui lòng kiểm tra quyền admin hoặc thử lại sau.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-border bg-muted/30">
              {configured ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <KeyRound className="size-4 text-amber-600" />
              )}
              <AlertTitle>
                {isFetching ? "Đang kiểm tra cấu hình" : configured ? "Đã cấu hình khóa kết nối" : "Chưa có khóa kết nối"}
              </AlertTitle>
              <AlertDescription>
                {configured
                  ? `${status?.label ?? "Nhà cung cấp"}: ${status?.keyPreview ?? "đã được lưu"}`
                  : `${status?.label ?? "Nhà cung cấp"} chưa có khóa kết nối.`}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nhà cung cấp
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {providerOptions.map((option) => {
                  const selected = option.provider === selectedProvider;
                  return (
                    <button
                      key={option.provider}
                      type="button"
                      onClick={() => {
                        setSelectedProvider(option.provider);
                        setApiKey("");
                      }}
                      disabled={busy}
                      className={cn(
                        "flex min-h-20 items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                        selected
                          ? "border-primary/40 bg-primary/5 text-foreground ring-1 ring-primary/10"
                          : "border-border bg-background hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                          selected
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Cloud className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {option.configured ? (
                            <>
                              <CheckCircle2 className="size-3.5 text-emerald-600" />
                              Đã cấu hình
                            </>
                          ) : (
                            <>
                              <KeyRound className="size-3.5 text-amber-600" />
                              Chưa cấu hình
                            </>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <SettingsField label="Khóa kết nối">
              <Input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={configured ? "Nhập khóa mới nếu muốn thay thế" : "Nhập khóa kết nối"}
                autoComplete="off"
                disabled={busy}
                className="h-10"
              />
            </SettingsField>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {configured ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearKey}
                  disabled={busy}
                  className="rounded-lg"
                >
                  {isClearing ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}
                  Xóa khóa
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={busy || !apiKey.trim()}
                className="rounded-lg"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Lưu khóa
              </Button>
            </div>
          </form>
      </SettingsPanel>
    </div>
  );
}
