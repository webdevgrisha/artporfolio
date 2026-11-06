export type Theme = "dark" | "light";

/** The script in index.html reads this key too: it sets the theme before the first paint. */
export const themeStorageKey = "theme";

/** The --color-surface of each theme, for the bar of a mobile browser, which CSS cannot reach. */
const browserBarColors = { dark: "#141414", light: "#fff" } satisfies Record<Theme, string>;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Light is the theme of the page without the attribute. */
export function showTheme(theme: Theme): void {
  if (theme === "dark") {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", browserBarColors[theme]);
}

/** Where storage is blocked, the theme still changes, for as long as the page stays open. */
function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Nothing to do: the next visit opens in the light theme.
  }
}

/**
 * Saves the theme and shows it. The page cross-fades as a whole: on their own, the controls with a
 * color transition would change after the rest of the page.
 */
export function changeTheme(theme: Theme): void {
  saveTheme(theme);

  const canFade =
    "startViewTransition" in document &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (canFade) {
    document.startViewTransition(() => showTheme(theme));
  } else {
    showTheme(theme);
  }
}
