import { useEffect, useRef, useState } from "react";

// Keep in sync with the desktop breakpoint in globals.css.
const desktopMediaQuery = "(width >= 75rem)";
const focusableSelector = "a[href], button:not(:disabled)";

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpen.current) toggleRef.current?.focus();
      wasOpen.current = false;
      return;
    }

    wasOpen.current = true;

    const drawer = drawerRef.current;
    const desktop = window.matchMedia(desktopMediaQuery);
    const previousOverflow = document.body.style.overflow;

    function getFocusableElements() {
      const drawerElements = Array.from(
        drawer?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
      return toggleRef.current ? [toggleRef.current, ...drawerElements] : drawerElements;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      // Keep keyboard focus inside the open drawer and its toggle button.
      const focusable = getFocusableElements();
      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setIsOpen(false);
    }

    document.body.style.overflow = "hidden";
    drawer?.querySelector<HTMLElement>(focusableSelector)?.focus();
    window.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
  }

  function toggle() {
    setIsOpen((current) => !current);
  }

  return { close, drawerRef, isOpen, toggle, toggleRef };
}
