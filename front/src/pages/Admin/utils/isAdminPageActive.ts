export function isAdminPageActive(pathname: string, pagePath: string) {
  return pathname === pagePath || pathname.startsWith(`${pagePath}/`);
}
