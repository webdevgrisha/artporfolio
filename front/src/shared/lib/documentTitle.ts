const appName = "ArtPortfolio";

export function documentTitle(pageTitle: string): string {
  return pageTitle ? `${pageTitle} — ${appName}` : appName;
}
