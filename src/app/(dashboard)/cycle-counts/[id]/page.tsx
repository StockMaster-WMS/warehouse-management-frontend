"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Scale,
  Save,
  AlertTriangle,
  Info,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  useGetCycleCountByIdQuery,
  useStartCycleCountMutation,
  useRecordCycleCountMutation,
  useSubmitCycleCountMutation,
  useCompleteCycleCountMutation,
  useRejectCycleCountMutation,
  useCancelCycleCountMutation,
} from "@/store/services/cycle-count.service";
import { apiErrMessage } from "@/types/api";
import type { CycleCountLine, CycleCountStatus } from "@/types/cycle-count";
import { cn } from "@/lib/utils";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
import { useHasPermissions } from "@/components/permission-control";
import { Textarea } from "@/components/ui/textarea";
import {
  DetailPageLayout,
  DetailBreadcrumb,
  DetailSection,
  DetailStatusBadge,
  DetailSkeleton,
  DetailErrorState,
} from "@/components/detail-page";
import type { StatusConfig } from "@/components/detail-page";
import { PrintableDocumentModal } from "@/components/features/PrintableDocumentModal";

// ─── Status display helpers ───────────────────────────────────────────────────

const CYCLE_COUNT_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: { label: "Chờ bắt đầu", color: "slate" },
  IN_PROGRESS: { label: "Đang kiểm kê", color: "blue" },
  PENDING_REVIEW: { label: "Chờ duyệt", color: "amber" },
  APPROVED: { label: "Đã duyệt", color: "emerald" },
  RECOUNT_REQUIRED: { label: "Cần kiểm lại", color: "amber" },
  CANCELLED: { label: "Đã huỷ", color: "rose" },
  COMPLETED: { label: "Chờ duyệt", color: "amber" },
  DRAFT: { label: "Nháp", color: "slate" },
  OPEN: { label: "Đã mở", color: "blue" },
  COUNTING: { label: "Đang kiểm", color: "blue" },
  REVIEW: { label: "Chờ duyệt", color: "amber" },
};

/** Can user enter counts? */
function isCountingPhase(status: CycleCountStatus) {
  return status === "IN_PROGRESS" || status === "COUNTING";
}

/** Show "Start" button */
function canStart(status: CycleCountStatus) {
  return status === "PENDING" || status === "RECOUNT_REQUIRED" || status === "OPEN" || status === "DRAFT";
}

/** Show "Approve" button */
function canApprove(status: CycleCountStatus) {
  return status === "PENDING_REVIEW" || status === "COMPLETED" || status === "REVIEW";
}

/** Can cancel */
function canCancel(status: CycleCountStatus) {
  return status === "PENDING" || status === "RECOUNT_REQUIRED" || status === "OPEN" || status === "IN_PROGRESS" || status === "COUNTING";
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("vi-VN");
}

function scopeLabel(scope?: string | null) {
  switch (scope) {
    case "WAREHOUSE":
      return "Toàn bộ kho";
    case "ZONE":
      return "Khu vực";
    case "PRODUCT":
      return "Sản phẩm";
    case "LOCATION":
      return "Vị trí";
    default:
      return "—";
  }
}

function buildCycleCountResults(
  lines: readonly CycleCountLine[],
  actualCounts: Record<string, number>,
  notesByLine: Record<string, string> = {},
) {
  const results = [];
  for (const line of lines ?? []) {
    if (!line.id) continue;
    const prevCounted = line.countedQty ?? line.receivedQty;
    results.push({
      itemId: line.id,
      actualQty: actualCounts[line.id] !== undefined ? actualCounts[line.id] : (prevCounted ?? 0),
      notes: notesByLine[line.id]?.trim() || line.notes || line.note || undefined,
    });
  }
  return results;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CycleCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { push } = useRouter();
  const canManageCycleCount = useHasPermissions(ADMIN_MANAGER_ROLES);

  const { data: countRes, isLoading, refetch, isFetching } = useGetCycleCountByIdQuery(id);
  const count = countRes?.data;

  const [startCount, { isLoading: isStarting }] = useStartCycleCountMutation();
  const [recordResults, { isLoading: isRecording }] = useRecordCycleCountMutation();
  const [submitCount, { isLoading: isSubmitting }] = useSubmitCycleCountMutation();
  const [completeCount, { isLoading: isCompleting }] = useCompleteCycleCountMutation();
  const [rejectCount, { isLoading: isRejecting }] = useRejectCycleCountMutation();
  const [cancelCount, { isLoading: isCancelling }] = useCancelCycleCountMutation();

  // Local state: map lineId -> actual count entered by user
  const [actualCounts, setActualCounts] = useState<Record<string, number>>({});
  const [notesByLine, setNotesByLine] = useState<Record<string, string>>({});
  const [printOpen, setPrintOpen] = useState(false);
  const handleRecordChange = (lineId: string, value: string) => {
    if (value.trim() === "") {
      setActualCounts((prev) => {
        const next = { ...prev };
        delete next[lineId];
        return next;
      });
      return;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return;
    }

    setActualCounts(prev => ({
      ...prev,
      [lineId]: numericValue
    }));
  };

  const handleNoteChange = (lineId: string, value: string) => {
    setNotesByLine((prev) => ({
      ...prev,
      [lineId]: value,
    }));
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStart = async () => {
    try {
      await startCount(id).unwrap();
      toast.success("Đã bắt đầu đợt kiểm kê — hệ thống đang sinh dòng kiểm...");
      // Refetch after short delay to allow backend to generate lines
      setTimeout(() => refetch(), 1500);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể bắt đầu kiểm kê"));
    }
  };

  const handleSaveResults = async () => {
    const lines = count?.lines ?? [];
    if (!count || !isCountingPhase(count.status)) {
      toast.error("Chỉ ghi nhận kết quả khi đợt kiểm kê đang diễn ra");
      return;
    }
    if (lines.length === 0) {
      toast.error("Chưa có dòng kiểm kê. Hãy bấm 'Làm mới' để tải lại.");
      return;
    }
    if (Object.keys(actualCounts).length === 0) {
      toast.error("Vui lòng nhập ít nhất một số lượng thực tế.");
      return;
    }

    const results = buildCycleCountResults(lines, actualCounts, notesByLine);

    if (results.length === 0) {
      toast.error("Không có dòng hợp lệ để ghi nhận vì thiếu sản phẩm.");
      return;
    }

    try {
      await recordResults({ id, results }).unwrap();
      toast.success("Đã ghi nhận kết quả kiểm đếm thành công!");
      setActualCounts({});
      setNotesByLine({});
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể ghi nhận kết quả"));
    }
  };

  const handleSubmitForReview = async () => {
    // Save results first if there are unsaved changes or if there are still pending lines
    const lines = count?.lines ?? [];
    const hasUnsavedOrPending = Object.keys(actualCounts).length > 0 || lines.some(l => l.status === "PENDING");

    if (hasUnsavedOrPending) {
      const results = buildCycleCountResults(lines, actualCounts, notesByLine);

      if (results.length > 0) {
        try {
          await recordResults({ id, results }).unwrap();
          setActualCounts({});
          setNotesByLine({});
        } catch (err) {
          toast.error(apiErrMessage(err, "Không thể ghi nhận kết quả trước khi nộp"));
          return; // Stop if saving fails
        }
      }
    }

    try {
      await submitCount(id).unwrap();
      toast.success("Đã nộp kết quả kiểm kê. Chờ quản lý duyệt.");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể nộp kết quả kiểm kê"));
    }
  };

  const handleComplete = async () => {
    if (!canManageCycleCount) {
      toast.error("Chỉ quản lý kho hoặc quản trị viên được duyệt kiểm kê");
      return;
    }
    if (!count || !canApprove(count.status)) {
      toast.error("Chỉ duyệt khi đợt kiểm kê đang chờ duyệt");
      return;
    }
    try {
      await completeCount(id).unwrap();
      toast.success("Đã duyệt và hoàn tất — tồn kho đã được điều chỉnh!");
      push("/cycle-counts");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể hoàn tất kiểm kê"));
    }
  };

  const handleReject = async () => {
    if (!count || !canApprove(count.status)) {
      toast.error("Chỉ từ chối khi phiếu đang chờ duyệt");
      return;
    }
    const reason = window.prompt("Nhập lý do yêu cầu kiểm kê lại:");
    if (!reason?.trim()) {
      toast.error("Vui lòng nhập lý do yêu cầu kiểm kê lại");
      return;
    }
    try {
      await rejectCount({ id, reason: reason.trim() }).unwrap();
      toast.success("Đã yêu cầu kiểm kê lại");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể yêu cầu kiểm kê lại"));
    }
  };

  const handleCancel = async () => {
    if (!canManageCycleCount) {
      toast.error("Chỉ quản lý kho hoặc quản trị viên được huỷ kiểm kê");
      return;
    }
    if (!confirm("Bạn có chắc muốn huỷ đợt kiểm kê này không?")) return;
    try {
      await cancelCount(id).unwrap();
      toast.success("Đã huỷ đợt kiểm kê");
      push("/cycle-counts");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể huỷ đợt kiểm kê"));
    }
  };

  // ── Loading / not-found ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DetailPageLayout>
        <DetailBreadcrumb backHref="/cycle-counts" backLabel="Kiểm kê" />
        <DetailSkeleton />
      </DetailPageLayout>
    );
  }

  if (!count) {
    return (
      <DetailPageLayout>
        <DetailBreadcrumb backHref="/cycle-counts" backLabel="Kiểm kê" />
        <DetailErrorState
          message="Đợt kiểm kê này không tồn tại hoặc đã bị xoá."
          backHref="/cycle-counts"
          backLabel="Quay lại danh sách"
        />
      </DetailPageLayout>
    );
  }

  const lines = count.lines ?? [];
  const status = count.status;
  const counting = isCountingPhase(status);
  const hasLines = lines.length > 0;
  const displayLines = canApprove(status)
    ? lines.toSorted((a, b) => Math.abs(Number(b.discrepancy ?? b.varianceQty ?? 0)) - Math.abs(Number(a.discrepancy ?? a.varianceQty ?? 0)))
    : lines;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DetailPageLayout>
      <DetailBreadcrumb
        backHref="/cycle-counts"
        backLabel="Kiểm kê"
        currentLabel={count.countNumber || count.id}
      />

      {/* Page Header with action buttons */}
      <PageHeader
        title={`Đợt kiểm kê: ${count.countNumber || count.id.slice(0, 8) + "..."}`}
        description={
          count.description ||
          `Phạm vi: ${scopeLabel(count.scope)} · Kho: ${count.warehouseName || count.warehouseId || "—"}`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
              Làm mới
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
              <Printer className="mr-2 size-4" />
              In phiếu
            </Button>

            {canManageCycleCount && canCancel(status) && (
              <Button
                size="sm"
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 size-4" />
                )}
                Huỷ đợt kiểm
              </Button>
            )}

            {canStart(status) && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 dark:shadow-none"
                onClick={handleStart}
                disabled={isStarting}
              >
                {isStarting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ClipboardCheck className="mr-2 size-4" />
                )}
                Bắt đầu kiểm kê
              </Button>
            )}

            {counting && hasLines && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveResults}
                  disabled={isRecording}
                >
                  {isRecording ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  Lưu kết quả
                </Button>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none"
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-4" />
                  )}
                  Nộp kết quả
                </Button>
              </>
            )}

            {canManageCycleCount && canApprove(status) && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 dark:shadow-none"
                onClick={handleComplete}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 size-4" />
                )}
                Duyệt & Hoàn tất
              </Button>
            )}
            {canManageCycleCount && canApprove(status) && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <AlertTriangle className="mr-2 size-4" />}
                Yêu cầu kiểm lại
              </Button>
            )}
          </div>
        }
      />

      {/* Status info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Trạng thái</p>
            <div className="mt-1">
              <DetailStatusBadge
                status={status}
                statusConfig={CYCLE_COUNT_STATUS_CONFIG}
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phạm vi</p>
            <p className="mt-1 font-medium">{scopeLabel(count.scope)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ngày tạo</p>
            <p className="mt-1 font-medium">{formatDate(count.createdAt)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Hoàn thành</p>
            <p className="mt-1 font-medium">{formatDate(count.completedAt)}</p>
          </div>
        </div>
      </div>

      {/* Hint when IN_PROGRESS but no lines yet */}
      {counting && !hasLines && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
          <Info className="size-5 shrink-0 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Hệ thống đang sinh dữ liệu dòng kiểm…
            </p>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              Backend cần một vài giây để quét tồn kho và tạo danh sách các dòng cần kiểm kê.
              Bấm <strong>Làm mới</strong> để cập nhật.
            </p>
          </div>
        </div>
      )}

      {/* Counting table */}
      <DetailSection title="Bảng ghi nhận số đếm" icon={ClipboardCheck}>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">Sản phẩm</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead className="text-center">Tồn hệ thống</TableHead>
                <TableHead className="w-40 text-center">Số thực tế</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="text-center">Chênh lệch</TableHead>
                <TableHead className="pr-6 text-right">Mức lệch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasLines ? (
                displayLines.map((line) => {
                  const systemQty = line.systemQty ?? line.expectedQty ?? 0;
                  const prevCounted = line.countedQty ?? line.receivedQty;
                  const actual =
                    actualCounts[line.id] !== undefined
                      ? actualCounts[line.id]
                      : (prevCounted ?? 0);
                  const variance = line.discrepancy ?? line.varianceQty ?? (actual - systemQty);
                  const severity = line.varianceSeverity ?? (variance === 0 ? "NONE" : Math.abs(variance) >= 10 ? "HIGH" : Math.abs(variance) >= 3 ? "MEDIUM" : "LOW");

                  return (
                    <TableRow key={line.id} className="hover:bg-muted/50">
                      <TableCell className="pl-6 py-4">
                        <div>
                          <p className="font-semibold text-sm">
                            {line.productName ?? "Sản phẩm chưa xác định"}
                          </p>
                          {line.productSku && (
                            <p className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                              {line.productSku}
                            </p>
                          )}
                          {line.lotNumber && (
                            <p className="text-[10px] text-muted-foreground">Lô: {line.lotNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-mono text-xs font-bold">
                          {line.locationCode ?? "Vị trí chưa xác định"}
                        </p>
                      </TableCell>
                      <TableCell className="text-center font-mono font-semibold">
                        {systemQty}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          className={cn(
                            "h-9 text-center font-bold transition-colors",
                            counting
                              ? "border-indigo-200 focus:ring-indigo-500/20 dark:border-indigo-800"
                              : "bg-slate-50 opacity-70"
                          )}
                          value={actual === null || actual === undefined ? "" : actual}
                          onChange={(e) => handleRecordChange(line.id, e.target.value)}
                          disabled={!counting}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={notesByLine[line.id] ?? line.notes ?? line.note ?? ""}
                          onChange={(e) => handleNoteChange(line.id, e.target.value)}
                          disabled={!counting}
                          rows={1}
                          placeholder="Ghi chú kiểm kê"
                          className="min-h-9 resize-none text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 font-mono font-bold text-sm",
                            variance === 0
                              ? "text-slate-400"
                              : variance > 0
                                ? "text-emerald-600"
                                : "text-rose-600"
                          )}
                        >
                          {variance !== 0 && <Scale className="size-3" />}
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wide",
                            severity === "HIGH" && "border-rose-200 bg-rose-50 text-rose-700",
                            severity === "MEDIUM" && "border-amber-200 bg-amber-50 text-amber-700",
                            severity === "LOW" && "border-blue-200 bg-blue-50 text-blue-700",
                            severity === "NONE" && "border-slate-200 bg-slate-50 text-slate-500",
                          )}
                        >
                          {severity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center p-8">
                      <AlertTriangle className="size-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-semibold text-muted-foreground">
                        {canStart(status)
                          ? "Chưa bắt đầu kiểm kê"
                          : "Chưa có dữ liệu dòng kiểm"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
      </DetailSection>

      {/* Bottom action bar — only show during counting phase */}
      {counting && hasLines && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                Lưu và nộp kết quả
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Nhập số lượng thực tế rồi bấm &quot;Lưu kết quả&quot;. Sau khi kiểm xong tất cả, bấm{" "}
                <strong>&quot;Nộp kết quả&quot;</strong> để nộp lên cho quản lý duyệt.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-white hover:bg-slate-50 text-slate-700"
              variant="outline"
              onClick={handleSaveResults}
              disabled={isRecording}
            >
              {isRecording ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Lưu kết quả
            </Button>
            <Button
              className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none"
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 size-4" />
              )}
              Nộp kết quả
            </Button>
          </div>
        </div>
      )}

      {/* Approve reminder */}
      {canManageCycleCount && canApprove(status) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                Kết quả kiểm đã được ghi nhận
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Bấm <strong>&quot;Duyệt & Hoàn tất&quot;</strong> để xác nhận và tự động tạo phiếu điều chỉnh tồn kho.
              </p>
            </div>
          </div>
          <Button
            className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 dark:shadow-none"
            onClick={handleComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 size-4" />
            )}
            Duyệt & Hoàn tất
          </Button>
          <Button
            variant="outline"
            className="whitespace-nowrap border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={handleReject}
            disabled={isRejecting}
          >
            {isRejecting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <AlertTriangle className="mr-2 size-4" />}
            Yêu cầu kiểm lại
          </Button>
        </div>
      )}

      <PrintableDocumentModal
        open={printOpen}
        onOpenChange={setPrintOpen}
        printAreaId="print-area-cycle-count"
        title="Phiếu kiểm kê"
        documentNo={count.countNumber || count.id}
        subtitle={count.title || count.description || undefined}
        meta={[
          { label: "Kho", value: count.warehouseName || count.warehouseId },
          { label: "Phạm vi", value: scopeLabel(count.scope) },
          { label: "Trạng thái", value: CYCLE_COUNT_STATUS_CONFIG[count.status]?.label ?? count.status },
          { label: "Ngày tạo", value: formatDate(count.createdAt) },
        ]}
        columns={[
          { key: "sku", label: "Mã hàng" },
          { key: "name", label: "Tên sản phẩm" },
          { key: "systemQty", label: "Tồn hệ thống", align: "right" },
          { key: "countedQty", label: "Số thực tế", align: "right" },
          { key: "variance", label: "Chênh lệch", align: "right" },
          { key: "note", label: "Ghi chú" },
        ]}
        rows={lines.map((line) => {
          const systemQty = line.systemQty ?? line.expectedQty ?? 0;
          const countedQty = line.countedQty ?? line.receivedQty ?? actualCounts[line.id] ?? "";
          const variance =
            line.discrepancy ??
            line.varianceQty ??
            (typeof countedQty === "number" ? countedQty - systemQty : "");

          return {
            sku: line.productSku || line.productId,
            name: line.productName || "Sản phẩm chưa xác định",
            systemQty,
            countedQty,
            variance,
            note: notesByLine[line.id] || line.notes || line.note,
          };
        })}
        note={count.description}
        signatures={["Người kiểm kê", "Thủ kho", "Người duyệt"]}
      />
    </DetailPageLayout>
  );
}
