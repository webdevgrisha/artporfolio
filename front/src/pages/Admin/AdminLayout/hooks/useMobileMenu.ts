import { useEffect, useRef, useState } from "react";

// Keep in sync with the desktop breakpoint in globals.css.
const desktopMediaQuery = "(width >= 75rem)";

/*
 * Focus containment comes from the `inert` attribute that AdminLayout sets on the rest of the page;
 * this hook only moves focus, closes on Escape or desktop width, and locks page scroll.
 */
export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpen.current) toggleRef.current?.focus();
      wasOpen.current = false;
      return;
    }

    wasOpen.current = true;

    const desktop = window.matchMedia(desktopMediaQuery);
    const previousOverflow = document.body.style.overflow;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setIsOpen(false);
    }

    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    window.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [isOpen]);

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  return { close, drawerRef, isOpen, open, toggleRef };
}
