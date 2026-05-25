"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { OverviewTab } from "./overview-tab";
import { OperationTab } from "./operation-tab";
import { Badge } from "@/components/ui/badge";
import { useHasPermissions } from "@/components/permission-control";
import { PICKING_ASSIGN_ROLES } from "@/lib/access-control";

function PickingPageContent() {
    const searchParams = useSearchParams();
    const itemId = searchParams.get("itemId");
    const canCoordinatePicking = useHasPermissions(PICKING_ASSIGN_ROLES);

    if (!canCoordinatePicking) {
        return (
            <div className="flex h-full flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
                <div className="flex-1">
                    <OperationTab />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
            <PageHeader
                title="Quản lý lấy hàng"
                description="Theo dõi và điều phối lệnh lấy hàng xuất kho theo đơn bán"
                actions={
                    <Badge variant="outline" className="hidden h-7 gap-1.5 border-slate-200 bg-white text-xs font-semibold text-slate-600 sm:flex">
                        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                        Đang vận hành
                    </Badge>
                }
            />

            <div className="flex-1 space-y-6 pt-6">
                <OverviewTab initialSelectedId={itemId} />
            </div>
        </div>
    );
}

export default function PickingPage() {
    return (
        <Suspense>
            <PickingPageContent />
        </Suspense>
    );
}
