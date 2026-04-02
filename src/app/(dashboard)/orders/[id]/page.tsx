"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { OrderDetailView } from "./_components/OrderDetailView";

export default function SalesOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const salesOrderId = String(params.id);

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
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
        }
      />
      <OrderDetailView salesOrderId={salesOrderId} />
    </div>
  );
}
