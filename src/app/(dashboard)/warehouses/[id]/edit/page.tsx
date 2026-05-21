"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  WarehouseFormDialog,
  type WarehouseFormState,
} from "@/components/features/warehouses";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrMessage } from "@/types/api";
import {
  useGetWarehouseByIdQuery,
  useGetWarehouseManagersQuery,
  useUpdateWarehouseMutation,
} from "@/store/services/warehouse.service";
import type { Warehouse, WarehouseManager } from "@/types/warehouse";

function warehouseToFormState(warehouse: Warehouse): WarehouseFormState {
  return {
    code: warehouse.code ?? "",
    name: warehouse.name ?? "",
    address: warehouse.address ?? "",
    managerIds: warehouse.managers?.map((manager) => manager.id) ?? [],
    timezone: warehouse.timezone ?? "Asia/Ho_Chi_Minh",
    isActive: warehouse.isActive,
  };
}

function EditWarehouseForm({
  warehouse,
  managers,
  isManagersLoading,
  onClose,
}: {
  warehouse: Warehouse;
  managers: WarehouseManager[];
  isManagersLoading: boolean;
  onClose: () => void;
}) {
  const [formState, setFormState] = useState<WarehouseFormState>(() => warehouseToFormState(warehouse));
  const [updateWarehouse, { isLoading: isSubmitting }] = useUpdateWarehouseMutation();

  const handleSubmit = async () => {
    const code = formState.code.trim();
    const name = formState.name.trim();

    if (!code) {
      toast.error("Mã kho không được để trống");
      return false;
    }
    if (!name) {
      toast.error("Tên kho không được để trống");
      return false;
    }

    try {
      await updateWarehouse({
        id: warehouse.id,
        body: {
          code,
          name,
          address: formState.address.trim() || undefined,
          managerIds: formState.managerIds,
          timezone: formState.timezone.trim() || undefined,
          isActive: formState.isActive,
        },
      }).unwrap();
      toast.success("Đã cập nhật kho thành công");
      onClose();
      return true;
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể cập nhật kho"));
      return false;
    }
  };

  return (
    <WarehouseFormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      editingWarehouse={warehouse}
      isSubmitting={isSubmitting}
      formState={formState}
      setFormState={setFormState}
      managers={managers}
      isManagersLoading={isManagersLoading}
      onSubmit={handleSubmit}
    />
  );
}

export default function EditWarehousePage() {
  const { replace } = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, isError, error } = useGetWarehouseByIdQuery(id, { skip: !id });
  const { data: managersData, isLoading: isManagersLoading } = useGetWarehouseManagersQuery();
  const warehouse = data?.data ?? null;

  const closePage = () => replace("/warehouses");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sửa thông tin kho" description="Đang tải dữ liệu kho..." />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !warehouse) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sửa thông tin kho" description="Không thể tải dữ liệu kho." />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {apiErrMessage(error, "Kho không tồn tại hoặc bạn không có quyền truy cập.")}
        </div>
        <Button type="button" variant="outline" onClick={closePage}>
          Về danh sách kho
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sửa thông tin kho"
        description={`Cập nhật cấu hình cho ${warehouse.name}.`}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={closePage}>
            Về danh sách
          </Button>
        }
      />

      <EditWarehouseForm
        warehouse={warehouse}
        managers={managersData?.data ?? []}
        isManagersLoading={isManagersLoading}
        onClose={closePage}
      />
    </div>
  );
}
