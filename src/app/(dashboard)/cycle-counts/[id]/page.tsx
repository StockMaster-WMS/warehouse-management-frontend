"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight, 
  ClipboardCheck, 
  Loader2, 
  RefreshCw, 
  Scale,
  Save,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
import { 
  useGetCycleCountByIdQuery, 
  useRecordCycleCountMutation,
  useCompleteCycleCountMutation,
  useStartCycleCountMutation,
} from "@/store/services/cycle-count.service";
import { apiErrMessage } from "@/types/api";
import { cn } from "@/lib/utils";

export default function CycleCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const { data: countRes, isLoading, refetch, isFetching } = useGetCycleCountByIdQuery(id);
  const count = countRes?.data;
  
  const [recordResults, { isLoading: isRecording }] = useRecordCycleCountMutation();
  const [completeCount, { isLoading: isCompleting }] = useCompleteCycleCountMutation();
  const [startCount, { isLoading: isStarting }] = useStartCycleCountMutation();
  
  // Local state for counts
  const [actualCounts, setActualCounts] = useState<Record<string, number>>({});

  const handleRecordChange = (lineId: string, value: string) => {
    setActualCounts(prev => ({
      ...prev,
      [lineId]: Number(value)
    }));
  };

  const handleSaveResults = async () => {
    if (Object.keys(actualCounts).length === 0) {
      toast.error("Vui lòng nhập ít nhất một kết quả kiểm đếm");
      return;
    }

    try {
      const rows = count?.lines?.filter((line) => actualCounts[line.id] !== undefined) ?? [];
      await Promise.all(
        rows.map((line) =>
          recordResults({
            id,
            lineId: line.id,
            countedQty: actualCounts[line.id],
          }).unwrap(),
        ),
      );
      toast.success("Đã lưu kết quả kiểm đếm");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể lưu kết quả"));
    }
  };

  const handleComplete = async () => {
    try {
      await completeCount(id).unwrap();
      toast.success("Đã hoàn tất và duyệt điều chỉnh kho");
      router.push("/cycle-counts");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể hoàn tất kiểm kê"));
    }
  };

  const handleStart = async () => {
    try {
      await startCount(id).unwrap();
      toast.success("Đã bắt đầu kiểm kê");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể bắt đầu kiểm kê"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!count) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => router.push("/cycle-counts")} className="-ml-2 h-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-mono">{count.countNumber || count.id}</span>
      </div>

      <PageHeader
        title={`Đợt kiểm kê: ${count.countNumber || count.id}`}
        description={`Phạm vi: ${count.scope} tại kho ${count.warehouseName || count.warehouseId}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
              Làm mới
            </Button>
            {count.status === "PENDING" && (
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-md" onClick={handleStart} disabled={isStarting}>
                {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                Bắt đầu kiểm
              </Button>
            )}
            {count.status === "IN_PROGRESS" && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-md" onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Hoàn tất & Điều chỉnh
              </Button>
            )}
          </div>
        }
      />

      <Card className="overflow-hidden border-indigo-100 dark:border-indigo-900/30">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base">Bảng ghi nhận số đếm</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white dark:bg-slate-950">
                {count.status}
              </Badge>
              {count.status === "IN_PROGRESS" && (
                <Button size="sm" variant="outline" onClick={handleSaveResults} disabled={isRecording}>
                  {isRecording ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Lưu bản nháp
                </Button>
              )}
            </div>
          </div>
          <CardDescription>Nhập số lượng thực tế đếm được tại vị trí. Chênh lệch sẽ tự động được tính toán.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">Vị trí / Sản phẩm</TableHead>
                <TableHead className="text-center">Tồn hệ thống</TableHead>
                <TableHead className="w-40 text-center">Số đếm thực tế</TableHead>
                <TableHead className="text-center">Chênh lệch</TableHead>
                <TableHead className="pr-6">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {count.lines?.map((line) => {
                const actual = actualCounts[line.id] ?? line.countedQty ?? 0;
                const variance = actual - (line.systemQty || 0);
                
                return (
                  <TableRow key={line.id} className="hover:bg-muted/50">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800">
                          {line.locationCode?.slice(-2) || "—"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{line.productName}</div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
                            <span className="font-mono">{line.productSku}</span>
                            <span>•</span>
                            <span>{line.locationCode}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-medium">
                      {line.systemQty}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        className={cn(
                          "h-9 text-center font-bold",
                          count.status !== "IN_PROGRESS" && "bg-slate-50 opacity-80"
                        )}
                        defaultValue={line.countedQty ?? 0}
                        onChange={(e) => handleRecordChange(line.id, e.target.value)}
                        disabled={count.status !== "IN_PROGRESS"}
                        min={0}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        "flex items-center justify-center gap-1 font-mono font-bold",
                        variance === 0 ? "text-slate-400" : variance > 0 ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {variance !== 0 && <Scale className="h-3 w-3" />}
                        {variance > 0 ? `+${variance}` : variance}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {line.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!count.lines?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <EmptyState
                      icon={AlertTriangle}
                      title="Chưa có dữ liệu dòng kiểm"
                      description="Hệ thống chưa sinh dữ liệu kiểm kê cho đợt này."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Lưu ý quan trọng</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">Việc hoàn tất kiểm kê sẽ tự động tạo các phiếu điều chỉnh tồn kho để khớp với số liệu thực tế.</p>
          </div>
        </div>
        {count.status === "IN_PROGRESS" && (
          <Button className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap" onClick={handleSaveResults}>
            Gửi kết quả lên hệ thống
          </Button>
        )}
      </div>
    </div>
  );
}
