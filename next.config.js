/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // API gọi thẳng tới BE qua NEXT_PUBLIC_API_BASE* trong .env — không dùng rewrite /api.
};

module.exports = nextConfig;

// OpenNext CloudFlare dev shim — only enable when explicitly needed.
// The Workers SSR runtime generates different React root identifiers,
// causing @base-ui/react useId() hydration mismatches in `next dev`.
// Run with CF_DEV=1 when you want to test CloudFlare-specific behaviour.
if (process.env.CF_DEV) {
  import("@opennextjs/cloudflare").then((m) =>
    m.initOpenNextCloudflareForDev(),
  );
}
