import { createBrowserRouter, Navigate } from "react-router";

import { adminHomePath, adminPages, loginPath } from "@/pages/Admin/config/pages";
import { NotFound } from "@/pages/NotFound/NotFound";
import { RequireAuth } from "@/router/RequireAuth/RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={loginPath} replace />,
  },
  {
    path: "/admin",
    lazy: async () => ({ Component: (await import("@/router/AdminRoot/AdminRoot")).AdminRoot }),
    children: [
      {
        path: loginPath,
        lazy: async () => ({ Component: (await import("@/pages/Admin/Login/Login")).Login }),
      },
      {
        element: <RequireAuth />,
        children: [
          {
            lazy: async () => ({
              Component: (await import("@/pages/Admin/AdminLayout/AdminLayout")).AdminLayout,
            }),
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
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
