"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Box, 
  CheckCircle2, 
  ChevronRight, 
  ClipboardList, 
  Loader2, 
  MapPin, 
  Package, 
  RefreshCw, 
  RotateCcw,
  Warehouse
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

export default function RMADetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const { data: rmaRes, isLoading, refetch, isFetching } = useGetReturnRequestByIdQuery(id);
  const rma = rmaRes?.data;
  
  const [receiveReturn, { isLoading: isReceiving }] = useReceiveReturnMutation();
  const [closeReturn, { isLoading: isClosing }] = useCloseReturnRequestMutation();
  
  // Form state for receiving
  const [actualQty, setActualQty] = useState<number>(0);
  const [locationId, setLocationId] = useState("");

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

  const handleReceive = async () => {
    if (!locationId) {
      toast.error("Vui lòng chọn vị trí nhập hàng");
      return;
    }
    if (actualQty <= 0) {
      toast.error("Số lượng thực nhận phải lớn hơn 0");
      return;
    }

    try {
      await receiveReturn({
        id,
        body: { actualQty, locationId }
      }).unwrap();
      toast.success("Đã ghi nhận nhập hàng trả");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể nhận hàng"));
    }
  };

  const handleClose = async () => {
    try {
      await closeReturn(id).unwrap();
      toast.success("Đã đóng hồ sơ RMA");
      router.push("/returns");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể đóng hồ sơ"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!rma) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => router.push("/returns")} className="-ml-2 h-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-mono">{rma.rmaNumber || rma.id}</span>
      </div>

      <PageHeader
        title={`Chi tiết RMA: ${rma.rmaNumber || rma.id}`}
        description="Theo dõi tiếp nhận và xử lý hàng trả về."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
              Làm mới
            </Button>
            {rma.status !== "CLOSED" && (
              <Button size="sm" onClick={handleClose} disabled={isClosing}>
                Đóng hồ sơ
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
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
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
                    <Warehouse className="h-4 w-4 text-slate-400" />
                    {rma.warehouseName || rma.warehouseId}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Đơn hàng liên quan</p>
                  <p className="font-mono text-sm">{rma.orderNumber || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
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
                    <TableHead>Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rma.lines?.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="font-medium">{line.productName}</div>
                        <div className="text-xs font-mono text-muted-foreground">{line.productSku}</div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{line.expectedQty}</TableCell>
                      <TableCell className="text-center font-bold text-indigo-600">{line.receivedQty || 0}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase">{line.reason}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rma.lines?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
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
          <Card className="border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-indigo-600" />
                Ghi nhận Nhận hàng
              </CardTitle>
              <CardDescription>Nhập số lượng thực tế nhận được vào kho.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Vị trí nhập kho</Label>
                <SearchableSelect
                  options={locationOptions}
                  value={locationId}
                  onValueChange={setLocationId}
                  placeholder="Chọn vị trí..."
                  dialogTitle="Chọn vị trí nhập kho"
                  loading={locationsLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Số lượng nhận</Label>
                <Input 
                  type="number" 
                  value={actualQty} 
                  onChange={(e) => setActualQty(Number(e.target.value))}
                  min={1}
                />
              </div>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700" 
                onClick={handleReceive}
                disabled={isReceiving || rma.status === "CLOSED"}
              >
                {isReceiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Xác nhận Nhận hàng
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Nhật ký xử lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold">Khởi tạo RMA</p>
                  <p className="text-muted-foreground">{new Date(rma.createdAt!).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
