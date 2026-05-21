"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { CustomerForm } from "@/components/features/customers/components/CustomerForm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useCreateCustomerMutation } from "@/store/services/customer.service";
import type { CreateCustomerRequest } from "@/types/customer";

export default function NewCustomerPage() {
  const { push } = useRouter();
  const [createCustomer, { isLoading }] = useCreateCustomerMutation();

  const handleCreate = async (body: CreateCustomerRequest) => {
    const res = await createCustomer(body).unwrap();

    if (!res.success) {
      throw new Error(res.message || "Tạo khách hàng thất bại");
    }

    toast.success(res.message || "Đã tạo khách hàng thành công");
    push("/customers");
  };

  return (
    <div className="w-full space-y-4 pb-20 sm:space-y-6">
      <PageHeader
        title="Thêm khách hàng"
        description="Tạo hồ sơ khách hàng mới để quản lý thông tin liên hệ và trạng thái giao dịch."
        actions={
          <Button
            render={<Link href="/customers" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="size-4" />
          </Button>
        }
      />

      <CustomerForm
        submitLabel="Lưu khách hàng"
        isSubmitting={isLoading}
        onSubmit={handleCreate}
      />
    </div>
  );
}
