import type { MetadataRoute } from "next";

const DISALLOWED = [
  "/api/",
  "/dashboard/",
  "/login/",
  "/signup/",
  "/admin/",
  "/sites/",
  "/share/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule for all crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
      // Explicit permissions for AI crawlers (GEO — Generative Engine Optimization)
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "ClaudeBot-Web", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Googlebot-Extended", allow: "/" },
      { userAgent: "GoogleOther", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "cohere-ai", allow: "/" },
    ],
    sitemap: "https://conteo.online/sitemap.xml",
  };
}
