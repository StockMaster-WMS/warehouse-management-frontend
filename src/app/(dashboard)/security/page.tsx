import Link from "next/link";
import { Key, Users, Eye, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảo mật & Phân quyền"
        description="Quản lý quyền truy cập và bảo vệ dữ liệu kho an toàn tuyệt đối."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-600/20 bg-indigo-600/5 text-indigo-600 hover:bg-indigo-600/10 dark:text-indigo-400"
          >
            Kiểm tra bảo mật định kỳ
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[
          {
            title: "Vai trò và Quyền hạn",
            desc: "Quản lý các nhóm quản trị, thủ kho và nhân viên đóng gói.",
            icon: Users,
            href: "/settings",
          },
          {
            title: "Khóa truy cập",
            desc: "Thiết lập đăng nhập 2 lớp (2FA) và quản lý mật khẩu phức tạp.",
            icon: Key,
            href: "/settings",
          },
          {
            title: "Nhật ký truy cập",
            desc: "Theo dõi địa chỉ IP và lịch sử đăng nhập vào hệ thống.",
            icon: Eye,
            href: "/history",
          },
          {
            title: "Cảnh báo bảo mật",
            desc: "Cấu hình thông báo khi có hoạt động đăng nhập bất thường.",
            icon: BellRing,
            href: "/settings",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="group flex items-start gap-4 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:shadow-md hover:border-indigo-500/20 dark:hover:border-indigo-900/40"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <item.icon className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {item.title}
              </h3>
              <p className="text-sm font-medium text-slate-500 leading-normal">
                {item.desc}
              </p>
              <Button
                render={<Link href={item.href} />}
                nativeButton={false}
                variant="link"
                size="sm"
                className="h-auto justify-start p-0 text-indigo-600"
              >
                Thiết lập ngay
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
