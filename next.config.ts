import type { NextConfig } from "next";
const development = process.env.NODE_ENV === "development";
const config: NextConfig = {
  output: development ? undefined : "export",
  trailingSlash: true,
  env: {
    // Public backend URL for the production Vercel export. Local previews keep
    // the same-origin Worker; explicit environment configuration takes priority.
    NEXT_PUBLIC_BOARD_API_URL: process.env.NEXT_PUBLIC_BOARD_API_URL ??
      (process.env.VERCEL_ENV === "production"
        ? "https://slowbit-board.elmahdanisouhail.workers.dev"
        : ""),
  },
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
