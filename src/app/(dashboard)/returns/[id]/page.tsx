"use client";

import { useMemo, useReducer, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronRight,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
import type { ReturnLine, ReturnStatus, ReturnType } from "@/types/returns";

const RMA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: "Chờ xử lý",
  RECEIVED: "Đã nhận hàng",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  INSPECTING: "Đang kiểm",
  RESTOCKED: "Nhập lại kho",
  SCRAPPED: "Đã hủy hàng",
  CLOSED: "Đã đóng",
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
  switch (status) {
    case "REQUESTED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "RECEIVED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "APPROVED":
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "REJECTED":
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
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
  const locationLabelById = useMemo(() => {
    return new Map((locationsRes?.data ?? []).map((loc) => [loc.id, loc.code]));
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
  const canReceive = isCustomerReturn && rma.status === "APPROVED";
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
    setDispositionLocationId("");
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

  const handleReject = async () => {
    const reason = window.prompt("Nhập lý do từ chối:");
    if (!reason?.trim()) return toast.error("Vui lòng nhập lý do từ chối");
    try {
      await rejectReturn({ id, reason: reason.trim() }).unwrap();
      toast.success("Đã từ chối phiếu trả hàng");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể từ chối phiếu trả hàng"));
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt("Nhập lý do hủy phiếu:");
    try {
      await cancelReturn({ id, reason: reason?.trim() || undefined }).unwrap();
      toast.success("Đã hủy phiếu trả hàng");
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
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rma) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => push("/returns")} className="-ml-2 h-8">
          <ArrowLeft className="mr-2 size-4" />
          Quay lại danh sách
        </Button>
        <ChevronRight className="size-4" />
        <span className="font-mono">{displayCode(rma.rmaNumber)}</span>
      </div>

      <PageHeader
        title={`Chi tiết phiếu trả: ${displayCode(rma.rmaNumber)}`}
        description={RETURN_TYPE_LABEL[rma.returnType]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
              Làm mới
            </Button>
            {canReject ? <Button size="sm" variant="outline" onClick={handleReject} disabled={isRejecting}><XCircle className="mr-2 size-4" />Từ chối</Button> : null}
            {canCancel ? <Button size="sm" variant="outline" onClick={handleCancel} disabled={isCancelling}><Ban className="mr-2 size-4" />Hủy</Button> : null}
            {canApprove ? <Button size="sm" onClick={handleApprove} disabled={isApproving}><CheckCircle2 className="mr-2 size-4" />Duyệt</Button> : null}
            {canManageReturn && rma?.status === "APPROVED" && !isCompleted ? (
              <Button size="sm" onClick={handleClose} disabled={isClosing || !canComplete}>Hoàn tất</Button>
            ) : null}
          </div>
        }
      />

      {isCustomerReturn && rma.status === "APPROVED" && !allReceivedLinesDisposed ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Còn dòng hàng chưa xử lý sau kiểm định.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Thông tin phiếu</CardTitle>
                <CardDescription>Thông tin đối tác, kho và lý do trả hàng.</CardDescription>
              </div>
              <Badge className={cn("border", statusClass(rma.status))}>{STATUS_LABEL[rma.status] ?? rma.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{rma.returnType === "SUPPLIER" ? "Nhà cung cấp" : "Khách hàng"}</p>
                  <p className="font-semibold">{rma.returnType === "SUPPLIER" ? rma.supplierName || "Nhà cung cấp" : rma.customerName || "Khách hàng"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Lý do</p>
                  <p className="font-semibold text-rose-600">{rma.reason || "--"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Kho xử lý</p>
                  <p className="flex items-center gap-1.5 font-semibold"><Warehouse className="size-4 text-zinc-400" />{warehouseLabel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Tiến độ số lượng</p>
                  <p className="font-semibold">
                    {isSupplierReturn ? `${totalExpected} cần xuất trả` : `${totalReceived}/${totalExpected} đã nhận`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="size-5 text-primary" />Dòng sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-center">{isSupplierReturn ? "SL trả NCC" : "Dự kiến"}</TableHead>
                    {isCustomerReturn ? (
                      <>
                        <TableHead className="text-center">Đã nhận</TableHead>
                        <TableHead className="text-center">Còn lại</TableHead>
                      </>
                    ) : null}
                    <TableHead>{isSupplierReturn ? "Vị trí xuất trả" : "Vị trí nhận/xuất"}</TableHead>
                    {isCustomerReturn ? (
                      <>
                        <TableHead>Tình trạng</TableHead>
                        <TableHead>Xử lý sau kiểm định</TableHead>
                      </>
                    ) : (
                      <TableHead>Trạng thái xuất trả</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => {
                    const locationCode =
                      line.receivedLocationCode ||
                      line.returnLocationCode ||
                      (line.receivedLocationId ? locationLabelById.get(line.receivedLocationId) : null) ||
                      (line.returnLocationId ? locationLabelById.get(line.returnLocationId) : null);
                    const canDisposeLine =
                      canManageReturn &&
                      Number(line.receivedQty ?? 0) > 0 &&
                      Boolean(line.receivedLocationId) &&
                      !line.dispositionAction;
                    return (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="font-medium">{line.productName || "Sản phẩm chưa xác định"}</div>
                          <div className="text-xs font-mono text-muted-foreground">{line.productSku || line.lotNumber || "Chưa có mã hàng"}</div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{line.expectedQty}</TableCell>
                        {isCustomerReturn ? (
                          <>
                            <TableCell className="text-center font-bold text-primary">{line.receivedQty || 0}</TableCell>
                            <TableCell className="text-center font-semibold">{line.remainingQty ?? Math.max(0, line.expectedQty - line.receivedQty)}</TableCell>
                          </>
                        ) : null}
                        <TableCell className="font-mono text-xs">{locationCode || "--"}</TableCell>
                        {isCustomerReturn ? (
                          <>
                            <TableCell><Badge variant="outline">{CONDITION_LABEL[String(line.condition ?? "")] ?? line.condition ?? "--"}</Badge></TableCell>
                            <TableCell>
                              {line.dispositionAction ? (
                                <div className="space-y-1">
                                  <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                                    {DISPOSITION_LABEL[String(line.dispositionAction)] ?? line.dispositionAction}
                                  </Badge>
                                  {line.dispositionLocationCode ? <div className="text-xs text-muted-foreground">Đích: {line.dispositionLocationCode}</div> : null}
                                  {line.dispositionAction === "RETURN_TO_SUPPLIER" && line.supplierReturnRmaId ? (
                                    <Button
                                      type="button"
                                      variant="link"
                                      className="h-auto p-0 text-xs"
                                      onClick={() => push(`/returns/${line.supplierReturnRmaId}`)}
                                    >
                                      Xem phiếu trả NCC
                                    </Button>
                                  ) : null}
                                </div>
                              ) : canDisposeLine ? (
                                <Button type="button" size="sm" variant="outline" onClick={() => openDispositionDialog(line)}>
                                  Xử lý
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Chưa sẵn sàng</span>
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <TableCell>
                            <Badge className={cn("border", statusClass(rma.status))}>
                              {rma.status === "APPROVED" ? "Đã duyệt xuất trả" : STATUS_LABEL[rma.status] ?? rma.status}
                            </Badge>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {rma.returnType === "CUSTOMER" ? (
            <Card className="border-primary/20 bg-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Package className="size-5 text-primary" />Nhận hàng khách trả</CardTitle>
                <CardDescription>Cập nhật số lượng và vị trí nhận hàng trả.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Dòng hàng</Label>
                  <SearchableSelect options={lineOptions} value={selectedLine?.id ?? ""} onValueChange={handleSelectLine} placeholder="Chọn dòng hàng..." dialogTitle="Chọn dòng hàng" disabled={!lineOptions.length || !canReceive} />
                </div>
                <div className="space-y-2">
                  <Label>Tình trạng</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["GOOD", "DAMAGED", "EXPIRED", "QUARANTINE"] as const).map((condition) => (
                      <Button key={condition} type="button" variant={receiveForm.condition === condition ? "default" : "outline"} size="sm" onClick={() => updateReceiveForm({ condition, locationId: "" })} disabled={!canReceive}>
                        {CONDITION_LABEL[condition]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vị trí nhận hàng trả</Label>
                  <SearchableSelect
                    options={locationOptions}
                    value={selectedLocationId}
                    onValueChange={(locationId) => updateReceiveForm({ locationId })}
                    placeholder="Chọn vị trí RMA phù hợp"
                    dialogTitle="Chọn vị trí nhận hàng trả"
                    emptyText="Không có vị trí RMA phù hợp với tình trạng đã chọn"
                    loading={locationsLoading || locationsFetching}
                    disabled={!canReceive || !rma?.warehouseId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số lượng nhận</Label>
                  <Input type="number" value={quantityInputValue} onChange={(e) => updateReceiveForm({ actualQty: e.target.value })} min={0} max={selectedLine?.expectedQty} disabled={!canReceive} />
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Input value={receiveForm.notes} onChange={(event) => updateReceiveForm({ notes: event.target.value })} placeholder="Ghi chú xử lý nếu có" disabled={!canReceive} />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleReceive} disabled={isReceiving || !canReceive || !selectedLine}>
                  {isReceiving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                  Cập nhật nhận hàng
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><CardTitle className="text-sm">Lịch sử xử lý</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              {[
                ["Khởi tạo", rma.createdAt, rma.createdBy],
                ["Nhận hàng", rma.receivedAt, rma.receivedBy],
                ["Duyệt", rma.approvedAt, rma.approvedBy],
                ["Từ chối", rma.rejectedAt, rma.rejectedBy],
                ["Hoàn tất", rma.completedAt, rma.completedBy],
                ["Hủy", rma.cancelledAt, rma.cancelledBy],
              ].filter(([, time]) => time).map(([label, time, actor]) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                  <div><p className="font-semibold">{label}</p><p className="text-muted-foreground">{formatDateTime(String(time))}{actor ? ` · ${actor}` : ""}</p></div>
                </div>
              ))}
              {rma.rejectionReason ? <p className="text-rose-600">Lý do từ chối: {rma.rejectionReason}</p> : null}
              {rma.cancelReason ? <p className="text-rose-600">Lý do hủy: {rma.cancelReason}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
}
