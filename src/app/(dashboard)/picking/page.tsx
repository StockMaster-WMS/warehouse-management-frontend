"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { OverviewTab } from "./overview-tab";
import { OperationTab } from "./operation-tab";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";

export default function PickingPage() {
    const [isMobileMode, setIsMobileMode] = useState(false);

    return (
        <div className="flex h-full flex-col">
            {isMobileMode && (
                <div className="fixed inset-0 z-[100] bg-background animate-in fade-in zoom-in-95 duration-200">
                    <OperationTab onClose={() => setIsMobileMode(false)} />
                </div>
            )}

            <PageHeader
                title="Quản lý lấy hàng"
                description="Theo dõi và điều phối lệnh lấy hàng xuất kho"
                actions={
                    <Button 
                        onClick={() => setIsMobileMode(true)}
                        size="sm"
                    >
                        <ScanBarcode className="mr-2 h-4 w-4" />
                        Chế độ Mobile
                    </Button>
                }
            />

            <div className="flex-1 space-y-6 pt-6">
                <OverviewTab />
            </div>
        </div>
    );
}
