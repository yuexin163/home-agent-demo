import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      trailingSlash: true,
      poweredByHeader: false,
      images: { unoptimized: true },
    }
  : {
      output: "standalone",
      poweredByHeader: false,
      async rewrites() {
        return [
          {
            source: "/api/asr/:path*",
            destination: "http://127.0.0.1:3100/api/asr/:path*",
          },
        ];
      },
      async headers() {
        return [
          {
            source: "/:path*",
            headers: [
              { key: "X-Content-Type-Options", value: "nosniff" },
              { key: "X-Frame-Options", value: "SAMEORIGIN" },
              { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
            ],
          },
        ];
      },
    };

export default nextConfig;
