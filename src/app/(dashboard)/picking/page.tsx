"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { OverviewTab } from "./overview-tab";
import { OperationTab } from "./operation-tab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone } from "lucide-react";

export default function PickingPage() {
    const [isMobileMode, setIsMobileMode] = useState(false);

    return (
        <div className="flex h-full flex-col">
            {/* ── Mobile overlay ──────────────────────────────────────────── */}
            {isMobileMode && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 animate-in fade-in duration-200">
                    {/* Mobile top bar */}
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                                <Smartphone className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500 leading-none">
                                    StockMaster
                                </div>
                                <div className="font-black text-sm uppercase tracking-wider text-slate-900 leading-tight">
                                    Chế độ lấy hàng
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsMobileMode(false)}
                            className="h-9 gap-2 rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                            <Monitor className="h-3.5 w-3.5" />
                            Về Desktop
                        </Button>
                    </div>

                    {/* Mobile content */}
                    <div className="flex-1 overflow-y-auto">
                        <OperationTab />
                    </div>
                </div>
            )}

            {/* ── Desktop layout ───────────────────────────────────────────── */}
            <PageHeader
                title="Quản lý lấy hàng"
                description="Theo dõi và điều phối lệnh lấy hàng xuất kho theo đơn bán"
                actions={
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="hidden sm:flex h-7 gap-1.5 border-slate-200 bg-white text-xs font-semibold text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đang vận hành
                        </Badge>
                        <Button
                            onClick={() => setIsMobileMode(true)}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 gap-2"
                        >
                            <Smartphone className="h-4 w-4" />
                            Chế độ Mobile
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 space-y-6 pt-6">
                <OverviewTab />
            </div>
        </div>
    );
}
