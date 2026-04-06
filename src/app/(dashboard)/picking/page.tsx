"use client";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, ScanBarcode } from "lucide-react";
import { OverviewTab } from "./overview-tab";
import { OperationTab } from "./operation-tab";

export default function PickingPage() {
    return (
        <div className="flex h-full flex-col bg-slate-50/50">
            <PageHeader
                title="Quản lý lấy hàng"
                description="Theo dõi và thao tác lấy hàng theo đơn xuất"
            />

      <div className="flex-1 space-y-6 pt-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 transition-all">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-2">
              <TabsTrigger
                value="overview"
                className="group flex h-auto flex-col items-start gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-slate-600 shadow-none transition-all data-[state=active]:border-indigo-200 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:data-[state=active]:border-indigo-900/50 dark:data-[state=active]:bg-indigo-950/40 dark:data-[state=active]:text-indigo-200"
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  <LayoutGrid className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  Tổng quan (Kho)
                </div>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 group-data-[state=active]:text-indigo-600/80 line-clamp-1">
                  Quản lý hiệu suất và tiến độ lấy hàng toàn diện.
                </p>
              </TabsTrigger>
              <TabsTrigger
                value="operation"
                className="group flex h-auto flex-col items-start gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-slate-600 shadow-none transition-all data-[state=active]:border-indigo-200 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:data-[state=active]:border-indigo-900/50 dark:data-[state=active]:bg-indigo-950/40 dark:data-[state=active]:text-indigo-200"
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  <ScanBarcode className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  Tác nghiệp (Mobile)
                </div>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 group-data-[state=active]:text-indigo-600/80 line-clamp-1">
                  Dành cho nhân viên kho thực hiện quét mã vạch và xác nhận.
                </p>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0 outline-none">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="operation" className="mt-0 outline-none">
            <OperationTab />
          </TabsContent>
        </Tabs>
      </div>
        </div>
    );
}
