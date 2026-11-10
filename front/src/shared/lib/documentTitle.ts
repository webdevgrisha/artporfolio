const appName = "NOT.YET.KNOW.ARTIST";

export function documentTitle(pageTitle: string): string {
  return pageTitle ? `${pageTitle} — ${appName}` : appName;
}
