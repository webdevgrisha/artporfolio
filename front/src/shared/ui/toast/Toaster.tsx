import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";

import { CheckIcon, CloseIcon, ErrorIcon } from "@/shared/ui/icon";

import styles from "./Toaster.module.css";

// Sonner keeps positioning, stacking and animations; the toasts themselves are unstyled and
// styled by Toaster.module.css. These two values sit on the container, which Sonner still styles.
const toasterStyle = {
  "--width": "22rem",
  fontFamily: "inherit",
} as CSSProperties;

/** Renders the toasts shown with `showSuccessToast` and `showErrorToast`. Mount once. */
export function Toaster() {
  return (
    <SonnerToaster
      // At the top, toasts do not cover the form actions, which sit at the bottom of admin pages.
      position="top-right"
      style={toasterStyle}
      containerAriaLabel="Уведомления"
      // The status is shown by an icon as well as by colour, which alone is not enough (WCAG 1.4.1).
      icons={{
        close: <CloseIcon className={styles.closeIcon} />,
        error: <ErrorIcon className={styles.statusIcon} />,
        success: <CheckIcon className={styles.statusIcon} />,
      }}
      toastOptions={{
        classNames: {
          closeButton: styles.closeButton,
          content: styles.content,
          error: styles.error,
          icon: styles.icon,
          toast: styles.toast,
        },
        // Every toast can be closed at once, also from the keyboard.
        closeButton: true,
        closeButtonAriaLabel: "Закрыть уведомление",
        unstyled: true,
      }}
    />
  );
}
