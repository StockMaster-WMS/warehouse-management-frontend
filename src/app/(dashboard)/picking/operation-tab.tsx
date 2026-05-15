"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  MapPin,
  PackageCheck,
  Play,
  RotateCcw,
  ScanBarcode,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import {
  useGetPickingItemByIdQuery,
  useGetPickingItemsQuery,
  useReportPickingExceptionMutation,
  useUpdatePickingItemMutation,
} from "@/store/services/picking-item.service";
import type { PickingItem } from "@/types/picking-item";

type PickStep = "location" | "sku" | "qty";

type OperationTabProps = {
  onClose?: () => void;
};

const EXCEPTION_REASONS = [
  {
    label: "Thiếu hàng tại vị trí",
    value: "Thiếu hàng tại vị trí",
    description: "Không đủ số lượng cần lấy trong bin/kệ hiện tại.",
  },
  {
    label: "Sai vị trí",
    value: "Sai vị trí/Không tìm thấy hàng",
    description: "Không tìm thấy đúng SKU tại vị trí hệ thống chỉ định.",
  },
  {
    label: "Hàng hỏng hoặc lỗi",
    value: "Hàng bị hỏng/Lỗi",
    description: "Sản phẩm không đạt điều kiện xuất kho.",
  },
  {
    label: "Barcode không khớp",
    value: "Barcode không khớp",
    description: "Mã quét không trùng SKU hoặc EAN của tác vụ.",
  },
];

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function sortByPickPath(items: PickingItem[]) {
  return [...items].sort((a, b) => {
    const sequenceDiff = Number(a.pickSequence ?? 9999) - Number(b.pickSequence ?? 9999);
    if (sequenceDiff !== 0) return sequenceDiff;

    const zoneDiff = normalize(a.zone).localeCompare(normalize(b.zone));
    if (zoneDiff !== 0) return zoneDiff;

    const aisleDiff = normalize(a.aisle).localeCompare(normalize(b.aisle));
    if (aisleDiff !== 0) return aisleDiff;

    return normalize(a.locationCode).localeCompare(normalize(b.locationCode));
  });
}

function getTaskTitle(item: PickingItem) {
  return item.productName && item.productName !== "Sản phẩm không tên"
    ? item.productName
    : item.productSku || item.productCode || "Sản phẩm cần lấy";
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function StepPill({
  step,
  currentStep,
  done,
  label,
}: {
  step: PickStep;
  currentStep: PickStep;
  done: boolean;
  label: string;
}) {
  const active = step === currentStep;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-bold",
        done
          ? "border-success/20 bg-success-soft text-success-foreground"
          : active
            ? "border-primary/25 bg-primary/10 text-primary"
            : "border-border bg-muted/50 text-muted-foreground"
      )}
    >
      {done ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : null}
      <span className="truncate">{label}</span>
    </div>
  );
}

export function OperationTab({ onClose }: OperationTabProps) {
  const { data: pagedData, isLoading, isFetching, refetch } = useGetPickingItemsQuery({
    size: 200,
  });
  const [updatePickingItem, { isLoading: isCompleting }] =
    useUpdatePickingItemMutation();
  const [reportException, { isLoading: isReporting }] =
    useReportPickingExceptionMutation();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<PickStep>("location");
  const [scannedLoc, setScannedLoc] = useState("");
  const [scannedSku, setScannedSku] = useState("");
  const [pickedQty, setPickedQty] = useState("");
  const [isExceptionOpen, setIsExceptionOpen] = useState(false);

  const allItems = useMemo(() => pagedData?.data?.content ?? [], [pagedData]);
  const pendingTasks = useMemo(
    () =>
      sortByPickPath(
        allItems.filter(
          (item) => item.status === "PENDING" && !doneIds.includes(item.id)
        )
      ),
    [allItems, doneIds]
  );
  const completedCount = allItems.filter((item) => item.status === "PICKED").length + doneIds.length;
  const totalCount = allItems.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const activeSummary =
    pendingTasks.find((task) => task.id === selectedTaskId) ?? null;
  const activeIndex = activeSummary
    ? pendingTasks.findIndex((task) => task.id === activeSummary.id)
    : -1;

  const { data: detailData, isFetching: isDetailFetching } =
    useGetPickingItemByIdQuery(activeSummary?.id as string, {
      skip: !activeSummary?.id,
    });

  const activeItem = useMemo(() => {
    if (!activeSummary) return null;
    return detailData?.data ? { ...activeSummary, ...detailData.data } : activeSummary;
  }, [activeSummary, detailData]);

  useEffect(() => {
    if (!sessionStarted || selectedTaskId || pendingTasks.length === 0) return;
    setSelectedTaskId(pendingTasks[0].id);
  }, [pendingTasks, selectedTaskId, sessionStarted]);

  useEffect(() => {
    setCurrentStep("location");
    setScannedLoc("");
    setScannedSku("");
    setPickedQty("");
  }, [selectedTaskId]);

  function chooseNextTask(finishedTaskId: string) {
    const nextTask = pendingTasks.find((task) => task.id !== finishedTaskId);
    setSelectedTaskId(nextTask?.id ?? null);
  }

  function finishTaskLocally(taskId: string) {
    setDoneIds((prev) => (prev.includes(taskId) ? prev : [...prev, taskId]));
    window.setTimeout(() => chooseNextTask(taskId), 450);
  }

  function handleStart() {
    if (pendingTasks.length === 0) return;
    setSessionStarted(true);
    setSelectedTaskId(pendingTasks[0].id);
  }

  function handleScanLocation() {
    if (!activeItem) return;

    const scanned = normalize(scannedLoc);
    const expected = normalize(activeItem.locationCode || activeItem.locationId);

    if (!scanned || scanned !== expected) {
      toast.error("Vị trí không khớp. Kiểm tra lại mã kệ/bin.");
      setScannedLoc("");
      return;
    }

    toast.success("Đã xác thực đúng vị trí");
    setCurrentStep("sku");
  }

  function handleScanSku() {
    if (!activeItem) return;

    const scanned = normalize(scannedSku);
    const validCodes = [
      activeItem.productSku,
      activeItem.productCode,
      activeItem.productId,
      activeItem.barcodeEan13,
    ].map(normalize);

    if (!scanned || !validCodes.includes(scanned)) {
      toast.error("Mã sản phẩm không khớp.");
      setScannedSku("");
      return;
    }

    toast.success("Đã xác nhận đúng sản phẩm");
    setPickedQty(String(activeItem.qtyToPick));
    setCurrentStep("qty");
  }

  async function handleConfirmPick() {
    if (!activeItem) return;

    const qty = Number(pickedQty);
    if (!Number.isFinite(qty) || qty <= 0 || qty > activeItem.qtyToPick) {
      toast.error("Số lượng lấy không hợp lệ.");
      return;
    }

    try {
      await updatePickingItem({
        id: activeItem.id,
        soItemId: activeItem.soItemId,
        productId: activeItem.productId,
        locationId: activeItem.locationId,
        lotNumber: activeItem.lotNumber,
        pickSequence: activeItem.pickSequence,
        qtyToPick: activeItem.qtyToPick,
        qtyPicked: qty,
        status: "PICKED",
      }).unwrap();

      toast.success("Đã hoàn tất tác vụ lấy hàng");
      finishTaskLocally(activeItem.id);
      void refetch();
    } catch {
      toast.error("Không thể cập nhật tác vụ lấy hàng.");
    }
  }

  async function handleReportException(reason: string) {
    if (!activeItem) return;

    try {
      await reportException({
        id: activeItem.id,
        soItemId: activeItem.soItemId,
        reason,
      }).unwrap();

      toast.error("Đã ghi nhận ngoại lệ và chuyển sang tác vụ tiếp theo");
      setIsExceptionOpen(false);
      finishTaskLocally(activeItem.id);
      void refetch();
    } catch {
      toast.error("Không thể ghi nhận ngoại lệ.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Đang đồng bộ tác vụ lấy hàng
        </p>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <MobileHeader onClose={onClose} title="Lấy hàng" subtitle="Không có tác vụ" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <PackageCheck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-black text-foreground">
              Chưa có tác vụ picking
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Khi có đơn xuất cần lấy hàng, danh sách sẽ xuất hiện tại đây.
            </p>
            <Button className="mt-5 w-full rounded-lg" onClick={() => refetch()}>
              Làm mới
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (pendingTasks.length === 0) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <MobileHeader onClose={onClose} title="Lấy hàng" subtitle="Hoàn tất tuyến" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success-foreground">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="mt-5 text-xl font-black uppercase text-foreground">
              Đã hoàn tất
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Toàn bộ tác vụ trong tuyến lấy hàng hiện tại đã được xử lý.
            </p>
            <Button
              className="mt-5 h-12 w-full rounded-lg font-bold"
              onClick={() => {
                setSessionStarted(false);
                setSelectedTaskId(null);
                setDoneIds([]);
                void refetch();
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Đồng bộ lại danh sách
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionStarted || !activeItem) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <MobileHeader onClose={onClose} title="Lấy hàng" subtitle="Chuẩn bị tuyến" />
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mx-auto max-w-sm space-y-4">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Tiến độ hôm nay
                  </p>
                  <h1 className="mt-2 text-2xl font-black text-foreground">
                    {pendingTasks.length} tác vụ chờ
                  </h1>
                </div>
                <StatusBadge tone={isFetching ? "warning" : "info"}>
                  {isFetching ? "Đang sync" : "Sẵn sàng"}
                </StatusBadge>
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Đã xử lý</span>
                  <span>
                    {Math.min(completedCount, totalCount)}/{totalCount}
                  </span>
                </div>
                <ProgressBar value={progress} />
              </div>
              <Button
                className="mt-5 h-12 w-full rounded-lg font-black"
                onClick={handleStart}
              >
                <Play className="mr-2 h-4 w-4" />
                Bắt đầu lấy hàng
              </Button>
            </div>

            <TaskRouteList
              tasks={pendingTasks}
              selectedTaskId={selectedTaskId}
              onSelect={(id) => {
                setSessionStarted(true);
                setSelectedTaskId(id);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const locationDone = currentStep !== "location";
  const skuDone = currentStep === "qty";

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <MobileHeader
        onClose={onClose}
        title="Đang lấy hàng"
        subtitle={`Task ${activeIndex + 1}/${pendingTasks.length}`}
        right={<StatusBadge tone="info">Đang lấy</StatusBadge>}
      />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <div className="mx-auto max-w-sm space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-lg"
                onClick={() => {
                  setSessionStarted(false);
                  setSelectedTaskId(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Tuyến lấy hàng</span>
                  <span>
                    {Math.min(completedCount, totalCount)}/{totalCount}
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={progress} />
                </div>
              </div>
            </div>
          </div>

          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                    Vị trí cần đến
                  </p>
                  <h2 className="mt-2 truncate font-mono text-3xl font-black leading-none text-foreground">
                    {activeItem.locationCode || "N/A"}
                  </h2>
                  {(activeItem.zone || activeItem.aisle) ? (
                    <p className="mt-2 text-xs font-bold text-muted-foreground">
                      {[activeItem.zone, activeItem.aisle].filter(Boolean).join(" / ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                  Sản phẩm
                </p>
                <h3 className="mt-1 text-base font-black leading-tight text-foreground">
                  {getTaskTitle(activeItem)}
                </h3>
                <p className="mt-1 font-mono text-xs font-bold uppercase text-muted-foreground">
                  {activeItem.productSku || activeItem.productCode || activeItem.barcodeEan13 || "—"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <StepPill
                  step="location"
                  currentStep={currentStep}
                  done={locationDone}
                  label="Vị trí"
                />
                <StepPill
                  step="sku"
                  currentStep={currentStep}
                  done={skuDone}
                  label="SKU"
                />
                <StepPill
                  step="qty"
                  currentStep={currentStep}
                  done={false}
                  label="Số lượng"
                />
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-muted-foreground">
                    Cần lấy
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tabular-nums text-foreground">
                      {activeItem.qtyToPick}
                    </span>
                    <span className="text-xs font-bold uppercase text-muted-foreground">
                      {activeItem.baseUnit || "đv"}
                    </span>
                  </div>
                </div>
              </div>

              {isDetailFetching ? (
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs font-bold text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải chi tiết tác vụ...
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            {currentStep === "location" ? (
              <ScanField
                label="Bước 1: quét vị trí"
                placeholder="Quét hoặc nhập mã vị trí"
                value={scannedLoc}
                onChange={setScannedLoc}
                onSubmit={handleScanLocation}
                icon={<MapPin className="h-5 w-5" />}
                autoFocus
              />
            ) : null}

            {currentStep === "sku" ? (
              <ScanField
                label="Bước 2: quét SKU/barcode"
                placeholder="Quét hoặc nhập mã sản phẩm"
                value={scannedSku}
                onChange={setScannedSku}
                onSubmit={handleScanSku}
                icon={<Box className="h-5 w-5" />}
                autoFocus
              />
            ) : null}

            {currentStep === "qty" ? (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                  Bước 3: xác nhận số lượng thực lấy
                </p>
                <Input
                  type="number"
                  min={1}
                  max={activeItem.qtyToPick}
                  value={pickedQty}
                  onChange={(event) => setPickedQty(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleConfirmPick();
                  }}
                  className="h-14 rounded-lg font-mono text-xl font-black"
                  autoFocus
                />
              </div>
            ) : null}
          </section>
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex max-w-sm gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 rounded-lg font-bold"
            onClick={() => setIsExceptionOpen(true)}
            disabled={isCompleting || isReporting}
          >
            Báo lỗi
          </Button>
          <Button
            type="button"
            className="h-12 flex-[1.4] rounded-lg font-black"
            onClick={() => void handleConfirmPick()}
            disabled={currentStep !== "qty" || isCompleting || isReporting}
          >
            {isCompleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ClipboardCheck className="mr-2 h-4 w-4" />
            )}
            Xác nhận
          </Button>
        </div>
      </footer>

      <Dialog open={isExceptionOpen} onOpenChange={setIsExceptionOpen}>
        <DialogContent className="top-auto bottom-0 left-0 max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl p-0 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2">
          <DialogHeader className="border-b border-border p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-soft text-warning-foreground">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black">
                  Báo lỗi tác vụ
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Chọn lý do để ghi nhận ngoại lệ và chuyển sang tác vụ kế tiếp.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-2 p-4">
            {EXCEPTION_REASONS.map((reason) => (
              <button
                key={reason.value}
                type="button"
                disabled={isReporting}
                onClick={() => void handleReportException(reason.value)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-warning/40 hover:bg-warning-soft/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  <span className="block text-sm font-black text-foreground">
                    {reason.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {reason.description}
                  </span>
                </span>
                {isReporting ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MobileHeader({
  onClose,
  title,
  subtitle,
  right,
}: {
  onClose?: () => void;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ScanBarcode className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-black uppercase tracking-wide text-foreground">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-xs font-bold text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-lg"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </header>
  );
}

function TaskRouteList({
  tasks,
  selectedTaskId,
  onSelect,
}: {
  tasks: PickingItem[];
  selectedTaskId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
        Tuyến lấy hàng đề xuất
      </p>
      <div className="mt-3 space-y-2">
        {tasks.slice(0, 12).map((task, index) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onSelect(task.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              selectedTaskId === task.id
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-background hover:border-primary/30"
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-black text-muted-foreground">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-foreground">
                {task.locationCode || "N/A"}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {task.productSku || getTaskTitle(task)} · x{task.qtyToPick}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ScanField({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  icon,
  autoFocus,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  icon: React.ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="relative">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
          }}
          placeholder={placeholder}
          className="h-14 rounded-lg pr-14 font-mono text-base font-black uppercase"
          autoFocus={autoFocus}
        />
        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      </div>
      <Button
        type="button"
        className="h-11 w-full rounded-lg font-bold"
        onClick={onSubmit}
        disabled={!value.trim()}
      >
        Tiếp tục
      </Button>
    </div>
  );
}
