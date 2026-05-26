import type { Metadata } from "next";

import { StockMasterLanding } from "@/components/landing/stockmaster-landing";
import { SITE_NAME } from "@/lib/site";

const seoTitle =
  "StockMaster WMS - Phan mem quan ly kho, ton kho va nhap xuat hang";
const seoDescription =
  "StockMaster WMS la he thong quan ly kho tren nen tang web, ho tro quan ly ton kho, nhap xuat kho, lay hang, xep hang len ke, kiem ke, bao cao va phan quyen nguoi dung.";

const featureList = [
  "Quan ly ton kho theo thoi gian thuc",
  "Nhap kho va xep hang len ke",
  "Xuat kho va lay hang",
  "Kiem ke va dieu chinh kho",
  "Bao cao van hanh",
  "Phan quyen nguoi dung",
];

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
  featureList,
};

export const metadata: Metadata = {
  title: seoTitle,
  description: seoDescription,
  keywords: [
    "phan mem quan ly kho",
    "he thong quan ly kho",
    "quan ly ton kho",
    "quan ly nhap xuat kho",
    "WMS",
    "warehouse management system",
    "lay hang xep hang len ke",
    "kiem ke kho",
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
        url: "/opengraph-image.svg",
        width: 1200,
        height: 630,
        alt: "StockMaster WMS - phan mem quan ly kho",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
    images: ["/opengraph-image.svg"],
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <StockMasterLanding />
    </>
  );
}
