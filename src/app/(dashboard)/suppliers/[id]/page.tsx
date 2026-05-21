"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Edit2,
  Hash,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  Truck,
  CalendarDays,
  ShieldAlert,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useGetSupplierByIdQuery,
  useChangeSupplierStatusMutation,
  useDeleteSupplierMutation,
  useCheckSupplierHasPoQuery,
} from "@/store/services/supplier.service";
import { apiErrMessage } from "@/types/api";
import type { SupplierStatus } from "@/types/supplier";
import {
  getSupplierDisplayName,
  supplierStatusLabel,
  supplierStatusClass,
} from "@/types/supplier";
import { useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";

/* ── helpers ── */
const viDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return viDateTimeFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p
          className={`mt-0.5 text-sm text-slate-900 dark:text-white ${mono ? "font-mono" : ""}`}
        >
          {value?.trim() || "—"}
        </p>
      </div>
    </div>
  );
}

/* ── Change Status Dialog (reusable within detail) ── */
function ChangeStatusDialog({
  open,
  onOpenChange,
  supplierId,
  currentStatus,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplierId: string;
  currentStatus: string;
}) {
  const normalized = currentStatus.toLowerCase() as SupplierStatus;
  const [newStatus, setNewStatus] = useState<SupplierStatus>(normalized);
  const [changeStatus, { isLoading }] = useChangeSupplierStatusMutation();

  const handleSubmit = async () => {
    try {
      const res = await changeStatus({
        id: supplierId,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Đổi trạng thái</DialogTitle>
          <DialogDescription>
            Chọn trạng thái mới cho nhà cung cấp.
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
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
              <SelectItem value="suspended">Tạm ngưng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || newStatus === normalized}
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
export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { push } = useRouter();
  const canManageSupplier = useHasPermissions(ADMIN_MANAGER_ROLES);

  const {
    data: supplierRes,
    isLoading,
    isError,
    error,
  } = useGetSupplierByIdQuery(id);
  const supplier = supplierRes?.data;

  const { data: hasPoRes } = useCheckSupplierHasPoQuery(id, {
    skip: !supplier,
  });
  const hasPo = hasPoRes?.data === true;

  const [deleteSupplier] = useDeleteSupplierMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const res = await deleteSupplier(id).unwrap();
      if (!res.success) {
        toast.error(res.message || "Xóa nhà cung cấp thất bại");
        return;
      }
      toast.success(res.message || "Đã xóa nhà cung cấp");
      push("/suppliers");
    } catch (err) {
      const msg = apiErrMessage(err);
      if (msg.includes("đơn nhập hàng")) {
        toast.error("Không thể xóa nhà cung cấp đang có đơn nhập hàng");
      } else {
        toast.error(msg);
      }
    }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="w-full space-y-6 pb-20">
        <PageHeader
          title="Chi tiết nhà cung cấp"
          description="Đang tải…"
          actions={
            <Button
              render={<Link href="/suppliers" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-60" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Error / Not found ── */
  if (isError || !supplier) {
    return (
      <div className="w-full space-y-6 pb-20">
        <PageHeader
          title="Chi tiết nhà cung cấp"
          description="Không tìm thấy"
          actions={
            <Button
              render={<Link href="/suppliers" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
        <div className="flex flex-col items-center gap-4 py-20 text-slate-500">
          <AlertCircle className="h-10 w-10 text-rose-400" />
          <p className="text-sm">
            {apiErrMessage(error, "Không tìm thấy nhà cung cấp.")}
          </p>
          <Button
            render={<Link href="/suppliers" />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            Về danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-20 sm:space-y-6">
      <PageHeader
        title="Chi tiết nhà cung cấp"
        description={`${supplier.name} (${supplier.code})`}
        actions={
          <Button
            render={<Link href="/suppliers" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* ── Left: Info ── */}
        <div className="space-y-6 md:col-span-2">
          {/* Business info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin doanh nghiệp
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <InfoRow icon={Hash} label="Mã NCC" value={supplier.code} mono />
              <InfoRow
                icon={Building2}
                label="Tên nhà cung cấp"
                value={supplier.name}
              />
              <InfoRow
                icon={Hash}
                label="Mã số thuế"
                value={supplier.taxCode}
                mono
              />
              <div className="flex items-start gap-3 py-2.5">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Trạng thái
                  </p>
                  <div className="mt-1">
                    <Badge
                      variant="secondary"
                      className={`font-normal ${supplierStatusClass(supplier.status)}`}
                    >
                      {supplierStatusLabel(supplier.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Phone className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Thông tin liên hệ
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <InfoRow
                icon={Briefcase}
                label="Người liên hệ"
                value={supplier.contactName}
              />
              <InfoRow
                icon={Phone}
                label="Số điện thoại"
                value={supplier.contactPhone}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={supplier.contactEmail}
              />
              <InfoRow icon={MapPin} label="Địa chỉ" value={supplier.address} />
            </div>
          </div>

          {/* Terms */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <Clock className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Điều khoản
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <InfoRow
                icon={Clock}
                label="Thời hạn thanh toán"
                value={
                  supplier.paymentTerms != null
                    ? `${supplier.paymentTerms} ngày`
                    : null
                }
              />
              <InfoRow
                icon={Truck}
                label="Thời gian giao hàng"
                value={
                  supplier.leadTimeDays != null
                    ? `${supplier.leadTimeDays} ngày`
                    : null
                }
              />
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-6">
          {/* Timestamps */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2 border-b pb-4 dark:border-slate-800">
              <CalendarDays className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Lịch sử
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ngày tạo
                </p>
                <p className="mt-0.5 text-slate-900 dark:text-white">
                  {formatDate(supplier.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Cập nhật lần cuối
                </p>
                <p className="mt-0.5 text-slate-900 dark:text-white">
                  {formatDate(supplier.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {canManageSupplier ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 border-b pb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:border-slate-800 dark:text-white">
                Hành động
              </h3>
              <div className="flex flex-col gap-3">
                <Button
                  render={<Link href={`/suppliers/${id}/edit`} />}
                  nativeButton={false}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Sửa thông tin
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStatusOpen(true)}
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Đổi trạng thái
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                  disabled={hasPo}
                  onClick={() => setDeleteOpen(true)}
                  title={
                    hasPo
                      ? "Không thể xóa NCC đang có đơn nhập hàng"
                      : "Xóa nhà cung cấp"
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa nhà cung cấp
                </Button>
                {hasPo && (
                  <p className="text-center text-[11px] text-amber-600">
                    Không thể xóa — nhà cung cấp đang có đơn nhập hàng.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Dialogs */}
      {canManageSupplier ? (
        <ChangeStatusDialog
          key={statusOpen ? "open" : "closed"}
          open={statusOpen}
          onOpenChange={setStatusOpen}
          supplierId={id}
          currentStatus={supplier.status}
        />
      ) : null}

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        itemName={getSupplierDisplayName(supplier)}
        title="Xóa nhà cung cấp"
        description="Bạn có chắc muốn xóa nhà cung cấp này? Hành động này không thể hoàn tác."
      />
    </div>
  );
}
