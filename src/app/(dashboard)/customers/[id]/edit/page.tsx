"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { CustomerForm } from "@/components/features/customers/components/CustomerForm";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
} from "@/store/services/customer.service";
import { apiErrMessage } from "@/types/api";
import type { UpdateCustomerRequest } from "@/types/customer";

export default function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const { push } = useRouter();

  const {
    data: customerRes,
    isLoading,
    isError,
    error,
  } = useGetCustomerByIdQuery(id);
  const [updateCustomer, { isLoading: isSaving }] = useUpdateCustomerMutation();
  const customer = customerRes?.data;

  const handleUpdate = async (body: UpdateCustomerRequest) => {
    const res = await updateCustomer({ id, body }).unwrap();

    if (!res.success) {
      throw new Error(res.message || "Cập nhật khách hàng thất bại");
    }

    toast.success(res.message || "Đã cập nhật khách hàng");
    push("/customers");
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6 pb-20">
        <PageHeader
          title="Chỉnh sửa khách hàng"
          description="Đang tải dữ liệu khách hàng..."
          actions={
            <Button
              render={<Link href="/customers" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
            >
              <ArrowLeft className="size-4" />
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="w-full space-y-6 pb-20">
        <PageHeader
          title="Chỉnh sửa khách hàng"
          description="Không tìm thấy khách hàng"
          actions={
            <Button
              render={<Link href="/customers" />}
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
            >
              <ArrowLeft className="size-4" />
            </Button>
          }
        />
        <EmptyState
          icon={AlertCircle}
          title="Không tải được khách hàng"
          description={apiErrMessage(error, "Khách hàng không tồn tại hoặc đã bị xóa.")}
          action={
            <Button render={<Link href="/customers" />} nativeButton={false}>
              Quay lại danh sách
            </Button>
          }
          className="rounded-2xl border border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900"
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-20 sm:space-y-6">
      <PageHeader
        title="Chỉnh sửa khách hàng"
        description={`${customer.name} (${customer.code})`}
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
        key={customer.id}
        customer={customer}
        submitLabel="Cập nhật khách hàng"
        isSubmitting={isSaving}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
