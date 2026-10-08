import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 构建时不跑 ESLint（lint 交给 CI 单独跑，不阻塞部署）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 构建时不做类型检查（已通过 tsc --noEmit 验证）
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
