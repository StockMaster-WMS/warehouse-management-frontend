"use client";

import { useState } from "react";

import { 
  Plus, 
  MoreHorizontal, 
  ChevronRight, 
  Package, 
  Tag, 
  FolderTree,
  Edit2,
  Trash2,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

const categories = [
  {
    id: "CAT-001",
    name: "Điện thoại & Máy tính bảng",
    slug: "dien-thoai-may-tinh-bang",
    productCount: 124,
    status: "active",
    description: "Các thiết bị di động, smartphone và tablet."
  },
  {
    id: "CAT-002",
    name: "Laptop & PC",
    slug: "laptop-pc",
    productCount: 86,
    status: "active",
    description: "Máy tính xách tay, máy tính để bàn và linh kiện."
  },
  {
    id: "CAT-003",
    name: "Linh kiện & Phụ kiện",
    slug: "linh-kien-phu-kien",
    productCount: 342,
    status: "active",
    description: "Sạc, cáp, tai nghe, chuột, bàn phím..."
  },
  {
    id: "CAT-004",
    name: "Thiết bị mạng",
    slug: "thiet-bi-mang",
    productCount: 45,
    status: "inactive",
    description: "Router, Switch, Wi-Fi và các thiết bị viễn thông."
  }
];

export default function CategoriesPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhóm / loại hàng"
        description="Quản lý cây danh mục và nhóm sản phẩm trong hệ thống."
        actions={
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none">
            <Plus className="mr-2 h-4 w-4" />
            Thêm phân loại mới
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng nhóm hàng", value: "24", icon: FolderTree, color: "text-indigo-500" },
          { label: "Nhóm đang hoạt động", value: "21", icon: Tag, color: "text-emerald-500" },
          { label: "Nhóm không HĐ", value: "3", icon: Tag, color: "text-slate-400" },
          { label: "SP đã phân loại", value: "597", icon: Package, color: "text-blue-500" },
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

      <SearchToolbar 
        placeholder="Tìm kiếm nhóm hàng..." 
        value={query}
        onValueChange={setQuery}
      />
        
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Tên nhóm & Mô tả</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Số lượng SP</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((cat) => (
                <tr key={cat.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                          <LayoutGrid className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{cat.name}</span>
                          <span className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-1">{cat.description}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                       <Package className="h-3.5 w-3.5" />
                       {cat.productCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      cat.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {cat.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
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
                           <DropdownMenuLabel>Quản lý nhóm</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuItem className="rounded-lg">
                           <Edit2 className="mr-2 h-4 w-4" />
                           Sửa thông tin
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg">
                           <ChevronRight className="mr-2 h-4 w-4" />
                           Xem sản phẩm
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg text-rose-600 focus:text-rose-600">
                           <Trash2 className="mr-2 h-4 w-4" />
                           Xóa nhóm hàng
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
