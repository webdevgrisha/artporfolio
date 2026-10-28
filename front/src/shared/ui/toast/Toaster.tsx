import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";

// Sonner injects its own styles; its custom properties are overridden with the project tokens.
// Inline styles are used because Sonner's selectors are more specific than a single class.
const toasterStyle = {
  "--border-radius": "0",
  "--normal-bg": "var(--color-surface)",
  "--normal-border": "var(--color-border)",
  "--normal-text": "var(--color-text)",
  fontFamily: "inherit",
} as CSSProperties;

// Sonner sets a pixel font size on every toast, which ignores the browser font size.
const toastStyle: CSSProperties = {
  fontSize: "var(--font-size-md)",
};

/** Renders the toasts shown with `showSuccessToast` and `showErrorToast`. Mount once. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      style={toasterStyle}
      containerAriaLabel="Уведомления"
      toastOptions={{ closeButtonAriaLabel: "Закрыть уведомление", style: toastStyle }}
    />
  );
}
