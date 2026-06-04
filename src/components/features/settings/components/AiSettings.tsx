"use client";

import { Bot, Cpu, Server } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SettingsField, SettingsPanel } from "@/components/settings/settings-layout";

export function AiSettings() {
  return (
    <div className="space-y-6">
      <SettingsPanel
        icon={Bot}
        title="Trợ lý AI nội bộ"
        description="Hệ thống đang dùng mô hình StockMaster chạy qua Ollama, không cần cấu hình khóa API bên ngoài."
      >
        <Alert className="border-border bg-muted/30">
          <Cpu className="size-4 text-primary" />
          <AlertTitle>Mô hình đang sử dụng</AlertTitle>
          <AlertDescription>
            Mô hình nội bộ: <span className="font-medium text-foreground">stockmaster-ai</span>
          </AlertDescription>
        </Alert>

        <SettingsField label="Nguồn xử lý">
          <div className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground">
            <Server className="size-4" />
            Ollama local qua backend
          </div>
        </SettingsField>
      </SettingsPanel>
    </div>
  );
}
