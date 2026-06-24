import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  getSiteUrl,
} from "@/lib/site";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: "StockMaster" }],
  creator: "StockMaster",
  publisher: "StockMaster",
  category: "business software",
  alternates: {
    canonical: "/",
    languages: {
      vi: "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: "Reyer451XiPGM6YqQ1YXWlCEOnDKMRNDB23GnJpm4WE",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Bỏ qua đến nội dung chính
        </a>
        <script type="application/ld+json">
          {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "StockMaster WMS",
              description: "Phần mềm quản lý kho hàng thông minh số 1 Việt Nam",
              url: getSiteUrl(),
              logo: `${getSiteUrl()}/icon.svg`,
              sameAs: [
                "https://warehouse.ryon.website",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "Customer Support",
                availableLanguage: ["vi", "en"],
              },
              areaServed: "VN",
              applicationCategory: "BusinessApplication",
            })}
        </script>
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
