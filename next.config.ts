import type { NextConfig } from "next";
const development = process.env.NODE_ENV === "development";
const config: NextConfig = {
  output: development ? undefined : "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(development
    ? {
        async rewrites() {
          return [
            {
              source: "/api/board/:path*",
              destination: "http://localhost:4190/api/board/:path*",
            },
          ];
        },
      }
    : {}),
};
export default config;
