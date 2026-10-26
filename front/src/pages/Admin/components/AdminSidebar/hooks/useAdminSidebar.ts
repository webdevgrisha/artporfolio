import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { adminPages } from "@/pages/Admin/config/pages";
import { isAdminPageActive } from "@/pages/Admin/utils/isAdminPageActive";

export function useAdminSidebar() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const activeIndex = adminPages.findIndex((page) => isAdminPageActive(pathname, page.to));

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
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
    toggleMobileMenu,
  };
}
