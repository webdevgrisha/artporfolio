import React from "react";

import { changeTheme, currentTheme, showTheme, type Theme, themeStorageKey } from "./theme";

/** The theme of the page and its change, which also reaches the other open tabs. */
export function useTheme() {
  const [theme, setTheme] = React.useState(currentTheme);

  React.useEffect(() => {
    function followOtherTab(event: StorageEvent) {
      if (event.key !== themeStorageKey) {
        return;
      }

      const nextTheme: Theme = event.newValue === "dark" ? "dark" : "light";

      showTheme(nextTheme);
      setTheme(nextTheme);
    }

    window.addEventListener("storage", followOtherTab);

    return () => window.removeEventListener("storage", followOtherTab);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    changeTheme(nextTheme);
    setTheme(nextTheme);
  }

  return { theme, toggleTheme };
}
