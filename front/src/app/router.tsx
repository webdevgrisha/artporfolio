import { createBrowserRouter, Navigate } from "react-router";

import { PageLoading } from "@/components/PageLoading/PageLoading";
import { adminHomePath, adminPages, loginPath, logoutPath } from "@/pages/Admin/config/pages";
import { NotFound } from "@/pages/NotFound/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={loginPath} replace />,
  },
  {
    path: "/admin",
    // Shown on the first load while the session is being checked.
    HydrateFallback: PageLoading,
    children: [
      {
        path: loginPath,
        lazy: async () => {
          const [{ Login }, { action, loader }] = await Promise.all([
            import("@/pages/Admin/Login/Login"),
            import("@/pages/Admin/Login/loginRoute"),
          ]);

          // After a failed sign-in only the action result changes; the session check is not repeated.
          return { action, Component: Login, loader, shouldRevalidate: () => false };
        },
      },
      {
        path: logoutPath,
        lazy: async () => ({ action: (await import("@/auth/logout")).logoutAction }),
      },
      {
        lazy: async () => {
          const [{ AdminLayout }, { adminLayoutLoader }] = await Promise.all([
            import("@/pages/Admin/AdminLayout/AdminLayout"),
            import("@/pages/Admin/AdminLayout/adminLayoutLoader"),
          ]);

          return { Component: AdminLayout, loader: adminLayoutLoader };
        },
        children: [
          {
            index: true,
            element: <Navigate to={adminHomePath} replace />,
          },
          ...adminPages.map((page) => ({
            path: page.to,
            lazy: async () => ({ Component: await page.load() }),
          })),
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
