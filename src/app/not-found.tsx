"use client";

import Link from "next/link";
import { MoveLeft, HelpCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COPYRIGHT_YEAR = 2026;

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-950">
      <div className="relative mb-8">
        <h1 className="text-9xl font-black text-indigo-600/10 dark:text-indigo-500/10">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <HelpCircle className="h-24 w-24 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
        Không tìm thấy trang
      </h2>
      <p className="mb-10 max-w-md text-slate-600 dark:text-slate-400">
        Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. 
        Vui lòng kiểm tra lại đường dẫn hoặc quay về bảng điều khiển.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link 
          href="/dashboard" 
          className={cn(buttonVariants({ variant: "default" }), "h-11 rounded-full px-8 bg-indigo-600 hover:bg-indigo-700")}
        >
          <MoveLeft className="mr-2 h-4 w-4" />
          Quay lại dashboard
        </Link>
        <Link 
          href="/support" 
          className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-full px-8")}
        >
          Trung tâm hỗ trợ
        </Link>
      </div>

      <div className="mt-16 text-sm text-slate-400">
        © {COPYRIGHT_YEAR} StockMaster. All rights reserved.
      </div>
    </div>
  );
}
