"use client";

import { useMemo, useReducer } from "react";
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
  useGetReturnRequestByIdQuery,
  useReceiveReturnMutation,
  useRejectReturnRequestMutation,
} from "@/store/services/return.service";
import { useGetLocationsListQuery } from "@/store/services/location.service";
import { useGetWarehouseByIdQuery } from "@/store/services/warehouse.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiErrMessage } from "@/types/api";
import { cn } from "@/lib/utils";
import { useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
import type { ReturnStatus, ReturnType } from "@/types/returns";

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
  DAMAGED: "Hư hỏng",
  DEFECTIVE: "Lỗi",
};

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
  const [approveReturn, { isLoading: isApproving }] = useApproveReturnRequestMutation();
  const [rejectReturn, { isLoading: isRejecting }] = useRejectReturnRequestMutation();
  const [closeReturn, { isLoading: isClosing }] = useCloseReturnRequestMutation();
  const [cancelReturn, { isLoading: isCancelling }] = useCancelReturnRequestMutation();
  const [receiveForm, updateReceiveForm] = useReducer(receiveFormReducer, INITIAL_RECEIVE_FORM);

  const { data: locationsRes, isLoading: locationsLoading } = useGetLocationsListQuery({
    page: 0,
    size: 200,
    warehouseId: rma?.warehouseId ?? undefined,
  });

  const locationOptions = useMemo(() => {
    return (locationsRes?.data?.content ?? []).map((loc) => ({
      value: loc.id,
      label: loc.code,
      hint: [loc.zone, loc.aisle, loc.rack].filter(Boolean).join(" · "),
    }));
  }, [locationsRes]);
  const locationLabelById = useMemo(() => {
    return new Map((locationsRes?.data?.content ?? []).map((loc) => [loc.id, loc.code]));
  }, [locationsRes]);

  const lines = useMemo(() => rma?.lines ?? [], [rma?.lines]);
  const selectedLine = lines.find((line) => line.id === receiveForm.selectedLineId) ?? lines[0];
  const selectedLocationId = receiveForm.locationId || selectedLine?.receivedLocationId || "";
  const quantityInputValue = receiveForm.actualQty || (selectedLine ? String(selectedLine.receivedQty ?? 0) : "");
  const isCompleted = rma?.status === "COMPLETED" || rma?.status === "CLOSED";
  const totalExpected = Number(rma?.totalExpectedQty ?? lines.reduce((sum, line) => sum + Number(line.expectedQty ?? 0), 0));
  const totalReceived = Number(rma?.totalReceivedQty ?? lines.reduce((sum, line) => sum + Number(line.receivedQty ?? 0), 0));
  const allLinesReceived =
    lines.length > 0 &&
    lines.every(
      (line) => Number(line.receivedQty ?? 0) >= Number(line.expectedQty ?? 0),
    );
  const canReceive = rma?.returnType === "CUSTOMER" && rma.status === "APPROVED";
  const canApprove = canManageReturn && rma?.status === "REQUESTED";
  const canComplete = canManageReturn && rma?.status === "APPROVED" && !isCompleted && allLinesReceived;
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
            {canComplete ? <Button size="sm" onClick={handleClose} disabled={isClosing}>Hoàn tất</Button> : null}
          </div>
        }
      />

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
                  <p className="font-semibold">{totalReceived}/{totalExpected} đã nhận</p>
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
                    <TableHead className="text-center">Dự kiến</TableHead>
                    <TableHead className="text-center">Đã nhận</TableHead>
                    <TableHead className="text-center">Còn lại</TableHead>
                    <TableHead>Vị trí nhận/xuất</TableHead>
                    <TableHead>Tình trạng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => {
                    const locationCode =
                      line.receivedLocationCode ||
                      line.returnLocationCode ||
                      (line.receivedLocationId ? locationLabelById.get(line.receivedLocationId) : null) ||
                      (line.returnLocationId ? locationLabelById.get(line.returnLocationId) : null);
                    return (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="font-medium">{line.productName || "Sản phẩm chưa xác định"}</div>
                          <div className="text-xs font-mono text-muted-foreground">{line.productSku || line.lotNumber || "Chưa có mã hàng"}</div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{line.expectedQty}</TableCell>
                        <TableCell className="text-center font-bold text-primary">{line.receivedQty || 0}</TableCell>
                        <TableCell className="text-center font-semibold">{line.remainingQty ?? Math.max(0, line.expectedQty - line.receivedQty)}</TableCell>
                        <TableCell className="font-mono text-xs">{locationCode || "--"}</TableCell>
                        <TableCell><Badge variant="outline">{CONDITION_LABEL[String(line.condition ?? "")] ?? line.condition ?? "--"}</Badge></TableCell>
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
                  <Label>Vị trí nhận hàng trả</Label>
                  <SearchableSelect options={locationOptions} value={selectedLocationId} onValueChange={(locationId) => updateReceiveForm({ locationId })} placeholder="Chọn vị trí..." dialogTitle="Chọn vị trí nhận hàng trả" loading={locationsLoading} disabled={!canReceive} />
                </div>
                <div className="space-y-2">
                  <Label>Số lượng nhận</Label>
                  <Input type="number" value={quantityInputValue} onChange={(e) => updateReceiveForm({ actualQty: e.target.value })} min={0} max={selectedLine?.expectedQty} disabled={!canReceive} />
                </div>
                <div className="space-y-2">
                  <Label>Tình trạng</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["GOOD", "DAMAGED", "DEFECTIVE"] as const).map((condition) => (
                      <Button key={condition} type="button" variant={receiveForm.condition === condition ? "default" : "outline"} size="sm" onClick={() => updateReceiveForm({ condition })} disabled={!canReceive}>
                        {CONDITION_LABEL[condition]}
                      </Button>
                    ))}
                  </div>
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
    </div>
  );
}
