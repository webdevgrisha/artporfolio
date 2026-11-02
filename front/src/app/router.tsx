import { createBrowserRouter, Navigate, type ShouldRevalidateFunctionArgs } from "react-router";

import { ErrorPage } from "@/pages/error";
import { NotFoundPage } from "@/pages/not-found";
import { adminHomePath, adminRouteId, routes } from "@/shared/config/routes";
import { PageLoading } from "@/shared/ui/page-loading";

/**
 * A change of the search parameters alone, such as the search of a table, is a view of the same
 * page: it loads nothing again.
 */
function changesOnlySearch({ currentUrl, nextUrl }: ShouldRevalidateFunctionArgs): boolean {
  return currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search;
}

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
                // The session is checked on every navigation to a page, not only on the first one:
                // when it has expired, its redirect to the login page wins over the failed page
                // loader.
                shouldRevalidate: (args) => !changesOnlySearch(args),
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
                    // The text and the list are saved independently; the page opens the list.
                    children: [
                      {
                        index: true,
                        element: <Navigate to={routes.projectsAll} replace />,
                      },
                      {
                        path: routes.projectsIntro,
                        lazy: async () => {
                          const { ProjectsIntroSection, projectsIntroLoader } = await import(
                            "@/pages/projects"
                          );

                          return { Component: ProjectsIntroSection, loader: projectsIntroLoader };
                        },
                      },
                      {
                        path: routes.projectsAll,
                        lazy: async () => {
                          const { ProjectsTableSection, projectsTableLoader } = await import(
                            "@/pages/projects"
                          );

                          return {
                            Component: ProjectsTableSection,
                            loader: projectsTableLoader,
                            shouldRevalidate: (args) =>
                              !changesOnlySearch(args) && args.defaultShouldRevalidate,
                          };
                        },
                      },
                      {
                        path: routes.projectsOrder,
                        lazy: async () => {
                          const { ProjectsOrderSection, projectsOrderLoader } = await import(
                            "@/pages/projects"
                          );

                          return { Component: ProjectsOrderSection, loader: projectsOrderLoader };
                        },
                      },
                    ],
                  },
                  {
                    path: routes.projectNew,
                    lazy: async () => {
                      const { NewProjectPage, newProjectHandle } = await import("@/pages/projects");

                      return { Component: NewProjectPage, handle: newProjectHandle };
                    },
                  },
                  {
                    path: `${routes.projects}/:id`,
                    lazy: async () => {
                      const { EditProjectPage, editProjectHandle, projectLoader } = await import(
                        "@/pages/projects"
                      );

                      return {
                        Component: EditProjectPage,
                        handle: editProjectHandle,
                        loader: projectLoader,
                      };
                    },
                  },
                  {
                    path: routes.about,
                    lazy: async () => ({ Component: (await import("@/pages/about")).AboutPage }),
                    // Each section has its own form, URL and resource; the page opens its first one.
                    children: [
                      {
                        index: true,
                        element: <Navigate to={routes.aboutText} replace />,
                      },
                      {
                        path: routes.aboutText,
                        lazy: async () => {
                          const { AboutTextSection, aboutTextLoader } = await import(
                            "@/pages/about"
                          );

                          return { Component: AboutTextSection, loader: aboutTextLoader };
                        },
                      },
                      {
                        path: routes.aboutPhoto,
                        lazy: async () => {
                          const { AboutPhotoSection, aboutPhotoLoader } = await import(
                            "@/pages/about"
                          );

                          return { Component: AboutPhotoSection, loader: aboutPhotoLoader };
                        },
                      },
                      {
                        path: routes.aboutProcess,
                        lazy: async () => {
                          const { AboutProcessSection, aboutProcessLoader } = await import(
                            "@/pages/about"
                          );

                          return { Component: AboutProcessSection, loader: aboutProcessLoader };
                        },
                      },
                    ],
                  },
                  {
                    path: routes.contacts,
                    lazy: async () => ({
                      Component: (await import("@/pages/contacts")).ContactsPage,
                    }),
                    children: [
                      {
                        index: true,
                        element: <Navigate to={routes.contactLinks} replace />,
                      },
                      {
                        path: routes.contactLinks,
                        lazy: async () => {
                          const { ContactLinksSection, contactLinksLoader } = await import(
                            "@/pages/contacts"
                          );

                          return { Component: ContactLinksSection, loader: contactLinksLoader };
                        },
                      },
                      {
                        path: routes.contactPhoto,
                        lazy: async () => {
                          const { ContactPhotoSection, contactPhotoLoader } = await import(
                            "@/pages/contacts"
                          );

                          return { Component: ContactPhotoSection, loader: contactPhotoLoader };
                        },
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
