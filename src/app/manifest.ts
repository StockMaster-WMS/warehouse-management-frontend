import type { MetadataRoute } from "next";

/**
 * Web App Manifest — cho phép “Cài đặt app” / Add to Home Screen.
 * @see https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StockMaster — Quản lý kho",
    short_name: "StockMaster",
    description:
      "Giao diện web quản lý kho đa điểm: tồn kho, nhập xuất, đơn hàng và báo cáo.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    lang: "vi",
    dir: "ltr",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
