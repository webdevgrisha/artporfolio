import { MoonIcon, SunIcon } from "@/shared/ui/icon";
import { IconAction } from "@/shared/ui/icon-button";

import { useTheme } from "../model/useTheme";

/** Shows the theme it turns on, so the icon says what the click does. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему";

  return (
    <IconAction label={label} onClick={toggleTheme}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </IconAction>
  );
}
