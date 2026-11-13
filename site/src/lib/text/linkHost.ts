/** The site a link leads to, as a visitor reads it: `https://www.elephant.com/book` as `elephant.com`. */
export function linkHost(link: string): string {
  return new URL(link).hostname.replace(/^www\./u, "");
}
