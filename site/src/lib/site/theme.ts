/** A theme of the site; without a choice of the visitor, the page follows the system. */
export type Theme = "light" | "dark";

/** Where the browser keeps the theme the visitor chose, read before the first paint. */
export const themeStorageKey = "theme";

/**
 * The color of the bar of a phone browser over each theme: the surface of the page
 * (`--color-surface`), so the bar and the page are one.
 */
export const themeColors: Record<Theme, string> = { light: "#fff", dark: "#141414" };
