import { createBrowserRouter, Navigate } from "react-router";

import { NotFound } from "@/pages/NotFound/NotFound";
import { RequireAuth } from "@/router/RequireAuth/RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/admin/login" replace />,
  },
  {
    path: "/admin",
    lazy: async () => ({ Component: (await import("@/router/AdminRoot/AdminRoot")).AdminRoot }),
    children: [
      {
        path: "login",
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
                element: <Navigate to="/admin/projects" replace />,
              },
              {
                path: "about",
                lazy: async () => ({
                  Component: (await import("@/pages/Admin/About/About")).About,
                }),
              },
              {
                path: "contacts",
                lazy: async () => ({
                  Component: (await import("@/pages/Admin/Contacts/Contacts")).Contacts,
                }),
              },
              {
                path: "gallery",
                lazy: async () => ({
                  Component: (await import("@/pages/Admin/Gallery/Gallery")).Gallery,
                }),
              },
              {
                path: "personalization",
                lazy: async () => ({
                  Component: (await import("@/pages/Admin/Personalization/Personalization"))
                    .Personalization,
                }),
              },
              {
                path: "projects",
                lazy: async () => ({
                  Component: (await import("@/pages/Admin/Projects/Projects")).Projects,
                }),
              },
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
