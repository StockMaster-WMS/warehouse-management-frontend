import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ComingSoonCard } from "@/components/ui/coming-soon-card";

export default function ReportsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Báo cáo"
        description="Dữ liệu phân tích giúp bạn đưa ra những quyết định quản lý kho hiệu quả hơn."
        actions={
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="mr-2 h-4 w-4" />
            Tải báo cáo tổng hợp
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[
          "Doanh thu theo ngày",
          "Tỷ lệ hoàn thành đơn",
          "Top SKU luân chuyển",
          "Hiệu suất kho theo khu vực",
        ].map((title) => (
          <ComingSoonCard
            key={title}
            icon={BarChart3}
            title={title}
            description="Module biểu đồ sẽ hiển thị khi dữ liệu phân tích được kết nối từ backend."
          />
        ))}
      </div>
    </div>
  );
}
