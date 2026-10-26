import { Outlet } from "react-router";

import { AuthProvider } from "@/contexts/Auth";

// Only admin routes need the session check, so public pages never call /api/auth/me.
export function AdminRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
