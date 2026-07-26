import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/src/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep Studio, API endpoints, auth flows and the logged-in app out of the index.
      disallow: [
        "/studio",
        "/api/",
        "/dashboard",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/auth/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
