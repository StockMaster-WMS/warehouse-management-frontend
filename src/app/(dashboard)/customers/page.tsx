"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  Mail,
  MoreHorizontal,
  Edit2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { FilterGroup } from "@/components/features/FilterGroup";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả phân loại");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");

  const hasAnyFilter = query.trim().length > 0 || category !== "Tất cả phân loại";
  return (
    <div className="space-y-6">
      <PageHeader
        title="Khách hàng"
        description="Duy trì mối quan hệ và quản lý thông tin khách hàng/nhà cung cấp."
        actions={
          <Button
            render={<Link href="/customers/new" />}
            nativeButton={false} 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm mới
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng khách hàng", value: "1,248", change: "+12%" },
          { label: "Khách mới tháng này", value: "48", change: "+5%" },
          { label: "Khách hàng VIP", value: "85", change: "+2%" },
          { label: "Tỷ lệ quay lại", value: "42%", change: "+3%" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <span className="text-[10px] font-bold text-emerald-500">{stat.change}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm theo tên, email, số điện thoại..."
        value={query}
        onValueChange={setQuery}
        filters={
            <FilterGroup
              hasAnyFilter={hasAnyFilter}
              onClear={() => {
                setQuery("");
                setCategory("Tất cả phân loại");
              }}
              filters={[
                {
                  label: "phân loại",
                  placeholder: "Phân loại",
                  value: category,
                  onChange: setCategory,
                  options: ["Cá nhân", "Nhà buôn"],
                  width: "sm:w-[180px]"
                }
              ]}
            />
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {[
            { name: "Nguyen Van A", email: "a.nguyen@example.com", phone: "0901234567", category: "Nhà buôn" },
            { name: "Nguyen Van B", email: "b.nguyen@example.com", phone: "0907654321", category: "Cá nhân" },
            { name: "Nguyen Van C", email: "c.nguyen@example.com", phone: "0902223334", category: "Nhà buôn" },
          ].map((user, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <div className="flex flex-col items-start min-w-30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số điện thoại</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{user.phone}</span>
                </div>
                <div className="flex flex-col items-start min-w-30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phân loại</span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{user.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-700">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem 
                      className="rounded-lg"
                      render={<Link href={`/customers/${user.email}/edit`} />}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Sửa hồ sơ
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="rounded-lg text-rose-600 focus:text-rose-600"
                      onClick={() => {
                        setItemToDelete(user.name);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa khách hàng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <Button variant="link" className="text-xs text-indigo-600">Xem tất cả khách hàng</Button>
        </div>
      </div>
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          console.log("Deleted", itemToDelete);
        }}
        itemName={itemToDelete}
        title="Xóa hồ sơ khách hàng"
        description="Xóa khách hàng sẽ gỡ bỏ lịch sử giao dịch liên quan. Hãy cân nhắc kỹ."
      />
    </div>
  );
}
