/**
 * The rules for crawlers: everything but the API, which has nothing to show. The admin is not
 * disallowed on purpose: a crawler kept out of it could not read its `noindex`, and a page known
 * from links elsewhere could then still be listed.
 */
export function buildRobots(siteUrl: string): string {
  return [
    "User-agent: *",
    "Disallow: /api/",
    "",
    `Sitemap: ${new URL("/sitemap.xml", siteUrl).href}`,
    "",
  ].join("\n");
}
