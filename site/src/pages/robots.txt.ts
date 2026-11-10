import { SITE_URL } from "astro:env/server";
import type { APIRoute } from "astro";

import { buildRobots } from "@/lib/seo/robots";

// Built ahead into a file: the functions runtime answers 404 to /robots.txt, so Firebase Hosting
// serves it as a file.
export const prerender = true;

export const GET: APIRoute = () =>
  new Response(buildRobots(SITE_URL), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
