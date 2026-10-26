import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { adminPages } from "@/pages/Admin/config/pages";
import { isAdminPageActive } from "@/pages/Admin/utils/isAdminPageActive";

// Keep in sync with the desktop breakpoint in AdminSidebar.module.css.
const desktopMediaQuery = "(width >= 75rem)";
const focusableSelector = "a[href], button:not(:disabled)";

export function useAdminSidebar() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const wasMobileMenuOpen = useRef(false);

  const activeIndex = adminPages.findIndex((page) => isAdminPageActive(pathname, page.to));

  useEffect(() => {
    if (!isMobileMenuOpen) {
      if (wasMobileMenuOpen.current) menuButtonRef.current?.focus();
      wasMobileMenuOpen.current = false;
      return;
    }

    wasMobileMenuOpen.current = true;

    const sidebar = sidebarRef.current;
    const desktop = window.matchMedia(desktopMediaQuery);
    const previousOverflow = document.body.style.overflow;

    function getFocusableElements() {
      const sidebarElements = Array.from(
        sidebar?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
      return menuButtonRef.current ? [menuButtonRef.current, ...sidebarElements] : sidebarElements;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
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
      if (event.matches) setIsMobileMenuOpen(false);
    }

    document.body.style.overflow = "hidden";
    sidebar?.querySelector<HTMLElement>(focusableSelector)?.focus();
    window.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [isMobileMenuOpen]);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function toggleMobileMenu() {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  }

  async function logoutAdmin() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
    } catch {
      // The local session is already cleared; the redirect below is still correct.
    }

    await navigate("/admin/login", { replace: true });
  }

  return {
    activeIndex,
    closeMobileMenu,
    isLoggingOut,
    isMobileMenuOpen,
    logoutAdmin,
    menuButtonRef,
    sidebarRef,
    toggleMobileMenu,
  };
}
