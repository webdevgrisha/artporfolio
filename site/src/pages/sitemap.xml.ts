import { SITE_URL } from "astro:env/server";
import type { APIRoute } from "astro";

import { buildSitemap } from "@/lib/seo/sitemap";
import { pagePaths } from "@/lib/site/pagePaths";

export const GET: APIRoute = () =>
  new Response(buildSitemap(pagePaths, SITE_URL), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
