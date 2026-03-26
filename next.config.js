/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // API gọi thẳng tới BE qua NEXT_PUBLIC_API_BASE* trong .env — không dùng rewrite /api.
};

module.exports = nextConfig;
import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());