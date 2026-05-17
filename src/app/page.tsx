import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  PackageCheck,
  Route,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";

import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site";

const AUTH_SESSION_COOKIE_NAMES = ["refreshToken", "accessToken"] as const;

const coreFeatures = [
  {
    title: "Quản lý tồn kho đa điểm",
    description:
      "Theo dõi số lượng khả dụng, vị trí lưu trữ, lô hàng và biến động tồn kho theo từng kho.",
    icon: Warehouse,
  },
  {
    title: "Nhập hàng và putaway",
    description:
      "Kiểm soát phiếu nhập, nhận hàng, đề xuất vị trí cất hàng và trạng thái xử lý tại kho.",
    icon: Truck,
  },
  {
    title: "Xuất kho và picking",
    description:
      "Tổ chức đơn xuất, tác vụ lấy hàng, xác nhận quét mã và tiến độ hoàn tất đơn hàng.",
    icon: Route,
  },
  {
    title: "Kiểm kê và báo cáo",
    description:
      "Tạo kỳ kiểm kê, ghi nhận chênh lệch và xem báo cáo vận hành để ra quyết định nhanh hơn.",
    icon: BarChart3,
  },
] as const;

const workflowItems = [
  "Danh mục sản phẩm, nhà cung cấp, khách hàng và vị trí kho được quản lý tập trung.",
  "Luồng nhập - xuất - hoàn hàng bám theo chứng từ, trạng thái và người thao tác.",
  "Báo cáo tồn kho, lịch sử hoạt động và phân quyền giúp giảm sai lệch khi vận hành.",
] as const;

const assuranceItems = [
  {
    title: "Quy trình kho",
    description: "Nhập hàng, cất hàng, lấy hàng và xuất kho.",
    icon: PackageCheck,
  },
  {
    title: "Kiểm soát số liệu",
    description: "Tồn kho, lô hàng, vị trí và lịch sử thao tác.",
    icon: ClipboardCheck,
  },
  {
    title: "Phân quyền",
    description: "Vai trò quản trị, quản lý kho, nhân viên và báo cáo.",
    icon: ShieldCheck,
  },
] as const;

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const cookieStore = await cookies();
  const hasSession = AUTH_SESSION_COOKIE_NAMES.some((name) =>
    cookieStore.has(name),
  );

  if (hasSession) {
    redirect("/dashboard");
  }

  return (
    <main id="main-content" className="min-h-svh bg-white text-zinc-950">
      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-[0.36]"
          style={{ backgroundImage: "url('/opengraph-image')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-zinc-950/72" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Phần mềm quản lý kho cho doanh nghiệp
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              {SITE_NAME}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200">
              Hệ thống WMS hỗ trợ quản lý tồn kho, nhập xuất hàng, picking,
              putaway, kiểm kê và báo cáo vận hành trên một nền tảng web tập
              trung.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100"
              >
                Đăng nhập hệ thống
              </Link>
              <a
                href="#tinh-nang"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Xem tính năng
              </a>
            </div>
          </div>

          <div className="rounded-[8px] border border-white/15 bg-white/[0.94] p-5 text-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Tổng quan vận hành
                </p>
                <p className="mt-1 text-2xl font-bold">Kho đang kiểm soát tốt</p>
              </div>
              <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                98.4%
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["SKU hoạt động", "2,480"],
                ["Đơn xuất hôm nay", "186"],
                ["Dòng cần kiểm", "42"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[8px] border border-zinc-200 p-4">
                  <p className="text-xs font-semibold text-zinc-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Nhập hàng", "Đã nhận 24/32 dòng", "bg-blue-600"],
                ["Picking", "318 tác vụ đang chạy", "bg-violet-600"],
                ["Kiểm kê", "6 phiếu chờ hoàn tất", "bg-cyan-600"],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-[8px] border border-zinc-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-9 w-1.5 rounded-full ${color}`} />
                    <span className="font-semibold">{label}</span>
                  </div>
                  <span className="text-sm text-zinc-600">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="tinh-nang" className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Đủ nghiệp vụ cốt lõi cho hệ thống quản lý kho
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              StockMaster WMS tập trung vào các màn hình vận hành kho thường
              dùng: tồn kho, nhập hàng, xuất hàng, vị trí lưu trữ, kiểm kê,
              hoàn hàng, báo cáo và phân quyền người dùng.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {coreFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-[8px] border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-zinc-950">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Vận hành rõ ràng
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
              Từ dữ liệu kho đến quyết định quản lý
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Nội dung trên website dùng từ khóa tự nhiên cho thị trường Việt
              Nam: phần mềm quản lý kho, hệ thống WMS, quản lý tồn kho, nhập
              xuất kho, kiểm kê kho và báo cáo kho.
            </p>
          </div>

          <div className="space-y-4">
            {workflowItems.map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-[8px] border border-zinc-200 bg-zinc-50 p-4"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-zinc-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-3">
          {assuranceItems.map((item) => {
            const FeatureIcon = item.icon;

            return (
              <div key={item.title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-cyan-200">
                  <FeatureIcon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
