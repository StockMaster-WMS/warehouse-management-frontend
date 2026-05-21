"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { OrderDetailView } from "./_components/OrderDetailView";

export default function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Chi tiết đơn xuất"
        description="Theo dõi tiến trình xử lý, dòng hàng và thao tác vận hành trong một màn hình."
        actions={
          <Button
            render={<Link href="/orders" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="border-slate-200"
          >
            <ArrowLeft className="mr-2 size-4" />
            Quay lại danh sách
          </Button>
        }
      />
      <OrderDetailView salesOrderId={id} />
    </div>
  );
}
