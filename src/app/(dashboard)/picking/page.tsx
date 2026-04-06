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
        <div className="flex h-full flex-col bg-slate-50/50">
            {/* Mobile View Layer */}
            {isMobileMode && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b px-4 py-3 bg-white dark:bg-slate-950 sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                           <ScanBarcode className="h-5 w-5 text-indigo-600" />
                           <span className="font-black text-sm uppercase tracking-wider">Picking Task</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsMobileMode(false)}
                            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
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
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none"
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
