"use client";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { OperationTab } from "./operation-tab";

export default function PickingPage() {
    return (
        <div className="flex h-full flex-col bg-slate-50/50">
            <PageHeader
                title="Quản lý lấy hàng (Picking)"
                description="Theo dõi và thao tác lấy hàng theo đơn xuất"
            />

            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <Tabs defaultValue="overview" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 md:w-100">
                        <TabsTrigger value="overview">Tổng quan (Kho)</TabsTrigger>
                        <TabsTrigger value="operation">Tác nghiệp (Mobile Picker)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 flex-1">
                        <OverviewTab />
                    </TabsContent>
                    <TabsContent value="operation" className="mt-4 flex-1">
                        <OperationTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
