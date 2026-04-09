"use client";

import { useState } from "react";
import { Search, Filter, History, Download, Calendar as CalendarIcon, ArrowRight, Activity, LogIn, FileEdit, Trash2, PackagePlus } from "lucide-react";
import { format } from "date-fns";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Mock Data
type LogType = "LOGIN" | "CREATE" | "UPDATE" | "DELETE" | "SYSTEM";
interface AuditLog {
  id: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  action: string;
  type: LogType;
  entityName: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: "LOG-0842-10",
    user: { name: "An Nguyen", email: "admin@stockmaster.vn", avatar: "AN" },
    action: "Tạo phiếu nhập kho",
    type: "CREATE",
    entityName: "Inbound Receipt",
    details: "Tạo thành công phiếu GRN-2026041001 từ PO-260410002659353-6ED6",
    timestamp: "2026-04-10 10:24:12",
    ipAddress: "192.168.1.42",
  },
  {
    id: "LOG-0842-09",
    user: { name: "Bảo Trần", email: "bao.tran@stockmaster.vn", avatar: "BT" },
    action: "Cập nhật tồn kho",
    type: "UPDATE",
    entityName: "Inventory",
    details: "Điều chỉnh giảm 50 đơn vị SKU SP-002 (Lý do: Hàng hỏng)",
    timestamp: "2026-04-10 09:15:00",
    ipAddress: "192.168.1.15",
  },
  {
    id: "LOG-0842-08",
    user: { name: "Hải Phạm", email: "hai.pham@stockmaster.vn", avatar: "HP" },
    action: "Xoá sản phẩm",
    type: "DELETE",
    entityName: "Product",
    details: "Đã xoá phiên bản SP-004 không còn kinh doanh",
    timestamp: "2026-04-09 16:45:22",
    ipAddress: "192.168.1.88",
  },
  {
    id: "LOG-0842-07",
    user: { name: "Hệ thống", email: "system@stockmaster.vn", avatar: "SYS" },
    action: "Sao lưu tự động",
    type: "SYSTEM",
    entityName: "Database",
    details: "Hoàn tất sao lưu CSDL hàng ngày lúc 02:00 AM",
    timestamp: "2026-04-09 02:00:00",
    ipAddress: "127.0.0.1",
  },
  {
    id: "LOG-0842-06",
    user: { name: "An Nguyen", email: "admin@stockmaster.vn", avatar: "AN" },
    action: "Đăng nhập",
    type: "LOGIN",
    entityName: "Auth",
    details: "Đăng nhập thành công từ Chrome (Windows 11)",
    timestamp: "2026-04-08 08:30:15",
    ipAddress: "192.168.1.42",
  },
];

const TYPE_ICONS: Record<LogType, React.ReactNode> = {
  LOGIN: <LogIn className="h-4 w-4 text-emerald-600" />,
  CREATE: <PackagePlus className="h-4 w-4 text-indigo-600" />,
  UPDATE: <FileEdit className="h-4 w-4 text-amber-600" />,
  DELETE: <Trash2 className="h-4 w-4 text-rose-600" />,
  SYSTEM: <Activity className="h-4 w-4 text-slate-600" />,
};

const TYPE_STYLES: Record<LogType, string> = {
  LOGIN: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
  CREATE: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400",
  UPDATE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  DELETE: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
  SYSTEM: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
};

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Nhật ký hoạt động"
        description="Theo dõi toàn bộ thao tác của người dùng và các sự kiện hệ thống."
        actions={
          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 gap-2">
            <Download className="h-4 w-4" />
            Xuất dữ liệu
          </Button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo người dùng, nội dung thao tác..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "ALL")}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl border-slate-200 shrink-0 dark:border-slate-800">
              <Filter className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="LOGIN">Đăng nhập</SelectItem>
              <SelectItem value="CREATE">Tạo mới (Create)</SelectItem>
              <SelectItem value="UPDATE">Cập nhật (Update)</SelectItem>
              <SelectItem value="DELETE">Xoá (Delete)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-transparent">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 pl-6 font-bold uppercase text-[11px] text-slate-400 w-[240px]">Người dùng</TableHead>
              <TableHead className="py-4 font-bold uppercase text-[11px] text-slate-400">Thao tác</TableHead>
              <TableHead className="py-4 font-bold uppercase text-[11px] text-slate-400 hidden lg:table-cell">Đối tượng</TableHead>
              <TableHead className="py-4 font-bold uppercase text-[11px] text-slate-400 hidden xl:table-cell">IP</TableHead>
              <TableHead className="py-4 pr-6 text-right font-bold uppercase text-[11px] text-slate-400">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_LOGS.map((log) => (
              <TableRow key={log.id} className="group border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-slate-200 bg-white">
                      <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-semibold dark:bg-indigo-950/50 dark:text-indigo-400">
                        {log.user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{log.user.name}</span>
                      <span className="text-[11px] text-slate-500">{log.user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center justify-center p-1 rounded-md border",
                        TYPE_STYLES[log.type]
                      )}>
                        {TYPE_ICONS[log.type]}
                      </span>
                      <span className="font-semibold text-slate-800 text-sm dark:text-slate-200">
                        {log.action}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400" title={log.details}>
                      {log.details}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 hidden lg:table-cell">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {log.entityName}
                  </span>
                </TableCell>
                <TableCell className="py-4 hidden xl:table-cell text-sm text-slate-500 font-mono text-[12px]">
                  {log.ipAddress}
                </TableCell>
                <TableCell className="py-4 pr-6 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-slate-700 text-sm dark:text-slate-300">
                      {log.timestamp.split(" ")[1]}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {log.timestamp.split(" ")[0]}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
