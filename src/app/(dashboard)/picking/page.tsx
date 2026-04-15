"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { OverviewTab } from "./overview-tab";
import { OperationTab } from "./operation-tab";
import { Button } from "@/components/ui/button";
import { ScanBarcode, X } from "lucide-react";

export default function PickingPage() {
    const [isMobileMode, setIsMobileMode] = useState(false);

    return (
        <div className="flex h-full flex-col">
            {isMobileMode && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in fade-in zoom-in-95 duration-200">
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
                        <div className="flex items-center gap-2">
                           <ScanBarcode className="h-5 w-5 text-primary" />
                           <span className="font-black text-sm uppercase tracking-wider">Picking Task</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsMobileMode(false)}
                            className="rounded-lg"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-10">
                        <OperationTab />
                    </div>
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
