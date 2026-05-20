import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  History,
  Layers3,
  PackageCheck,
  Route,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

import { SITE_NAME } from "@/lib/site";

const seoTitle =
  "StockMaster WMS - Phần mềm quản lý kho, tồn kho và nhập xuất hàng";
const seoDescription =
  "StockMaster WMS là hệ thống quản lý kho trên nền tảng web, hỗ trợ quản lý tồn kho, nhập xuất kho, lấy hàng, xếp hàng lên kệ, kiểm kê, báo cáo và phân quyền người dùng.";

const coreFeatures = [
  {
    title: "Quản lý tồn kho theo thời gian thực",
    description:
      "Theo dõi số lượng tồn, số lượng khả dụng, lô hàng, hạn dùng và vị trí lưu trữ theo từng kho.",
    icon: Warehouse,
  },
  {
    title: "Nhập kho và xếp hàng lên kệ",
    description:
      "Quản lý đơn nhập, phiếu nhận hàng, kiểm tra số lượng và phân công đưa hàng vào vị trí phù hợp.",
    icon: Truck,
  },
  {
    title: "Xuất kho và lấy hàng",
    description:
      "Tổ chức đơn xuất, tạo tác vụ lấy hàng, kiểm soát tiến độ xử lý và giảm sai lệch khi giao hàng.",
    icon: Route,
  },
  {
    title: "Kiểm kê và điều chỉnh kho",
    description:
      "Tạo kỳ kiểm kê, ghi nhận chênh lệch và lưu lịch sử thay đổi để đối soát dữ liệu kho.",
    icon: ClipboardCheck,
  },
  {
    title: "Báo cáo vận hành",
    description:
      "Xem tổng quan, báo cáo tồn kho, doanh thu, mã hàng nổi bật và các chỉ số hỗ trợ quyết định.",
    icon: BarChart3,
  },
  {
    title: "Phân quyền người dùng",
    description:
      "Phân tách vai trò quản trị, quản lý kho, nhân viên kho và người xem báo cáo trong cùng hệ thống.",
    icon: ShieldCheck,
  },
] as const;

const businessBenefits = [
  "Tập trung dữ liệu sản phẩm, kho, vị trí, khách hàng và nhà cung cấp vào một nền tảng.",
  "Giảm thao tác thủ công khi xử lý nhập kho, xuất kho, lấy hàng, xếp hàng lên kệ và kiểm kê.",
  "Theo dõi được người thao tác, thời điểm thay đổi và trạng thái xử lý của từng nghiệp vụ.",
  "Hỗ trợ đội quản lý nhìn nhanh tình hình tồn kho, đơn hàng và hiệu suất vận hành.",
] as const;

const workflowSteps = [
  {
    title: "Thiết lập dữ liệu nền",
    description:
      "Khai báo sản phẩm, danh mục, nhà cung cấp, khách hàng, kho và vị trí lưu trữ.",
  },
  {
    title: "Vận hành nhập - xuất",
    description:
      "Xử lý đơn nhập, phiếu nhận hàng, đơn xuất, lấy hàng và các tác vụ liên quan đến hàng hóa.",
  },
  {
    title: "Kiểm soát và báo cáo",
    description:
      "Theo dõi tồn kho, kiểm kê, lịch sử thao tác, tổng quan và báo cáo quản trị.",
  },
] as const;

const audienceItems = [
  {
    title: "Đội kho",
    description: "Thao tác nhanh với nhập hàng, cất hàng, lấy hàng và kiểm kê.",
    icon: PackageCheck,
  },
  {
    title: "Quản lý kho",
    description: "Theo dõi tiến độ xử lý, sai lệch tồn kho và tình trạng đơn hàng.",
    icon: Users,
  },
  {
    title: "Ban quản trị",
    description: "Quản lý phân quyền, dữ liệu nền, nhật ký và báo cáo tổng hợp.",
    icon: FileText,
  },
] as const;

const faqItems = [
  {
    question: "StockMaster WMS phù hợp với doanh nghiệp nào?",
    answer:
      "Hệ thống phù hợp với doanh nghiệp cần quản lý tồn kho, nhập xuất hàng, nhiều vị trí lưu trữ, quy trình lấy hàng và kiểm kê trên một nền tảng web.",
  },
  {
    question: "Hệ thống có hỗ trợ phân quyền không?",
    answer:
      "Có. StockMaster WMS hỗ trợ các vai trò như quản trị viên, quản lý kho, nhân viên kho và người xem báo cáo.",
  },
  {
    question: "StockMaster WMS có thay thế file Excel quản lý kho không?",
    answer:
      "Có thể thay thế phần lớn quy trình theo dõi thủ công bằng các màn hình quản lý sản phẩm, tồn kho, nhập hàng, xuất hàng, kiểm kê và báo cáo.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: seoDescription,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "VND",
  },
  featureList: coreFeatures.map((feature) => feature.title),
};

export const metadata: Metadata = {
  title: seoTitle,
  description: seoDescription,
  keywords: [
    "phần mềm quản lý kho",
    "hệ thống quản lý kho",
    "quản lý tồn kho",
    "quản lý nhập xuất kho",
    "WMS",
    "warehouse management system",
    "lấy hàng xếp hàng lên kệ",
    "kiểm kê kho",
    "StockMaster WMS",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: seoTitle,
    description: seoDescription,
    url: "/",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "StockMaster WMS - phần mềm quản lý kho",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
    images: ["/opengraph-image"],
  },
};

export default function Home() {
  return (
    <main id="main-content" className="min-h-svh bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-screen"
          style={{ backgroundImage: "url('/opengraph-image')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-primary/92" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-7 px-4 py-9 sm:px-6 sm:py-16 lg:min-h-[680px] lg:grid-cols-[0.98fr_1.02fr] lg:items-center lg:gap-10 lg:px-8 lg:py-20">
          <div className="min-w-0 max-w-3xl">
            <p className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
              <Layers3 className="size-4" aria-hidden="true" />
              Phần mềm quản lý kho trên nền tảng web
            </p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight text-primary-foreground sm:mt-6 sm:text-5xl lg:text-6xl">
              {SITE_NAME}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-primary-foreground/88 sm:mt-6 sm:text-lg sm:leading-8">
              Hệ thống WMS giúp doanh nghiệp quản lý tồn kho, nhập xuất hàng,
              lấy hàng, xếp hàng lên kệ, kiểm kê và báo cáo vận hành trong một không
              gian làm việc tập trung.
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/78 sm:mt-4 sm:text-base sm:leading-7">
              StockMaster WMS được thiết kế cho đội kho cần dữ liệu rõ ràng,
              thao tác nhanh và quy trình đủ chặt để giảm sai lệch khi vận hành
              hằng ngày.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background/90 sm:min-h-11 sm:w-auto sm:px-5 sm:py-2.5"
              >
                Đăng nhập hệ thống
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="#phan-he"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-primary-foreground/30 px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 sm:min-h-11 sm:w-auto sm:px-5 sm:py-2.5"
              >
                Xem các phân hệ
              </a>
            </div>

            <div className="mt-5 grid gap-2 text-xs text-primary-foreground/86 sm:mt-8 sm:grid-cols-3 sm:gap-3 sm:text-sm">
              {["Tồn kho chính xác hơn", "Quy trình dễ kiểm soát", "Báo cáo tập trung"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-primary-foreground sm:size-4" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="w-full min-w-0 max-w-xl justify-self-center rounded-[8px] border border-border bg-card text-card-foreground shadow-2xl lg:max-w-none lg:justify-self-auto">
            <div className="border-b border-border px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Dashboard vận hành
                  </p>
                  <p className="mt-1 text-xl font-bold sm:text-2xl">
                    Tổng quan kho trong ngày
                  </p>
                </div>
                <span className="w-fit rounded-md bg-success-soft px-3 py-1 text-sm font-semibold text-success-foreground">
                  Online
                </span>
              </div>
            </div>

            <div className="grid border-b border-border sm:grid-cols-3">
              {[
                ["Mã hàng đang quản lý", "2,480"],
                ["Đơn cần xử lý", "186"],
                ["Dòng cần kiểm", "42"],
              ].map(([label, value]) => (
                <div key={label} className="border-border p-5 sm:border-r last:sm:border-r-0">
                  <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-0">
              {[
                ["Nhập kho", "Đơn nhập, nhận hàng và xếp hàng lên kệ", "bg-info", "84%"],
                ["Xuất kho", "Đơn xuất, lấy hàng và giao hàng", "bg-primary", "71%"],
                ["Kiểm kê", "Đối soát tồn kho và chênh lệch", "bg-warning", "56%"],
              ].map(([label, value, color, percent]) => (
                <div
                  key={label}
                  className="grid min-w-0 gap-2 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[128px_minmax(0,1fr)_44px] sm:items-center md:grid-cols-[160px_minmax(0,1fr)_52px]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-8 w-1.5 rounded-full ${color}`} />
                    <span className="font-semibold">{label}</span>
                  </div>
                  <span className="min-w-0 text-sm text-muted-foreground">{value}</span>
                  <span className="text-sm font-bold text-foreground sm:text-right">{percent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="phan-he" className="border-b border-border bg-muted/45">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
                Phân hệ chính
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Đủ nghiệp vụ cốt lõi cho hệ thống quản lý kho
              </h2>
            </div>
            <p className="text-base leading-7 text-muted-foreground">
              StockMaster WMS gom các nghiệp vụ kho thường dùng vào cùng một
              hệ thống: quản lý tồn kho, nhập xuất kho, vị trí lưu trữ, kiểm
              kê, báo cáo và phân quyền. Nội dung này giúp người dùng hiểu rõ
              hệ thống trước khi bắt đầu sử dụng.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 xl:grid-cols-3">
            {coreFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-[8px] border border-border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-10 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
              Lợi ích vận hành
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Vì sao doanh nghiệp nên dùng phần mềm quản lý kho?
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Khi dữ liệu kho nằm rải rác ở nhiều file và nhiều người cùng cập
              nhật thủ công, sai lệch tồn kho rất dễ xảy ra. StockMaster WMS
              tạo một luồng làm việc thống nhất để đội kho và quản lý cùng nhìn
              vào một nguồn dữ liệu.
            </p>
          </div>

          <div className="grid gap-3">
            {businessBenefits.map((benefit) => (
              <div
                key={benefit}
                className="flex gap-3 rounded-[8px] border border-border bg-muted/45 p-4"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                <p className="text-sm leading-6 text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {audienceItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-foreground/10 text-primary-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-primary-foreground/78">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
              Quy trình sử dụng
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Từ dữ liệu nền đến kiểm soát vận hành
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[8px] border border-border bg-card p-5 shadow-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/45">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
              Nền tảng dữ liệu
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Mọi thay đổi đều có ngữ cảnh
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Hệ thống không chỉ lưu số lượng tồn kho. Mỗi nghiệp vụ còn gắn
              với chứng từ, trạng thái, người thao tác và lịch sử xử lý để phục
              vụ đối soát sau này.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Dữ liệu tập trung", "Sản phẩm, kho, vị trí, khách hàng và nhà cung cấp.", Database],
              ["Lịch sử thao tác", "Theo dõi thay đổi quan trọng trong quá trình vận hành.", History],
              ["Báo cáo quản trị", "Tổng quan và chỉ số giúp ra quyết định nhanh hơn.", BarChart3],
            ].map(([title, description, Icon]) => (
              <article
                key={title as string}
                className="rounded-[8px] border border-border bg-card p-5"
              >
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold text-foreground">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description as string}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
              Câu hỏi thường gặp
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Tìm hiểu nhanh về StockMaster WMS
            </h2>
          </div>

          <div className="mt-8 divide-y divide-border rounded-[8px] border border-border bg-card sm:mt-9">
            {faqItems.map((item) => (
              <article key={item.question} className="p-5">
                <h3 className="text-base font-semibold text-foreground">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Bắt đầu quản lý kho với {SITE_NAME}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/78">
              Đăng nhập để sử dụng trang tổng quan, quản lý tồn kho, nhập xuất hàng,
              kiểm kê và báo cáo vận hành.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background/90 sm:w-auto"
          >
            Vào hệ thống
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
