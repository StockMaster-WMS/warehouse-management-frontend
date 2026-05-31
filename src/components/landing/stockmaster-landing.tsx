"use client";

import Link from "next/link";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ArrowRightCircle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  History,
  Menu,
  Package,
  PackageCheck,
  Route,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { useState } from "react";

import { SITE_NAME } from "@/lib/site";

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4";

const navLinks = [
  { label: "Tồn kho", href: "#features" },
  { label: "Kho hàng", href: "#workflow" },
  { label: "Đơn hàng", href: "#operations" },
  { label: "Báo cáo", href: "#data" },
  { label: "Hỗ trợ", href: "#faq" },
] as const;

const coreFeatures = [
  {
    title: "Tồn kho theo thời gian thực",
    description:
      "Theo dõi tồn thực tế, tồn khả dụng, số lượng đã giữ, lô hàng, hạn dùng và vị trí lưu trữ theo từng kho.",
    icon: Warehouse,
  },
  {
    title: "Nhập kho và nhận hàng",
    description:
      "Quản lý đơn mua, kiểm nhận hàng, tác vụ xếp hàng lên kệ và hiệu suất nhà cung cấp trong cùng một luồng.",
    icon: Truck,
  },
  {
    title: "Xuất kho và hoàn tất đơn",
    description:
      "Điều phối đơn xuất, tiến độ lấy hàng, trạng thái sẵn sàng giao và các ngoại lệ phát sinh.",
    icon: Route,
  },
  {
    title: "Kiểm kê định kỳ",
    description:
      "Lập kế hoạch kiểm kê, ghi nhận chênh lệch, duyệt điều chỉnh và lưu lịch sử đối soát rõ ràng.",
    icon: ClipboardCheck,
  },
  {
    title: "Báo cáo vận hành",
    description:
      "Theo dõi doanh thu, biến động hàng hóa, sức khỏe tồn kho và hoạt động kho qua các báo cáo tập trung.",
    icon: BarChart3,
  },
  {
    title: "Phân quyền theo vai trò",
    description:
      "Tách quyền quản trị, quản lý kho, nhân viên kho và người xem báo cáo bằng quy tắc truy cập rõ ràng.",
    icon: ShieldCheck,
  },
] as const;

const benefits = [
  "Tập trung sản phẩm, vị trí, khách hàng, nhà cung cấp và chứng từ kho vào một hệ thống.",
  "Giảm thao tác thủ công khi nhận hàng, xếp hàng, lấy hàng, kiểm kê và lập báo cáo.",
  "Mỗi nghiệp vụ đều gắn với trạng thái, người thao tác, thời điểm và biến động tồn kho.",
  "Giúp quản lý đọc nhanh áp lực đơn hàng, rủi ro tồn kho và năng suất vận hành hằng ngày.",
] as const;

const workflowSteps = [
  {
    title: "Thiết lập mô hình kho",
    description:
      "Khai báo sản phẩm, danh mục, kho, vị trí lưu trữ, nhà cung cấp và khách hàng.",
  },
  {
    title: "Vận hành hằng ngày",
    description:
      "Xử lý nhập kho, xếp hàng lên kệ, xuất kho, lấy hàng, hoàn trả và điều chỉnh tồn.",
  },
  {
    title: "Kiểm soát và cải tiến",
    description:
      "Xem báo cáo, lịch sử thao tác, kiểm kê, độ chính xác tồn kho và hiệu suất đơn hàng.",
  },
] as const;

const audienceItems = [
  {
    title: "Đội kho",
    description: "Thao tác nhanh hơn khi nhận hàng, cất hàng, lấy hàng và kiểm kê.",
    icon: PackageCheck,
  },
  {
    title: "Quản lý kho",
    description: "Theo dõi điểm nghẽn, chênh lệch tồn, trạng thái đơn và hoạt động nhân sự.",
    icon: Users,
  },
  {
    title: "Ban vận hành",
    description: "Quản lý phân quyền, dữ liệu nền, báo cáo và lịch sử đối soát.",
    icon: FileText,
  },
] as const;

const faqItems = [
  {
    question: "StockMaster phù hợp với doanh nghiệp nào?",
    answer:
      "StockMaster phù hợp với doanh nghiệp cần quản lý tồn kho, nhập xuất hàng, nhiều vị trí lưu trữ, quy trình lấy hàng và kiểm kê trên nền tảng web.",
  },
  {
    question: "Hệ thống có hỗ trợ phân quyền không?",
    answer:
      "Có. StockMaster hỗ trợ các vai trò như quản trị viên, quản lý kho, nhân viên kho và người xem báo cáo.",
  },
  {
    question: "StockMaster có thay thế file Excel quản lý kho không?",
    answer:
      "Có thể thay thế phần lớn quy trình theo dõi thủ công bằng các màn hình sản phẩm, tồn kho, nhập hàng, xuất hàng, kiểm kê và báo cáo.",
  },
] as const;

const floatingStats = [
  {
    label: "12 kho đang hoạt động",
    value: "Kiểm soát nhiều điểm kho",
    icon: Warehouse,
    className: "left-[5%] top-[17%]",
    duration: 3.2,
  },
  {
    label: "98,2% độ chính xác tồn kho",
    value: "Dữ liệu tồn kho đáng tin cậy",
    icon: BarChart3,
    className: "right-[6%] top-[23%]",
    duration: 3.8,
  },
  {
    label: "2,4 triệu sản phẩm được theo dõi",
    value: "Nhìn rõ biến động từng SKU",
    icon: Package,
    className: "left-[31%] bottom-[8%]",
    duration: 4,
  },
  {
    label: "Tối ưu lộ trình lấy hàng",
    value: "Rút ngắn đường đi trong kho",
    icon: Truck,
    className: "right-[8%] bottom-[17%]",
    duration: 3.5,
  },
] as const;

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: easeOutExpo,
    },
  }),
};

function StockMasterLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 32 32"
        className="size-8"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 10.5 16 4l12 6.5v12.8L16 30 4 23.3V10.5Z"
          className={dark ? "fill-slate-950" : "fill-white"}
        />
        <path d="m16 4 12 6.5-12 6.4L4 10.5 16 4Z" fill="#2563EB" />
        <path
          d="M16 16.9V30M9.5 13.4v7.2l6.5 3.6 6.5-3.6v-7.2"
          stroke={dark ? "#F8FAFC" : "#0F172A"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`text-base font-black tracking-tight ${
          dark ? "text-slate-950" : "text-white"
        }`}
      >
        StockMaster
      </span>
    </div>
  );
}

export function StockMasterLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const entranceInitial = prefersReducedMotion ? false : "hidden";
  const menuPanelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.45, ease: easeOutExpo };

  return (
    <LazyMotion features={domAnimation}>
      <main
        id="main-content"
        className="min-h-svh overflow-hidden bg-slate-50 font-sans text-slate-950"
      >
      <section className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-[rgba(10,15,25,0.48)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,15,25,0.88)_0%,rgba(10,15,25,0.62)_42%,rgba(10,15,25,0.24)_100%)]" />

        <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
          <Link href="/" aria-label={`Trang chủ ${SITE_NAME}`}>
            <StockMasterLogo />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/80 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/12 px-5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/18"
            >
              Đăng nhập
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(37,99,235,0.32)] transition hover:brightness-110"
            >
              Bắt đầu ngay
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur md:hidden"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Mở menu"
          >
            <Menu className="size-5" />
          </button>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-5 pb-16 pt-[clamp(40px,8vw,72px)] sm:px-8">
          <div className="max-w-[620px]">
            <m.h1
              variants={fadeUp}
              initial={entranceInitial}
              animate="visible"
              custom={0}
              aria-label="Kiểm soát tồn kho thông minh cho kho hàng hiện đại"
              className="text-[clamp(1.8rem,5vw,3.4rem)] font-black leading-[1.02] tracking-[-0.03em] text-white"
            >
              <Package className="mr-2 inline size-6 align-middle text-white" />
              Kiểm soát tồn kho{" "}
              <Boxes className="mx-2 inline size-6 align-middle text-white" />
              thông minh cho kho hàng hiện đại
              <Truck className="ml-2 inline size-6 align-middle text-white" />
            </m.h1>

            <m.p
              variants={fadeUp}
              initial={entranceInitial}
              animate="visible"
              custom={1}
              className="mt-6 max-w-[580px] text-[clamp(0.95rem,2.3vw,1.08rem)] leading-7 text-white/82"
            >
              Theo dõi tồn kho theo thời gian thực, tự động hóa nghiệp vụ kho,
              quản lý đơn nhập - xuất và nhìn rõ toàn bộ hoạt động logistics
              trong một nền tảng tập trung.
            </m.p>

            <m.div
              variants={fadeUp}
              initial={entranceInitial}
              animate="visible"
              custom={2}
              className="mt-8 flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/login"
                className="inline-flex min-h-14 min-w-[220px] items-center justify-center gap-2 rounded-full bg-[#2563EB] px-6 py-[17px] text-sm font-semibold text-white shadow-[0_4px_24px_rgba(37,99,235,0.35)] transition hover:scale-[1.04] hover:brightness-110 active:scale-[0.96]"
              >
                Vào hệ thống kho
                <ArrowRightCircle className="size-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-[17px] text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16"
              >
                Xem dashboard
              </Link>
            </m.div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
          {floatingStats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <m.div
                key={stat.label}
                variants={fadeUp}
                initial={entranceInitial}
                animate="visible"
                custom={3 + index * 0.4}
                className={`absolute ${stat.className}`}
              >
                <m.div
                  animate={prefersReducedMotion ? undefined : { y: [0, -12] }}
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : {
                          duration: stat.duration,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                        }
                  }
                  className="min-w-[230px] rounded-2xl border border-white/20 bg-white/12 px-5 py-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-[14px]"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/12">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">{stat.label}</p>
                      <p className="mt-1 text-xs text-white/68">{stat.value}</p>
                    </div>
                  </div>
                </m.div>
              </m.div>
            );
          })}
        </div>

        <AnimatePresence>
          {isMenuOpen ? (
            <>
              <m.button
                type="button"
                className="fixed inset-0 z-40 bg-[rgba(10,15,25,0.5)] backdrop-blur"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : undefined}
                onClick={() => setIsMenuOpen(false)}
                aria-label="Đóng lớp nền menu"
              />
              <m.aside
                className="fixed right-0 top-0 z-50 flex h-[100dvh] w-[min(88vw,360px)] flex-col bg-[#F3F6FA] text-slate-950 shadow-[-12px_0_48px_rgba(0,0,0,0.25)]"
                initial={prefersReducedMotion ? false : { x: "100%" }}
                animate={{ x: 0 }}
                exit={prefersReducedMotion ? undefined : { x: "100%" }}
                transition={menuPanelTransition}
              >
                <div className="flex items-center justify-between px-5 py-5">
                  <StockMasterLogo dark />
                  <button
                    type="button"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Đóng menu"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex flex-1 flex-col px-5 py-6">
                  <div className="space-y-2">
                    {navLinks.map((link, index) => (
                      <m.a
                        key={link.href}
                        href={link.href}
                        className="block rounded-xl px-3 py-3 text-base font-semibold text-slate-800 transition hover:bg-white"
                        initial={prefersReducedMotion ? false : { opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : { delay: 0.08 + index * 0.05 }
                        }
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </m.a>
                    ))}
                  </div>
                  <div className="mt-auto grid gap-3">
                    <Link
                      href="/login"
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#2563EB] px-5 text-sm font-semibold text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Bắt đầu ngay
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-950"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Đăng nhập
                    </Link>
                  </div>
                </div>
              </m.aside>
            </>
          ) : null}
        </AnimatePresence>
      </section>

      <section id="features" className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Phân hệ chính
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Đủ nghiệp vụ cốt lõi cho vận hành kho hằng ngày
              </h2>
            </div>
            <p className="text-base leading-7 text-slate-600">
              StockMaster gom các nghiệp vụ quan trọng vào một luồng rõ ràng:
              tồn kho, nhập kho, xuất kho, kiểm kê, báo cáo và phân quyền đều
              được thiết kế để đội kho thao tác nhanh hơn.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {coreFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="operations" className="border-y border-slate-200 bg-[#EFF3F7]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Lợi ích vận hành
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Ít phụ thuộc Excel hơn, kiểm soát luồng hàng tốt hơn
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Một hệ thống quản lý kho tốt phải giúp các thao tác lặp lại dễ
              quét, dễ so sánh và dễ ra quyết định. StockMaster tập trung vào
              dữ liệu rõ ràng, trạng thái minh bạch và quy trình ít sai lệch.
            </p>
          </div>

          <div className="grid gap-3">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex gap-3 rounded-2xl border border-white bg-white/80 p-4 shadow-sm"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-blue-600" />
                <p className="text-sm leading-6 text-slate-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:grid-cols-3 sm:px-8">
          {audienceItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-white/68">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Quy trình
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Từ thiết lập dữ liệu đến kiểm soát vận hành
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="data" className="border-y border-slate-200 bg-[#EFF3F7]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Nền tảng dữ liệu
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Mọi biến động kho đều có ngữ cảnh
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              StockMaster liên kết thay đổi số lượng với chứng từ, người thao
              tác, trạng thái và lịch sử xử lý để đội vận hành đối soát nhanh
              khi có sai lệch.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Dữ liệu tập trung", "Sản phẩm, kho, vị trí, khách hàng và nhà cung cấp.", Database],
              ["Lịch sử thao tác", "Các thay đổi quan trọng trong kho luôn có dấu vết.", History],
              ["Báo cáo quản trị", "Chỉ số rõ ràng giúp ra quyết định nhanh hơn.", BarChart3],
            ].map(([title, description, Icon]) => (
              <article
                key={title as string}
                className="rounded-2xl border border-white bg-white/85 p-6 shadow-sm"
              >
                <Icon className="size-6 text-blue-600" />
                <h3 className="mt-4 font-bold text-slate-950">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description as string}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Câu hỏi thường gặp
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Tìm hiểu nhanh về StockMaster WMS
            </h2>
          </div>

          <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {faqItems.map((item) => (
              <article key={item.question} className="p-6">
                <h3 className="text-base font-bold text-slate-950">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              Bắt đầu quản lý kho với {SITE_NAME}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">
              Đăng nhập để sử dụng dashboard, quản lý tồn kho, nhập xuất hàng,
              kiểm kê và báo cáo vận hành.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] px-6 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
          >
            Vào hệ thống kho
            <ArrowRightCircle className="size-5" />
          </Link>
        </div>
      </section>
      </main>
    </LazyMotion>
  );
}
