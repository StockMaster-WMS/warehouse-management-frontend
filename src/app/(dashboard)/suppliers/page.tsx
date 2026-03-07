"use client";

import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ChevronRight, 
  Phone, 
  Mail, 
  Globe,
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

const suppliers = [
  {
    id: "SUP-001",
    name: "Apple Asia Distribution",
    contactPerson: "Michael Chen",
    email: "m.chen@apple-asia.com",
    phone: "+65 6481 5566",
    address: "One North, Singapore",
    rating: 4.8,
    status: "active",
    category: "Thiết bị điện tử",
    balance: "1.2B ₫"
  },
  {
    id: "SUP-002",
    name: "Samsung Electronics VN",
    contactPerson: "Lê Văn Tùng",
    email: "tung.lv@samsung.com.vn",
    phone: "024 3514 9888",
    address: "KCN Yên Phong, Bắc Ninh",
    rating: 4.5,
    status: "active",
    category: "Linh kiện & Gia dụng",
    balance: "450M ₫"
  },
  {
    id: "SUP-003",
    name: "Logitech Global Logistics",
    contactPerson: "Sarah Johnson",
    email: "sarah.j@logitech.com",
    phone: "+1 510 795 8500",
    address: "Newark, California, USA",
    rating: 4.2,
    status: "warning",
    category: "Phụ kiện",
    balance: "85M ₫"
  }
];

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Nhà cung cấp
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Quản lý thông tin đối tác cung ứng và lịch sử giao dịch.
          </p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none">
          <Plus className="mr-2 h-4 w-4" />
          Thêm đối tác mới
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng đối tác", value: "48", icon: Building2, color: "text-indigo-500" },
          { label: "Đơn hàng tháng này", value: "156", icon: PackageCheck, color: "text-emerald-500" },
          { label: "Đánh giá trung bình", value: "4.5/5", icon: Star, color: "text-amber-500" },
          { label: "Dư nợ NCC", value: "2.4B ₫", icon: Globe, color: "text-blue-500" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search & List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Tìm kiếm nhà cung cấp..." 
              className="pl-10 border-slate-200 bg-slate-50/50 focus-visible:bg-white focus-visible:ring-indigo-500/30"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Nhà cung cấp</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Liên hệ</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Công nợ</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Đánh giá</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {suppliers.map((sup) => (
                <tr key={sup.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{sup.name}</span>
                      <span className="text-[10px] font-medium text-slate-500 mt-1">{sup.id} • {sup.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                       <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                         <Mail className="h-3 w-3 text-slate-400" />
                         {sup.email}
                       </div>
                       <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                         <Phone className="h-3 w-3 text-slate-400" />
                         {sup.phone}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{sup.balance}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                       <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                       <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{sup.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      sup.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}>
                      {sup.status === 'active' ? 'Đang hợp tác' : 'Cần lưu ý'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuGroup>
                           <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuItem className="rounded-lg">
                           <Edit2 className="mr-2 h-4 w-4" />
                           Sửa thông tin
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg">
                           <ExternalLink className="mr-2 h-4 w-4" />
                           Lịch sử nhập hàng
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg text-rose-600 focus:text-rose-600">
                           <Trash2 className="mr-2 h-4 w-4" />
                           Ngưng hợp tác
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
