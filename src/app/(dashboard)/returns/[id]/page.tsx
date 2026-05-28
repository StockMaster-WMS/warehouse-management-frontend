"use client";

import { useMemo, useReducer, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Package,
  RefreshCw,
  Warehouse,
  XCircle,
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
import { Label } from "@/components/ui/label";
import {
  useApproveReturnRequestMutation,
  useCancelReturnRequestMutation,
  useCloseReturnRequestMutation,
  useDispositionReturnItemMutation,
  useGetReturnRequestByIdQuery,
  useGetReturnLocationsQuery,
  useReceiveReturnMutation,
  useRejectReturnRequestMutation,
} from "@/store/services/return.service";
import { useGetLocationsListQuery } from "@/store/services/location.service";
import { useGetWarehouseByIdQuery } from "@/store/services/warehouse.service";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiErrMessage } from "@/types/api";
import { cn } from "@/lib/utils";
import {
  DetailPageLayout,
  DetailBreadcrumb,
  DetailSection,
  DetailInfoField,
  DetailStatusBadge,
  DetailSkeleton,
  DetailErrorState,
  DetailGrid,
} from "@/components/detail-page";
import type { StatusConfig } from "@/components/detail-page";
import { useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
import type { ReturnLine, ReturnStatus, ReturnType } from "@/types/returns";

const RMA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

const RETURN_STATUS_CONFIG: Record<string, StatusConfig> = {
  REQUESTED: { label: "Chờ xử lý", color: "blue" },
  RECEIVED: { label: "Đã nhận hàng", color: "amber" },
  APPROVED: { label: "Đã duyệt", color: "emerald" },
  REJECTED: { label: "Từ chối", color: "rose" },
  COMPLETED: { label: "Hoàn tất", color: "emerald" },
  CANCELLED: { label: "Đã hủy", color: "rose" },
  INSPECTING: { label: "Đang kiểm", color: "indigo" },
  RESTOCKED: { label: "Nhập lại kho", color: "teal" },
  SCRAPPED: { label: "Đã hủy hàng", color: "slate" },
  CLOSED: { label: "Đã đóng", color: "slate" },
};

const RETURN_TYPE_LABEL: Record<ReturnType, string> = {
  CUSTOMER: "Khách trả hàng",
  SUPPLIER: "Trả nhà cung cấp",
};

const CONDITION_LABEL: Record<string, string> = {
  GOOD: "Tốt",
  EXPIRED: "Hết hạn",
  DAMAGED: "Hư hỏng",
  DEFECTIVE: "Lỗi",
  QUARANTINE: "Chờ kiểm định",
};

const DISPOSITION_LABEL: Record<string, string> = {
  RESTOCK: "Đã nhập lại tồn",
  KEEP_QUARANTINE: "Đang cách ly",
  SCRAP: "Đã tiêu hủy",
  RETURN_TO_SUPPLIER: "Đã tạo phiếu trả NCC",
};

const DISPOSITION_ACTIONS = [
  { value: "RESTOCK", label: "Nhập lại tồn bán được" },
  { value: "KEEP_QUARANTINE", label: "Giữ cách ly" },
  { value: "SCRAP", label: "Tiêu hủy" },
  { value: "RETURN_TO_SUPPLIER", label: "Trả nhà cung cấp" },
] as const;

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return RMA_DATE_TIME_FORMATTER.format(timestamp);
}

function displayCode(value?: string | null) {
  const code = value?.trim();
  return code || "Chưa có mã";
}

function statusClass(status: ReturnStatus) {
  const cfg = RETURN_STATUS_CONFIG[status];
  if (!cfg) return "bg-slate-50 text-slate-700 border-slate-200";
  switch (cfg.color) {
    case "blue": return "bg-blue-50 text-blue-700 border-blue-200";
    case "amber": return "bg-amber-50 text-amber-700 border-amber-200";
    case "emerald": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rose": return "bg-rose-50 text-rose-700 border-rose-200";
    case "indigo": return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "teal": return "bg-teal-50 text-teal-700 border-teal-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

type ReceiveFormState = {
  selectedLineId: string;
  actualQty: string;
  locationId: string;
  condition: string;
  notes: string;
};

const INITIAL_RECEIVE_FORM: ReceiveFormState = {
  selectedLineId: "",
  actualQty: "",
  locationId: "",
  condition: "GOOD",
  notes: "",
};

function receiveFormReducer(state: ReceiveFormState, patch: Partial<ReceiveFormState>) {
  return { ...state, ...patch };
}

export default function RMADetailPage() {
  const { id } = useParams<{ id: string }>();
  const { push } = useRouter();
  const canManageReturn = useHasPermissions(ADMIN_MANAGER_ROLES);
  const { data: rmaRes, isLoading, refetch, isFetching } = useGetReturnRequestByIdQuery(id);
  const rma = rmaRes?.data;
  const { data: warehouseRes } = useGetWarehouseByIdQuery(rma?.warehouseId ?? "", {
    skip: !rma?.warehouseId,
  });

  const [receiveReturn, { isLoading: isReceiving }] = useReceiveReturnMutation();
  const [dispositionReturnItem, { isLoading: isDisposing }] = useDispositionReturnItemMutation();
  const [approveReturn, { isLoading: isApproving }] = useApproveReturnRequestMutation();
  const [rejectReturn, { isLoading: isRejecting }] = useRejectReturnRequestMutation();
  const [closeReturn, { isLoading: isClosing }] = useCloseReturnRequestMutation();
  const [cancelReturn, { isLoading: isCancelling }] = useCancelReturnRequestMutation();
  const [receiveForm, updateReceiveForm] = useReducer(receiveFormReducer, INITIAL_RECEIVE_FORM);
  const [dispositionLine, setDispositionLine] = useState<ReturnLine | null>(null);
  const [dispositionAction, setDispositionAction] = useState("RESTOCK");
  const [dispositionLocationId, setDispositionLocationId] = useState("");
  const [dispositionSupplierId, setDispositionSupplierId] = useState("");
  const [dispositionNote, setDispositionNote] = useState("");
  const [statusDialog, setStatusDialog] = useState<"reject" | "cancel" | null>(null);
  const [statusReason, setStatusReason] = useState("");

  const returnLocationCondition = receiveForm.condition?.trim() || "QUARANTINE";
  const { data: locationsRes, isLoading: locationsLoading, isFetching: locationsFetching } = useGetReturnLocationsQuery(
    {
      warehouseId: rma?.warehouseId ?? "",
      condition: returnLocationCondition,
    },
    { skip: !rma?.warehouseId || rma.returnType !== "CUSTOMER" },
  );

  const locationOptions = useMemo(() => {
    return (locationsRes?.data ?? []).map((loc) => ({
      value: loc.id,
      label: `${loc.code} - ${loc.locationType || "RMA"}${loc.zone ? ` - Zone ${loc.zone}` : ""}`,
      hint: [loc.aisle, loc.rack, loc.level != null ? `Tầng ${loc.level}` : null, loc.bin ? `Ô ${loc.bin}` : null]
        .filter(Boolean)
        .join(" · "),
    }));
  }, [locationsRes]);
  const { data: restockLocationsRes, isLoading: restockLocationsLoading } = useGetLocationsListQuery(
    {
      page: 0,
      size: 300,
      warehouseId: rma?.warehouseId ?? undefined,
    },
    { skip: !rma?.warehouseId || !dispositionLine || dispositionAction !== "RESTOCK" },
  );

  const restockLocationOptions = useMemo(() => {
    return (restockLocationsRes?.data?.content ?? [])
      .filter((loc) => ["STORAGE", "PICKING"].includes(String(loc.locationType || "")))
      .map((loc) => ({
        value: loc.id,
        label: `${loc.code} - ${loc.locationType || "STORAGE"}${loc.zone ? ` - Zone ${loc.zone}` : ""}`,
        hint: [loc.aisle, loc.rack, loc.level != null ? `Tầng ${loc.level}` : null, loc.bin ? `Ô ${loc.bin}` : null]
          .filter(Boolean)
          .join(" · "),
      }));
  }, [restockLocationsRes]);

  const { data: suppliersRes, isLoading: suppliersLoading } = useGetSuppliersQuery(
    { page: 0, size: 200, sort: "name", sortDir: "asc", status: "ACTIVE" },
    { skip: !dispositionLine || dispositionAction !== "RETURN_TO_SUPPLIER" },
  );

  const supplierOptions = useMemo(() => {
    return (suppliersRes?.data?.content ?? []).map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
      hint: [supplier.code, supplier.contactPhone, supplier.contactEmail].filter(Boolean).join(" · "),
    }));
  }, [suppliersRes]);

  const lines = useMemo(() => rma?.lines ?? [], [rma?.lines]);
  const isCustomerReturn = rma?.returnType === "CUSTOMER";
  const isSupplierReturn = rma?.returnType === "SUPPLIER";
  const selectedLine = lines.find((line) => line.id === receiveForm.selectedLineId) ?? lines[0];
  const selectedLocationId = receiveForm.locationId;
  const quantityInputValue = receiveForm.actualQty || (selectedLine ? String(selectedLine.receivedQty ?? 0) : "");
  const isCompleted = rma?.status === "COMPLETED" || rma?.status === "CLOSED";
  const totalExpected = Number(rma?.totalExpectedQty ?? lines.reduce((sum, line) => sum + Number(line.expectedQty ?? 0), 0));
  const totalReceived = Number(rma?.totalReceivedQty ?? lines.reduce((sum, line) => sum + Number(line.receivedQty ?? 0), 0));
  const supplierReturnStockDeducted = isSupplierReturn && ["APPROVED", "COMPLETED"].includes(rma.status);
  const totalSupplierExported = supplierReturnStockDeducted ? totalExpected : 0;
  const allLinesReceived =
    lines.length > 0 &&
    lines.every(
      (line) => Number(line.receivedQty ?? 0) >= Number(line.expectedQty ?? 0),
    );
  const allReceivedLinesDisposed =
    lines.length > 0 &&
    lines.every(
      (line) => Number(line.receivedQty ?? 0) <= 0 || Boolean(line.dispositionAction),
    );
  const canReceive = isCustomerReturn && ["APPROVED", "RECEIVED"].includes(rma.status);
  const canApprove = canManageReturn && rma?.status === "REQUESTED";
  const canComplete =
    canManageReturn &&
    rma?.status === "APPROVED" &&
    !isCompleted &&
    (isSupplierReturn || (allLinesReceived && allReceivedLinesDisposed));
  const canReject = canManageReturn && rma && !["APPROVED", "COMPLETED", "CANCELLED", "CLOSED"].includes(rma.status);
  const canCancel = canManageReturn && rma && !["COMPLETED", "CLOSED"].includes(rma.status);
  const lineOptions = useMemo(
    () =>
      lines.map((line) => ({
        value: line.id,
        label: `${line.productSku || line.productName || "Sản phẩm chưa xác định"} · ${line.receivedQty || 0}/${line.expectedQty}`,
      })),
    [lines],
  );
  const warehouse = warehouseRes?.data;
  const warehouseLabel =
    rma?.warehouseName ||
    (warehouse ? (warehouse.code ? `${warehouse.name} (${warehouse.code})` : warehouse.name) : "Kho chưa xác định");

  const handleSelectLine = (selectedLineId: string) => {
    const nextLine = lines.find((line) => line.id === selectedLineId);
    updateReceiveForm({
      selectedLineId,
      actualQty: nextLine ? String(nextLine.receivedQty ?? 0) : "",
      locationId: nextLine?.receivedLocationId ?? "",
      condition: String(nextLine?.condition ?? "GOOD"),
    });
  };

  const handleReceive = async () => {
    if (!selectedLine) return toast.error("Phiếu chưa có dòng hàng để nhận");
    if (rma?.returnType !== "CUSTOMER") return toast.error("Chỉ phiếu khách trả mới dùng thao tác nhận hàng");
    if (rma?.status !== "APPROVED") return toast.error("Chỉ được nhận hàng sau khi phiếu đã được duyệt");
    const receivedQty = Number(quantityInputValue);
    const expectedQty = Number(selectedLine.expectedQty ?? 0);
    if (!Number.isFinite(receivedQty) || receivedQty < 0) return toast.error("Số lượng nhận không hợp lệ");
    if (receivedQty > expectedQty) return toast.error("Số lượng nhận không được vượt quá số lượng dự kiến");
    if (!selectedLocationId) return toast.error("Vui lòng chọn vị trí nhận hàng trả");

    try {
      await receiveReturn({
        id,
        body: {
          itemId: selectedLine.id,
          receivedQty,
          locationId: selectedLocationId,
          condition: receiveForm.condition.trim() || "GOOD",
          notes: receiveForm.notes.trim() || undefined,
        },
      }).unwrap();
      toast.success("Đã ghi nhận hàng trả");
      updateReceiveForm({ actualQty: String(receivedQty), notes: "" });
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể nhận hàng trả"));
    }
  };

  const openDispositionDialog = (line: ReturnLine) => {
    setDispositionLine(line);
    setDispositionAction("RESTOCK");
    setDispositionLocationId(line.returnLocationId ?? "");
    setDispositionSupplierId("");
    setDispositionNote("");
  };

  const closeDispositionDialog = () => {
    setDispositionLine(null);
    setDispositionAction("RESTOCK");
    setDispositionLocationId("");
    setDispositionSupplierId("");
    setDispositionNote("");
  };

  const handleDisposition = async () => {
    if (!dispositionLine) return;
    if (!canManageReturn) return toast.error("Bạn không có quyền thực hiện thao tác này.");
    if (dispositionAction === "RESTOCK" && !dispositionLocationId) {
      return toast.error("Vui lòng chọn vị trí nhập lại tồn bán được");
    }
    if (dispositionAction === "RETURN_TO_SUPPLIER" && !dispositionSupplierId) {
      return toast.error("Vui lòng chọn nhà cung cấp để tạo phiếu trả NCC");
    }

    try {
      await dispositionReturnItem({
        rmaId: id,
        itemId: dispositionLine.id,
        body: {
          action: dispositionAction,
          targetLocationId: dispositionAction === "RESTOCK" ? dispositionLocationId : null,
          supplierId: dispositionAction === "RETURN_TO_SUPPLIER" ? dispositionSupplierId : null,
          note: dispositionNote.trim() || null,
        },
      }).unwrap();
      toast.success("Đã xử lý sau kiểm định");
      closeDispositionDialog();
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể xử lý dòng hàng sau kiểm định"));
    }
  };

  const handleApprove = async () => {
    if (!canApprove) {
      toast.error(rma?.returnType === "CUSTOMER" ? "Chưa nhận đủ hàng trả" : "Không thể duyệt phiếu này");
      return;
    }
    try {
      await approveReturn(id).unwrap();
      toast.success("Đã duyệt phiếu trả hàng");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể duyệt phiếu trả hàng"));
    }
  };

  const handleReject = async (reason: string) => {
    if (!reason.trim()) return toast.error("Vui lòng nhập lý do từ chối");
    try {
      await rejectReturn({ id, reason: reason.trim() }).unwrap();
      toast.success("Đã từ chối phiếu trả hàng");
      setStatusDialog(null);
      setStatusReason("");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể từ chối phiếu trả hàng"));
    }
  };

  const handleCancel = async (reason?: string) => {
    try {
      await cancelReturn({ id, reason: reason?.trim() || undefined }).unwrap();
      toast.success("Đã hủy phiếu trả hàng");
      setStatusDialog(null);
      setStatusReason("");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể hủy phiếu trả hàng"));
    }
  };

  const handleClose = async () => {
    if (isCustomerReturn && !allLinesReceived) return toast.error("Chưa nhận đủ hàng trả");
    if (isCustomerReturn && !allReceivedLinesDisposed) return toast.error("Còn dòng hàng chưa xử lý sau kiểm định.");
    if (!canComplete) return toast.error("Chỉ hoàn tất phiếu đã duyệt");
    try {
      await closeReturn(id).unwrap();
      toast.success("Đã hoàn tất phiếu trả hàng");
      push("/returns");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể hoàn tất phiếu trả hàng"));
    }
  };

  if (isLoading) {
    return (
      <DetailPageLayout>
        <DetailBreadcrumb backHref="/returns" backLabel="Phiếu trả hàng" />
        <DetailSkeleton />
      </DetailPageLayout>
    );
  }

  if (!rma) {
    return (
      <DetailPageLayout>
        <DetailBreadcrumb backHref="/returns" backLabel="Phiếu trả hàng" />
        <DetailErrorState
          message="Không tìm thấy phiếu trả hàng."
          backHref="/returns"
          backLabel="Về danh sách"
        />
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout>
      <DetailBreadcrumb
        backHref="/returns"
        backLabel="Phiếu trả hàng"
        currentLabel={displayCode(rma.rmaNumber)}
      />

      <PageHeader
        title={`Chi tiết phiếu trả: ${displayCode(rma.rmaNumber)}`}
        description={RETURN_TYPE_LABEL[rma.returnType]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => push("/returns")}>
              <ArrowLeft className="mr-2 size-4" />
              Danh sách
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
              Làm mới
            </Button>
            {canReject ? <Button size="sm" variant="outline" onClick={() => { setStatusReason(""); setStatusDialog("reject"); }} disabled={isRejecting}><XCircle className="mr-2 size-4" />Từ chối</Button> : null}
            {canCancel ? <Button size="sm" variant="outline" onClick={() => { setStatusReason(""); setStatusDialog("cancel"); }} disabled={isCancelling}><Ban className="mr-2 size-4" />Hủy</Button> : null}
            {canApprove ? <Button size="sm" onClick={handleApprove} disabled={isApproving}><CheckCircle2 className="mr-2 size-4" />Duyệt</Button> : null}
            {canComplete ? <Button size="sm" onClick={handleClose} disabled={isClosing}><CheckCircle2 className="mr-2 size-4" />Hoàn tất</Button> : null}
          </div>
        }
      />

      <DetailGrid
        sidebar={
          <>
            <DetailSection title="Trạng thái & lịch sử" icon={<ClipboardList className="size-4" />}>
              <div className="mb-4">
                <DetailStatusBadge status={rma.status} statusConfig={RETURN_STATUS_CONFIG} />
              </div>
              <div className="divide-y divide-border">
                <DetailInfoField label="Ngày tạo" value={formatDateTime(rma.createdAt)} />
                <DetailInfoField label="Ngày duyệt" value={formatDateTime(rma.approvedAt)} />
                <DetailInfoField label="Ngày nhận" value={formatDateTime(rma.receivedAt)} />
                <DetailInfoField label="Hoàn tất" value={formatDateTime(rma.completedAt)} />
              </div>
            </DetailSection>

            <DetailSection title="Ghi chú xử lý" icon={<ClipboardList className="size-4" />}>
              <div className="space-y-3 text-sm">
                {rma.note ? <p className="text-foreground">{rma.note}</p> : <p className="text-muted-foreground">Không có ghi chú.</p>}
                {rma.rejectionReason ? <p className="text-rose-600">Lý do từ chối: {rma.rejectionReason}</p> : null}
                {rma.cancelReason ? <p className="text-rose-600">Lý do hủy: {rma.cancelReason}</p> : null}
              </div>
            </DetailSection>
          </>
        }
      >
        <DetailSection title="Thông tin tổng quan" icon={<Warehouse className="size-4" />}>
          <div className="grid grid-cols-1 gap-x-6 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
            <DetailInfoField label="Kho xử lý" value={warehouseLabel} />
            <DetailInfoField label={isCustomerReturn ? "Khách hàng" : "Nhà cung cấp"} value={isCustomerReturn ? rma.customerName : rma.supplierName} />
            <DetailInfoField label="Đơn liên quan" value={rma.orderNumber || rma.orderId || rma.salesOrderId} mono />
            <DetailInfoField label="Lý do trả" value={rma.reason} />
            <DetailInfoField label="Tổng dự kiến" value={totalExpected.toLocaleString("vi-VN")} />
            <DetailInfoField
              label={isSupplierReturn ? "Đã xuất trả" : "Đã nhận"}
              value={(isSupplierReturn ? totalSupplierExported : totalReceived).toLocaleString("vi-VN")}
            />
          </div>
        </DetailSection>

        <DetailSection title="Dòng hàng trả" icon={<Package className="size-4" />} padded={false}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="ui-table-header">
                <TableRow>
                  <TableHead className="ui-label p-3">Sản phẩm</TableHead>
                  <TableHead className="ui-label p-3 text-right">{isSupplierReturn ? "SL trả" : "Dự kiến"}</TableHead>
                  <TableHead className="ui-label p-3 text-right">{isSupplierReturn ? "Đã xuất" : "Đã nhận"}</TableHead>
                  <TableHead className="ui-label p-3">{isSupplierReturn ? "Trạng thái xuất" : "Tình trạng"}</TableHead>
                  <TableHead className="ui-label p-3">{isSupplierReturn ? "Kiểm định" : "Xử lý"}</TableHead>
                  <TableHead className="ui-label p-3 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length > 0 ? lines.map((line) => (
                  <TableRow key={line.id} className="ui-table-row">
                    <TableCell className="p-3">
                      <div>
                        <p className="text-sm font-semibold">{line.productName || "Sản phẩm"}</p>
                        <p className="font-mono text-xs text-muted-foreground">{line.productSku || line.productId}</p>
                        <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                          {line.returnLocationCode ? <p>Vị trí xuất ban đầu: {line.returnLocationCode}</p> : null}
                          {line.receivedLocationCode ? <p>Vị trí RMA nhận trả: {line.receivedLocationCode}</p> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-right tabular-nums">{line.expectedQty}</TableCell>
                    <TableCell className="p-3 text-right tabular-nums">
                      {isSupplierReturn ? (supplierReturnStockDeducted ? line.expectedQty : 0) : line.receivedQty}
                    </TableCell>
                    <TableCell className="p-3">
                      {isSupplierReturn
                        ? supplierReturnStockDeducted
                          ? "Đã trừ tồn khi duyệt"
                          : "Chờ duyệt xuất trả"
                        : CONDITION_LABEL[String(line.condition ?? "")] ?? line.condition ?? "—"}
                    </TableCell>
                    <TableCell className="p-3">
                      {isSupplierReturn ? (
                        <span className="text-xs text-muted-foreground">Không cần kiểm định</span>
                      ) : line.dispositionAction ? (
                        <Badge variant="outline" className={cn("border text-xs", statusClass(rma.status))}>
                          {DISPOSITION_LABEL[line.dispositionAction] ?? line.dispositionAction}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Chưa xử lý</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      {canManageReturn && Number(line.receivedQty ?? 0) > 0 && !line.dispositionAction ? (
                        <Button size="sm" variant="outline" onClick={() => openDispositionDialog(line)}>
                          Xử lý
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                      Phiếu chưa có dòng hàng.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DetailSection>

        {canReceive && selectedLine ? (
          <DetailSection title="Nhận hàng trả" icon={<CheckCircle2 className="size-4" />}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <SearchableSelect
                options={lineOptions}
                value={selectedLine.id}
                onValueChange={handleSelectLine}
                placeholder="Chọn dòng hàng"
                dialogTitle="Chọn dòng hàng trả"
                emptyText="Không có dòng hàng"
              />
              <Input value={quantityInputValue} onChange={(event) => updateReceiveForm({ actualQty: event.target.value })} inputMode="decimal" />
              <SearchableSelect
                options={locationOptions}
                value={selectedLocationId}
                onValueChange={(locationId) => updateReceiveForm({ locationId })}
                placeholder="Chọn vị trí RMA"
                dialogTitle="Chọn vị trí nhận hàng trả"
                emptyText="Không có vị trí phù hợp"
                loading={locationsLoading || locationsFetching}
              />
              <Button onClick={handleReceive} disabled={isReceiving}>
                {isReceiving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                Ghi nhận
              </Button>
            </div>
          </DetailSection>
        ) : null}
      </DetailGrid>

      <Dialog open={Boolean(dispositionLine)} onOpenChange={(open) => !open && closeDispositionDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Xử lý sau kiểm định</DialogTitle>
            <DialogDescription>
              Chọn cách xử lý cho dòng hàng đã nhận vào vị trí RMA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-slate-50 p-3 text-sm">
              <div className="font-semibold">{dispositionLine?.productName || "Sản phẩm"}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Đã nhận: {dispositionLine?.receivedQty ?? 0} · Vị trí RMA: {dispositionLine?.receivedLocationCode || "--"}
              </div>
              {dispositionLine?.returnLocationCode ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  Vị trí xuất ban đầu: {dispositionLine.returnLocationCode}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Hành động xử lý</Label>
              <div className="grid grid-cols-2 gap-2">
                {DISPOSITION_ACTIONS.map((action) => (
                  <Button
                    key={action.value}
                    type="button"
                    variant={dispositionAction === action.value ? "default" : "outline"}
                    className="h-auto min-h-10 whitespace-normal"
                    onClick={() => {
                      setDispositionAction(action.value);
                      if (action.value !== "RESTOCK") setDispositionLocationId("");
                      if (action.value !== "RETURN_TO_SUPPLIER") setDispositionSupplierId("");
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {dispositionAction === "RESTOCK" ? (
              <div className="space-y-2">
                <Label>Vị trí nhập lại tồn bán được</Label>
                <SearchableSelect
                  options={restockLocationOptions}
                  value={dispositionLocationId}
                  onValueChange={setDispositionLocationId}
                  placeholder="Chọn vị trí STORAGE/PICKING"
                  dialogTitle="Chọn vị trí nhập lại tồn"
                  emptyText="Không có vị trí bán được phù hợp"
                  loading={restockLocationsLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Nếu hàng còn bán được, nên nhập lại về vị trí xuất ban đầu hoặc vị trí STORAGE/PICKING phù hợp.
                </p>
              </div>
            ) : null}

            {dispositionAction === "RETURN_TO_SUPPLIER" ? (
              <div className="space-y-2">
                <Label>Nhà cung cấp nhận trả</Label>
                <SearchableSelect
                  options={supplierOptions}
                  value={dispositionSupplierId}
                  onValueChange={setDispositionSupplierId}
                  placeholder="Chọn nhà cung cấp"
                  dialogTitle="Chọn nhà cung cấp"
                  emptyText="Không tìm thấy nhà cung cấp"
                  loading={suppliersLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Backend sẽ tự tạo phiếu trả NCC liên kết. Tồn vẫn ở vị trí RMA cho tới khi phiếu trả NCC được duyệt.
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Ghi chú xử lý</Label>
              <Textarea
                value={dispositionNote}
                onChange={(event) => setDispositionNote(event.target.value)}
                placeholder="Ghi chú kiểm định hoặc lý do xử lý..."
                className="min-h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeDispositionDialog}>Hủy</Button>
            <Button type="button" onClick={handleDisposition} disabled={isDisposing}>
              {isDisposing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
              Xác nhận xử lý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(statusDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog(null);
            setStatusReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{statusDialog === "reject" ? "Từ chối phiếu trả hàng" : "Hủy phiếu trả hàng"}</DialogTitle>
            <DialogDescription>
              {statusDialog === "reject"
                ? "Nhập lý do từ chối để lưu vào lịch sử xử lý."
                : "Có thể nhập lý do hủy để người thao tác sau nắm được bối cảnh."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>{statusDialog === "reject" ? "Lý do từ chối" : "Lý do hủy"}</Label>
            <Textarea
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
              placeholder={statusDialog === "reject" ? "Ví dụ: Không đủ điều kiện trả hàng..." : "Ví dụ: Tạo nhầm phiếu..."}
              className="min-h-28"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { setStatusDialog(null); setStatusReason(""); }}>Đóng</Button>
            <Button
              type="button"
              variant={statusDialog === "reject" ? "destructive" : "default"}
              onClick={() => {
                if (statusDialog === "reject") void handleReject(statusReason);
                if (statusDialog === "cancel") void handleCancel(statusReason);
              }}
              disabled={isRejecting || isCancelling || (statusDialog === "reject" && !statusReason.trim())}
            >
              {(isRejecting || isCancelling) ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {statusDialog === "reject" ? "Xác nhận từ chối" : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailPageLayout>
  );
}
