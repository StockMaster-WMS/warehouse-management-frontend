"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/types/supplier";
import { useHasPermissions } from "@/components/permission-control";
import { ADMIN_MANAGER_ROLES } from "@/lib/access-control";
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

/* ── Status config using shared badge ── */
const SUPPLIER_STATUS_CONFIG: Record<string, StatusConfig> = {
  active: { label: "Đang hoạt động", color: "emerald" },
  ACTIVE: { label: "Đang hoạt động", color: "emerald" },
  inactive: { label: "Ngừng hoạt động", color: "slate" },
  INACTIVE: { label: "Ngừng hoạt động", color: "slate" },
  suspended: { label: "Tạm ngưng", color: "amber" },
  SUSPENDED: { label: "Tạm ngưng", color: "amber" },
};

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
          <label className="text-xs font-bold uppercase text-muted-foreground">
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
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
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
      <DetailPageLayout>
        <DetailBreadcrumb backHref="/suppliers" backLabel="Nhà cung cấp" />
        <DetailSkeleton />
      </DetailPageLayout>
    );
  }

  /* ── Error / Not found ── */
  if (isError || !supplier) {
    return (
      <DetailPageLayout>
        <DetailBreadcrumb backHref="/suppliers" backLabel="Nhà cung cấp" />
        <PageHeader
          title="Chi tiết nhà cung cấp"
          description="Không tìm thấy"
        />
        <DetailErrorState
          message={apiErrMessage(error, "Không tìm thấy nhà cung cấp.")}
          backHref="/suppliers"
          backLabel="Về danh sách"
          onRetry={() => window.location.reload()}
        />
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout>
      <DetailBreadcrumb
        backHref="/suppliers"
        backLabel="Nhà cung cấp"
        currentLabel={supplier.code}
      />

      <PageHeader
        title="Chi tiết nhà cung cấp"
        description={`${supplier.name} (${supplier.code})`}
      />

      <DetailGrid
        sidebar={
          <>
            {/* Status & Timestamps */}
            <DetailSection
              icon={<CalendarDays className="size-4" />}
              title="Trạng thái & Lịch sử"
            >
              <div className="mb-4">
                <DetailStatusBadge
                  status={supplier.status}
                  statusConfig={SUPPLIER_STATUS_CONFIG}
                />
              </div>
              <div className="space-y-1 divide-y divide-border">
                <DetailInfoField
                  label="Ngày tạo"
                  value={formatDate(supplier.createdAt)}
                />
                <DetailInfoField
                  label="Cập nhật lần cuối"
                  value={formatDate(supplier.updatedAt)}
                />
              </div>
            </DetailSection>

            {/* Actions */}
            {canManageSupplier ? (
              <DetailSection title="Hành động">
                <div className="flex flex-col gap-3">
                  <Button
                    render={<Link href={`/suppliers/${id}/edit`} />}
                    nativeButton={false}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Edit2 className="mr-2 size-4" />
                    Sửa thông tin
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setStatusOpen(true)}
                  >
                    <ShieldAlert className="mr-2 size-4" />
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
                    <Trash2 className="mr-2 size-4" />
                    Xóa nhà cung cấp
                  </Button>
                  {hasPo && (
                    <p className="text-center text-[11px] text-amber-600">
                      Không thể xóa, nhà cung cấp đang có đơn nhập hàng.
                    </p>
                  )}
                </div>
              </DetailSection>
            ) : null}
          </>
        }
      >
        {/* Business info */}
        <DetailSection
          icon={<Building2 className="size-4" />}
          title="Thông tin doanh nghiệp"
        >
          <div className="divide-y divide-border">
            <DetailInfoField
              icon={<Hash className="size-4" />}
              label="Mã NCC"
              value={supplier.code}
              mono
            />
            <DetailInfoField
              icon={<Building2 className="size-4" />}
              label="Tên nhà cung cấp"
              value={supplier.name}
            />
            <DetailInfoField
              icon={<Hash className="size-4" />}
              label="Mã số thuế"
              value={supplier.taxCode}
              mono
            />
          </div>
        </DetailSection>

        {/* Contact info */}
        <DetailSection
          icon={<Phone className="size-4" />}
          title="Thông tin liên hệ"
        >
          <div className="divide-y divide-border">
            <DetailInfoField
              icon={<Briefcase className="size-4" />}
              label="Người liên hệ"
              value={supplier.contactName}
            />
            <DetailInfoField
              icon={<Phone className="size-4" />}
              label="Số điện thoại"
              value={supplier.contactPhone}
            />
            <DetailInfoField
              icon={<Mail className="size-4" />}
              label="Email"
              value={supplier.contactEmail}
            />
            <DetailInfoField
              icon={<MapPin className="size-4" />}
              label="Địa chỉ"
              value={supplier.address}
            />
          </div>
        </DetailSection>

        {/* Terms */}
        <DetailSection
          icon={<Clock className="size-4" />}
          title="Điều khoản"
        >
          <div className="divide-y divide-border">
            <DetailInfoField
              icon={<Clock className="size-4" />}
              label="Thời hạn thanh toán"
              value={
                supplier.paymentTerms != null
                  ? `${supplier.paymentTerms} ngày`
                  : null
              }
            />
            <DetailInfoField
              icon={<Truck className="size-4" />}
              label="Thời gian giao hàng"
              value={
                supplier.leadTimeDays != null
                  ? `${supplier.leadTimeDays} ngày`
                  : null
              }
            />
          </div>
        </DetailSection>
      </DetailGrid>

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
    </DetailPageLayout>
  );
}
