import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const isDesktopBuild =
  process.env.BUILD_TARGET === "desktop" ||
  process.env.TAURI_ENV_PLATFORM !== undefined;

const nextConfig: NextConfig = {
  output: isDesktopBuild ? "export" : undefined,
  poweredByHeader: false,
  images: {
    unoptimized: isDesktopBuild ? true : undefined,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    if (isDesktopBuild) return [];
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
