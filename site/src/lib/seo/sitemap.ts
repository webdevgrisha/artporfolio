import { languages } from "@/lib/i18n/languages";
import { localizedPath } from "@/lib/site/localizedPath";

import { alternateLinks } from "./alternateLinks";

/**
 * The sitemap of the given pages in every language. Each URL names its versions in the other
 * languages, as Google asks for a sitemap with hreflang. Paths and URLs need no escaping: they
 * are built from the codes of languages and the fixed paths of pages.
 */
export function buildSitemap(paths: readonly string[], siteUrl: string): string {
  const entries = paths.flatMap((path) => {
    const alternates = alternateLinks(path, siteUrl)
      .map(
        ({ href, hreflang }) =>
          `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`,
      )
      .join("\n");

    return languages.map(
      (language) =>
        `  <url>\n    <loc>${new URL(localizedPath(language, path), siteUrl).href}</loc>\n${alternates}\n  </url>`,
    );
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}
