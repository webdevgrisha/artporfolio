import { SITE_URL } from "astro:env/server";
import type { APIRoute } from "astro";

import { buildRobots } from "@/lib/seo/robots";

export const GET: APIRoute = () =>
  new Response(buildRobots(SITE_URL), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
