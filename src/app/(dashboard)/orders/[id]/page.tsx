"use client";

import { useParams } from "next/navigation";
import { OrderDetailView } from "./_components/OrderDetailView";

export default function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  return <OrderDetailView salesOrderId={id} />;
}
