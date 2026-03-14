import {
  Users2,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý khách hàng"
        description="Duy trì mối quan hệ và quản lý thông tin khách hàng/nhà cung cấp."
        actions={
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
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
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <span className="text-[10px] font-bold text-emerald-500">{stat.change}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm khách hàng theo tên, email, sđt..."
                className="pl-10 focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </Button>
            </div>
          </div>
        </div>

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
                <Button variant="ghost" size="icon-sm">
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <Button variant="link" className="text-xs text-indigo-600">Xem tất cả khách hàng</Button>
        </div>
      </div>
    </div>
  );
}
