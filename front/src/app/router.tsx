import { createBrowserRouter, Navigate } from "react-router";

import { ErrorPage } from "@/pages/error";
import { NotFoundPage } from "@/pages/not-found";
import { adminHomePath, adminRouteId, routes } from "@/shared/config/routes";
import { PageLoading } from "@/shared/ui/page-loading";

export const router = createBrowserRouter([
  {
    // The last resort: an error that no route below handles replaces the whole screen. It is not
    // lazy, so it works when a chunk fails to load.
    ErrorBoundary: ErrorPage,
    children: [
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

              return {
                Component: AdminLayout,
                loader: requireSession,
                // The session is checked on every navigation, not only on the first one: when it
                // has expired, its redirect to the login page wins over the failed page loader.
                shouldRevalidate: () => true,
              };
            },
            children: [
              {
                // A pathless route: a failed page is replaced inside the layout, the navigation stays.
                lazy: async () => ({
                  ErrorBoundary: (await import("@/widgets/admin-layout")).AdminPageError,
                }),
                children: [
                  {
                    index: true,
                    element: <Navigate to={adminHomePath} replace />,
                  },
                  {
                    path: routes.gallery,
                    lazy: async () => ({
                      Component: (await import("@/pages/gallery")).GalleryPage,
                    }),
                  },
                  {
                    path: routes.projects,
                    lazy: async () => ({
                      Component: (await import("@/pages/projects")).ProjectsPage,
                    }),
                  },
                  {
                    path: routes.about,
                    lazy: async () => {
                      const { AboutPage, aboutLoader } = await import("@/pages/about");

                      return { Component: AboutPage, loader: aboutLoader };
                    },
                    // Each section has its own form and URL; the page opens its first one.
                    children: [
                      {
                        index: true,
                        element: <Navigate to={routes.aboutText} replace />,
                      },
                      {
                        path: routes.aboutText,
                        lazy: async () => ({
                          Component: (await import("@/pages/about")).AboutTextSection,
                        }),
                      },
                      {
                        path: routes.aboutPhoto,
                        lazy: async () => ({
                          Component: (await import("@/pages/about")).AboutPhotoSection,
                        }),
                      },
                      {
                        path: routes.aboutProcess,
                        lazy: async () => ({
                          Component: (await import("@/pages/about")).AboutProcessSection,
                        }),
                      },
                    ],
                  },
                  {
                    path: routes.contacts,
                    lazy: async () => {
                      const { ContactsPage, contactsLoader } = await import("@/pages/contacts");

                      return { Component: ContactsPage, loader: contactsLoader };
                    },
                    children: [
                      {
                        index: true,
                        element: <Navigate to={routes.contactLinks} replace />,
                      },
                      {
                        path: routes.contactLinks,
                        lazy: async () => ({
                          Component: (await import("@/pages/contacts")).ContactLinksSection,
                        }),
                      },
                      {
                        path: routes.contactPhoto,
                        lazy: async () => ({
                          Component: (await import("@/pages/contacts")).ContactPhotoSection,
                        }),
                      },
                    ],
                  },
                  {
                    path: routes.personalization,
                    lazy: async () => ({
                      Component: (await import("@/pages/personalization")).PersonalizationPage,
                    }),
                  },
                  {
                    path: routes.sitePages,
                    lazy: async () => {
                      const { SitePagesPage, sitePagesLoader } = await import("@/pages/site-pages");

                      return { Component: SitePagesPage, loader: sitePagesLoader };
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
