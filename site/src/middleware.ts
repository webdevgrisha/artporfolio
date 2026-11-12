import { defineMiddleware } from "astro:middleware";

/**
 * A page shows what the admin saved, so a CDN may keep it for a minute and then serve the old copy
 * for up to a day while it fetches a new one in the background. An error of the server is never
 * kept, nor the answer to a form a visitor sent, which is theirs alone. A response that names its own caching, such as the redirect of the root, keeps it.
 */
const pageCaching = "public, max-age=0, s-maxage=60, stale-while-revalidate=86400";

const cacheableMethods = new Set(["GET", "HEAD"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  if (!response.headers.has("Cache-Control")) {
    const cacheable = cacheableMethods.has(context.request.method) && response.status < 500;

    response.headers.set("Cache-Control", cacheable ? pageCaching : "no-store");
  }

  return response;
});
