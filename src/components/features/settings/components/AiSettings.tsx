"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, Cloud, KeyRound, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type AiCloudKeyStatus,
  useClearAiCloudKeyMutation,
  useGetAiProviderKeyStatusesQuery,
  useUpdateAiCloudKeyMutation,
} from "@/store/services/ai.service";
import { apiErrMessage } from "@/types/api";
import { cn } from "@/lib/utils";

const FALLBACK_PROVIDERS: AiCloudKeyStatus[] = [
  { provider: "gemini", label: "Trợ lý AI Google", configured: false, keyPreview: null, updatedAt: null },
  { provider: "openai", label: "Trợ lý AI OpenAI", configured: false, keyPreview: null, updatedAt: null },
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
      toast.error("Vui lòng nhập API key.");
      return;
    }

    try {
      const saved = await updateKey({ provider: selectedProvider, apiKey: trimmed }).unwrap();
      setLocalStatuses((prev) => ({ ...prev, [saved.provider]: saved }));
      setApiKey("");
      toast.success("Đã lưu API key.");
    } catch (error) {
      toast.error(apiErrMessage(error, "Không thể lưu API key."));
    }
  }

  async function handleClearKey() {
    try {
      const cleared = await clearKey(selectedProvider).unwrap();
      setLocalStatuses((prev) => ({ ...prev, [cleared.provider]: cleared }));
      setApiKey("");
      toast.success("Đã xóa API key.");
    } catch (error) {
      toast.error(apiErrMessage(error, "Không thể xóa API key."));
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cloud className="h-4 w-4 text-indigo-600" />
            Provider AI đám mây
          </CardTitle>
          <CardDescription>
            Chọn provider rồi nhập API key. Backend tự dùng model và API URL mặc định.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Không tải được trạng thái</AlertTitle>
              <AlertDescription>
                Vui lòng kiểm tra quyền admin hoặc thử lại sau.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
              {configured ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <KeyRound className="h-4 w-4 text-amber-600" />
              )}
              <AlertTitle>
                {isFetching ? "Đang kiểm tra cấu hình" : configured ? "Đã cấu hình API key" : "Chưa có API key"}
              </AlertTitle>
              <AlertDescription>
                {configured
                  ? `${status?.label ?? "Provider"}: ${status?.keyPreview ?? "đã được lưu"}`
                  : `${status?.label ?? "Provider"} chưa có API key.`}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Provider
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
                        "flex min-h-20 items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                        selected
                          ? "border-indigo-300 bg-indigo-50 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-100"
                          : "border-border bg-background hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          selected
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Cloud className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {option.configured ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Đã có key
                            </>
                          ) : (
                            <>
                              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
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

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                API key
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={configured ? "Nhập key mới nếu muốn thay thế" : "Nhập API key"}
                autoComplete="off"
                disabled={busy}
                className="h-10"
              />
            </div>

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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Xóa key
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={busy || !apiKey.trim()}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu API key
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
