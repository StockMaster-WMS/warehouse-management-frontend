"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  DEFAULT_WAREHOUSE_FORM_STATE,
  WarehouseFormDialog,
  type WarehouseFormState,
} from "@/components/features/warehouses";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { apiErrMessage } from "@/types/api";
import {
  useCreateWarehouseMutation,
  useGetWarehouseManagersQuery,
} from "@/store/services/warehouse.service";

export default function NewWarehousePage() {
  const { replace } = useRouter();
  const [formState, setFormState] = useState<WarehouseFormState>(DEFAULT_WAREHOUSE_FORM_STATE);
  const { data: managersData, isLoading: isManagersLoading } = useGetWarehouseManagersQuery();
  const [createWarehouse, { isLoading: isSubmitting }] = useCreateWarehouseMutation();

  const closePage = () => replace("/warehouses");

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
      await createWarehouse({
        code,
        name,
        address: formState.address.trim() || undefined,
        managerIds: formState.managerIds,
        timezone: formState.timezone.trim() || undefined,
        isActive: formState.isActive,
      }).unwrap();
      toast.success("Đã tạo kho mới thành công");
      closePage();
      return true;
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể tạo kho"));
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tạo kho mới"
        description="Nhập thông tin kho để mở rộng mạng lưới lưu trữ."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={closePage}>
            Về danh sách
          </Button>
        }
      />

      <WarehouseFormDialog
        open
        onOpenChange={(open) => {
          if (!open) closePage();
        }}
        editingWarehouse={null}
        isSubmitting={isSubmitting}
        formState={formState}
        setFormState={setFormState}
        managers={managersData?.data ?? []}
        isManagersLoading={isManagersLoading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
