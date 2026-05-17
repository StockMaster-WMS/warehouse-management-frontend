"use client";

import { useMemo, useReducer } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight, 
  ClipboardList, 
  Loader2, 
  Package, 
  RefreshCw, 
  Warehouse
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
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  useGetReturnRequestByIdQuery, 
  useReceiveReturnMutation,
  useCloseReturnRequestMutation 
} from "@/store/services/return.service";
import { useGetLocationsListQuery } from "@/store/services/location.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiErrMessage } from "@/types/api";
import { cn } from "@/lib/utils";

const RMA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return RMA_DATE_TIME_FORMATTER.format(timestamp);
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
  condition: "RETURNED",
  notes: "",
};

function receiveFormReducer(
  state: ReceiveFormState,
  patch: Partial<ReceiveFormState>,
) {
  return { ...state, ...patch };
}

export default function RMADetailPage() {
  const { id } = useParams<{ id: string }>();
  const { push } = useRouter();
  
  const { data: rmaRes, isLoading, refetch, isFetching } = useGetReturnRequestByIdQuery(id);
  const rma = rmaRes?.data;
  
  const [receiveReturn, { isLoading: isReceiving }] = useReceiveReturnMutation();
  const [closeReturn, { isLoading: isClosing }] = useCloseReturnRequestMutation();
  
  const [receiveForm, updateReceiveForm] = useReducer(
    receiveFormReducer,
    INITIAL_RECEIVE_FORM,
  );

  const { data: locationsRes, isLoading: locationsLoading } = useGetLocationsListQuery({
    page: 0,
    size: 100,
    warehouseId: rma?.warehouseId ?? undefined,
  });
  
  const locationOptions = useMemo(() => {
    return (locationsRes?.data?.content ?? []).map(loc => ({
      value: loc.id,
      label: loc.code,
    }));
  }, [locationsRes]);
  const locationLabelById = useMemo(() => {
    return new Map(
      (locationsRes?.data?.content ?? []).map((loc) => [loc.id, loc.code]),
    );
  }, [locationsRes]);

  const lines = useMemo(() => rma?.lines ?? [], [rma?.lines]);
  const selectedLine = lines.find((line) => line.id === receiveForm.selectedLineId) ?? lines[0];
  const selectedLocationId = receiveForm.locationId || selectedLine?.receivedLocationId || "";
  const quantityInputValue =
    receiveForm.actualQty ||
    (selectedLine ? String(selectedLine.receivedQty ?? 0) : "");
  const isCompleted = rma?.status === "COMPLETED" || rma?.status === "CLOSED";
  const allLinesReceived =
    lines.length > 0 &&
    lines.every(
      (line) => Number(line.receivedQty ?? 0) >= Number(line.expectedQty ?? 0),
    );
  const canComplete = !isCompleted && allLinesReceived;
  const lineOptions = useMemo(
    () =>
      lines.map((line) => ({
        value: line.id,
        label: `${line.productSku || line.productName || line.productId} · ${line.receivedQty || 0}/${line.expectedQty}`,
      })),
    [lines],
  );

  const handleSelectLine = (selectedLineId: string) => {
    const nextLine = lines.find((line) => line.id === selectedLineId);
    updateReceiveForm({
      selectedLineId,
      actualQty: nextLine ? String(nextLine.receivedQty ?? 0) : "",
      locationId: nextLine?.receivedLocationId ?? "",
    });
  };

  const handleReceive = async () => {
    if (!selectedLine) {
      toast.error("RMA chưa có dòng hàng để nhận");
      return;
    }
    const receivedQty = Number(quantityInputValue);
    const expectedQty = Number(selectedLine.expectedQty ?? 0);
    if (!Number.isFinite(receivedQty) || receivedQty < 0) {
      toast.error("Số lượng thực nhận không được âm");
      return;
    }
    if (receivedQty > expectedQty) {
      toast.error("Số lượng thực nhận không được vượt quá số lượng kỳ vọng");
      return;
    }
    if (receivedQty > 0 && !selectedLocationId) {
      toast.error("Vui lòng chọn vị trí nhập hàng");
      return;
    }

    try {
      await receiveReturn({
        id,
        body: {
          itemId: selectedLine.id,
          receivedQty,
          locationId: selectedLocationId || undefined,
          condition: receiveForm.condition.trim() || undefined,
          notes: receiveForm.notes.trim() || undefined,
        }
      }).unwrap();
      toast.success("Đã ghi nhận nhập hàng trả");
      updateReceiveForm({ actualQty: String(receivedQty), notes: "" });
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể nhận hàng"));
    }
  };

  const handleClose = async () => {
    if (!canComplete) {
      toast.error("Chỉ hoàn tất RMA khi tất cả dòng hàng đã nhận đủ");
      return;
    }
    try {
      await closeReturn(id).unwrap();
      toast.success("Đã đóng hồ sơ RMA");
      push("/returns");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể đóng hồ sơ"));
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
        <span className="font-mono">{rma.rmaNumber || rma.id}</span>
      </div>

      <PageHeader
        title={`Chi tiết RMA: ${rma.rmaNumber || rma.id}`}
        description="Theo dõi tiếp nhận và xử lý hàng trả về."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
              Làm mới
            </Button>
            {!isCompleted && (
              <Button size="sm" onClick={handleClose} disabled={!canComplete || isClosing}>
                Hoàn tất hồ sơ
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Thông tin tiếp nhận</CardTitle>
                <CardDescription>Chi tiết nguồn hàng và lý do trả.</CardDescription>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {rma.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Đối tác</p>
                  <p className="font-semibold">{rma.customerName || rma.supplierName || "Nội bộ"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Lý do</p>
                  <p className="font-semibold text-rose-600">{rma.reason}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Kho xử lý</p>
                  <p className="flex items-center gap-1.5 font-semibold">
                    <Warehouse className="size-4 text-zinc-400" />
                    {rma.warehouseName || rma.warehouseId}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Đơn hàng liên quan</p>
                  <p className="font-mono text-sm">{rma.orderNumber || rma.orderId || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-5 text-primary" />
                Danh sách sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-center">Kỳ vọng</TableHead>
                    <TableHead className="text-center">Thực nhận</TableHead>
                    <TableHead>Vị trí nhận</TableHead>
                    <TableHead>Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="font-medium">{line.productName || line.productId}</div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {line.productSku || line.lotNumber || "Chưa có SKU"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{line.expectedQty}</TableCell>
                      <TableCell className="text-center font-bold text-primary">{line.receivedQty || 0}</TableCell>
                      <TableCell>
                        {line.receivedLocationId ? (
                          <span className="font-mono text-xs">
                            {locationLabelById.get(line.receivedLocationId) ?? line.receivedLocationId}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa nhận</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {line.condition || line.reason || rma.reason}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!lines.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Chưa có sản phẩm nào được khai báo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/10 dark:border-primary/30 dark:bg-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="size-5 text-primary" />
                Ghi nhận Nhận hàng
              </CardTitle>
              <CardDescription>Cập nhật số lượng đã nhận hiện tại cho từng dòng hàng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Dòng hàng RMA</Label>
                <SearchableSelect
                  options={lineOptions}
                  value={selectedLine?.id ?? ""}
                  onValueChange={handleSelectLine}
                  placeholder="Chọn dòng hàng…"
                  dialogTitle="Chọn dòng hàng RMA"
                  disabled={!lineOptions.length || isCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label>Vị trí nhập kho</Label>
                <SearchableSelect
                  options={locationOptions}
                  value={selectedLocationId}
                  onValueChange={(locationId) => updateReceiveForm({ locationId })}
                  placeholder="Chọn vị trí…"
                  dialogTitle="Chọn vị trí nhập kho"
                  loading={locationsLoading}
                  disabled={isCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label>Số lượng nhận hiện tại</Label>
                <Input 
                  type="number" 
                  value={quantityInputValue}
                  onChange={(e) => updateReceiveForm({ actualQty: e.target.value })}
                  min={0}
                  max={selectedLine?.expectedQty}
                  disabled={isCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label>Tình trạng</Label>
                <Input
                  value={receiveForm.condition}
                  onChange={(event) => updateReceiveForm({ condition: event.target.value })}
                  placeholder="Nguyên vẹn, xước nhẹ, lỗi…"
                  disabled={isCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input
                  value={receiveForm.notes}
                  onChange={(event) => updateReceiveForm({ notes: event.target.value })}
                  placeholder="Ghi chú xử lý nếu có"
                  disabled={isCompleted}
                />
              </div>
              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                onClick={handleReceive}
                disabled={isReceiving || isCompleted || !selectedLine}
              >
                {isReceiving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                Cập nhật nhận hàng
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Nhật ký xử lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <div className="mt-1 size-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold">Khởi tạo RMA</p>
                  <p className="text-muted-foreground">{formatDateTime(rma.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
