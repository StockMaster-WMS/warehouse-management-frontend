import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { apiErrMessage } from "@/types/api";

type OrderDetailErrorProps = {
  error: unknown;
  onRetry: () => void;
};

export function OrderDetailError({ error, onRetry }: OrderDetailErrorProps) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Không thể tải đơn xuất"
      description={apiErrMessage(error, "Không tải được dữ liệu đơn.")}
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      }
      className="py-10"
    />
  );
}
