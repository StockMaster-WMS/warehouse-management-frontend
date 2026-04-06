"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  SUPPLIERS_PAGE_SIZE,
  SupplierDeleteDialog,
  SuppliersSearchSection,
  SuppliersStatsGrid,
  SuppliersTable,
  useSuppliersPageLogic,
} from "@/components/features/suppliers";

/* ══════════════════════════════════════════
   Purchase History Dialog
   ══════════════════════════════════════════ */
function PurchaseHistoryDialog({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier | null;
}) {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useGetPurchaseOrdersQuery(
    {
      page,
      size: 10,
      supplierId: supplier?.id ?? "",
      sort: "createdAt",
      sortDir: "desc",
    },
    { skip: !supplier?.id || !open },
  );

  const rows = data?.data?.content ?? [];
  const totalPages = data?.data?.total_pages ?? 0;
  const totalElements = data?.data?.total_elements ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Lịch sử nhập hàng</DialogTitle>
          <DialogDescription>
            {supplier ? `${supplier.name} (${supplier.code})` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Mã PO</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Ngày dự kiến</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`po-skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-3 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="mx-auto h-5 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-slate-500"
                  >
                    Chưa có đơn nhập hàng nào từ nhà cung cấp này.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link
                        href={`/purchase-orders/${po.id}`}
                        className="font-mono text-xs font-medium text-indigo-600 hover:underline"
                      >
                        {po.poNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">
                      {po.orderDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {po.expectedDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {po.totalAmount != null
                        ? Number(po.totalAmount).toLocaleString("vi-VN") + " đ"
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`font-normal ${poStatusClass(po.status ?? "")}`}
                      >
                        {PO_STATUS_LABEL[po.status ?? ""] ?? po.status ?? "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3 text-xs text-slate-500">
            <span>
              {totalElements} đơn · Trang {page + 1}/{totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-3 w-3" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════
   Change Status Dialog
   ══════════════════════════════════════════ */
function ChangeStatusDialog({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier | null;
}) {
  const currentStatus = (
    supplier?.status ?? "ACTIVE"
  ).toUpperCase() as SupplierStatus;
  const [newStatus, setNewStatus] = useState<SupplierStatus>(currentStatus);
  const [changeStatus, { isLoading }] = useChangeSupplierStatusMutation();

  const handleSubmit = async () => {
    if (!supplier) return;
    try {
      const res = await changeStatus({
        id: supplier.id,
        status: newStatus,
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Đổi trạng thái thất bại");
        return;
      }
      toast.success(
        `Đã chuyển trạng thái sang "${supplierStatusLabel(newStatus)}"`,
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Đổi trạng thái</DialogTitle>
          <DialogDescription>
            {supplier ? `${supplier.name} (${supplier.code})` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-slate-500">
            Trạng thái mới
          </label>
          <Select
            value={newStatus}
            onValueChange={(v) => setNewStatus(v as SupplierStatus)}
          >
            <SelectTrigger>
              <span className="flex flex-1 truncate text-left">
                {supplierStatusLabel(newStatus)}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
              <SelectItem value="SUSPENDED">Tạm ngưng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || newStatus.toUpperCase() === currentStatus}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════ */
export default function SuppliersPage() {
  const logic = useSuppliersPageLogic();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Nhà cung cấp"
        description="Quản lý thông tin đối tác cung ứng và lịch sử giao dịch."
        actions={
          <Button
            render={<Link href="/suppliers/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 shadow-sm shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm đối tác mới
          </Button>
        }
      />
      <SuppliersStatsGrid
        totalPartners={logic.totalPartners}
        activeCount={logic.activeCount}
        inactiveCount={logic.inactiveCount}
        multiPage={logic.multiPage}
        pageDisplay={
          logic.paged
            ? `${logic.paged.page + 1}/${logic.paged.total_pages} · ${logic.paged.size}`
            : `${logic.rows.length}`
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
        <SuppliersSearchSection
          noContainer
          searchInput={logic.searchInput}
          onSearchChange={logic.setSearchInput}
          hasAnyFilter={logic.hasAnyFilter}
          onClearFilters={logic.clearFilters}
        />

        <SuppliersTable
          noContainer
          rows={logic.rows}
          page={logic.page}
          totalElements={logic.paged?.total_elements ?? logic.rows.length}
          totalPages={logic.paged?.total_pages ?? 1}
          pageSize={logic.paged?.size ?? SUPPLIERS_PAGE_SIZE}
          canGoPrev={logic.canGoPrev}
          canGoNext={logic.canGoNext}
          isLoading={logic.isLoading}
          isFetching={logic.isFetching}
          isError={logic.isError}
          error={logic.error}
          hasAnyFilter={logic.hasAnyFilter}
          onRetry={logic.refetch}
          onPrevPage={() => logic.setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => logic.setPage((p) => p + 1)}
          onRequestDelete={logic.openDeleteDialog}
        />
      </div>

      <SupplierDeleteDialog
        open={logic.isDeleteDialogOpen}
        onOpenChange={logic.setIsDeleteDialogOpen}
        onConfirm={logic.handleDelete}
        itemName={logic.deleteTarget?.name ?? ""}
      />
    </div>
  );
}
