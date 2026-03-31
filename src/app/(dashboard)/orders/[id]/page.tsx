"use client";

import { useParams } from "next/navigation";
import { SalesOrderDetailView } from "./_components/sales-order-detail-view";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link } from "lucide-react";

export default function SalesOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const salesOrderId = String(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
      title="Chi tiết đơn xuất"
      description="Trạng thái, dòng hàng và picking."
      actions={
        <Button
          render={<Link href="/orders" />}
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
          className="rounded-full hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      }
    />
      <SalesOrderDetailView salesOrderId={salesOrderId} />
    </div>
  );
}
