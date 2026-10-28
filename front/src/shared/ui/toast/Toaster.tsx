import type { CSSProperties } from "react";
import { Toaster as SonnerToaster } from "sonner";

import { CloseIcon } from "@/shared/ui/icon";

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
      // The message and the border colour tell success from error; no status icons.
      icons={{ close: <CloseIcon className={styles.closeIcon} />, error: null, success: null }}
      toastOptions={{
        classNames: {
          closeButton: styles.closeButton,
          content: styles.content,
          error: styles.error,
          toast: styles.toast,
        },
        closeButtonAriaLabel: "Закрыть уведомление",
        unstyled: true,
      }}
    />
  );
}
