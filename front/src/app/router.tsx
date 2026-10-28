import { createBrowserRouter, Navigate } from "react-router";

import { NotFoundPage } from "@/pages/not-found";
import { adminHomePath, adminRouteId, routes } from "@/shared/config/routes";
import { PageLoading } from "@/shared/ui/page-loading";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={routes.login} replace />,
  },
  {
    path: "/admin",
    // Shown on the first load while the session is being checked.
    HydrateFallback: PageLoading,
    children: [
      {
        path: routes.login,
        lazy: async () => {
          const { LoginPage, loginAction, loginLoader } = await import("@/pages/login");

          return {
            action: loginAction,
            Component: LoginPage,
            loader: loginLoader,
            // After a failed sign-in only the action result changes; the session check is not repeated.
            shouldRevalidate: () => false,
          };
        },
      },
      {
        path: routes.logout,
        lazy: async () => ({ action: (await import("@/features/logout")).logoutAction }),
      },
      {
        id: adminRouteId,
        lazy: async () => {
          const [{ AdminLayout }, { requireSession }] = await Promise.all([
            import("@/widgets/admin-layout"),
            import("@/entities/user"),
          ]);

          return { Component: AdminLayout, loader: requireSession };
        },
        children: [
          {
            index: true,
            element: <Navigate to={adminHomePath} replace />,
          },
          {
            path: routes.gallery,
            lazy: async () => ({ Component: (await import("@/pages/gallery")).GalleryPage }),
          },
          {
            path: routes.projects,
            lazy: async () => ({ Component: (await import("@/pages/projects")).ProjectsPage }),
          },
          {
            path: routes.about,
            lazy: async () => ({ Component: (await import("@/pages/about")).AboutPage }),
          },
          {
            path: routes.contacts,
            lazy: async () => {
              const { ContactsPage, contactsAction, contactsLoader } = await import(
                "@/pages/contacts"
              );

              return {
                action: contactsAction,
                Component: ContactsPage,
                loader: contactsLoader,
                // A save returns the stored values, so the contacts are not loaded again.
                shouldRevalidate: () => false,
              };
            },
          },
          {
            path: routes.personalization,
            lazy: async () => ({
              Component: (await import("@/pages/personalization")).PersonalizationPage,
            }),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
