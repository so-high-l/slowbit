import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const origin = "https://slowbit.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/favorites/", "/settings/", "/credits/", "/privacy/"].map((path, index) => ({
    url: `${origin}${path}`,
    changeFrequency: "monthly" as const,
    priority: index === 0 ? 1 : 0.5,
  }));
}
