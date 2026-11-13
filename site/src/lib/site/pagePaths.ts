/**
 * The pages of the site by their path under a language, such as `/contact` for `/pl/contact`. The
 * sitemap lists each in every language; a new page adds its path here.
 */
export const pagePaths = ["/", "/about", "/contact", "/projects"] as const;

export type PagePath = (typeof pagePaths)[number];
