import { createBrowserRouter, Navigate, type ShouldRevalidateFunctionArgs } from "react-router";

import { requireSession } from "@/entities/user";
import { logoutAction } from "@/features/logout";
import { ErrorPage } from "@/pages/error";
import { NotFoundPage } from "@/pages/not-found";
import { adminHomePath, adminRouteId, routes } from "@/shared/config/routes";
import { PageLoading } from "@/shared/ui/page-loading";
import { AdminLayout, AdminLayoutSkeleton, AdminPageError } from "@/widgets/admin-layout";

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
        // Shown on the first load of the login page while the session is being checked; an admin
        // page shows the skeleton of its layout instead.
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
            // In the main bundle with the layout, whose sidebar holds the logout button.
            action: logoutAction,
          },
          {
            id: adminRouteId,
            // Not lazy, as small as it is: the skeleton of the layout shows on the first load of an
            // admin page while the session is checked, and the layout follows without loading.
            Component: AdminLayout,
            HydrateFallback: AdminLayoutSkeleton,
            loader: requireSession,
            // The session is checked once, on entering the admin, so moving between its pages
            // waits for no extra request. A session that expires later is found by the next page
            // load, which then sends the user to the login page (AdminPageError).
            shouldRevalidate: () => false,
            children: [
              {
                // A pathless route: a failed page is replaced inside the layout, the navigation stays.
                ErrorBoundary: AdminPageError,
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
                    // The text, the sections, the materials, the colors and the palettes are saved
                    // independently; the page opens the sections.
                    children: [
                      {
                        index: true,
                        element: <Navigate to={routes.gallerySections} replace />,
                      },
                      {
                        path: routes.galleryIntro,
                        lazy: async () => {
                          const { GalleryIntroSection, galleryIntroLoader } = await import(
                            "@/pages/gallery"
                          );

                          return { Component: GalleryIntroSection, loader: galleryIntroLoader };
                        },
                      },
                      {
                        path: routes.gallerySections,
                        lazy: async () => {
                          const { GallerySectionsSection, gallerySectionsLoader } = await import(
                            "@/pages/gallery"
                          );

                          return {
                            Component: GallerySectionsSection,
                            loader: gallerySectionsLoader,
                            shouldRevalidate: (args) =>
                              !changesOnlySearch(args) && args.defaultShouldRevalidate,
                          };
                        },
                      },
                      {
                        path: routes.galleryMaterials,
                        lazy: async () => {
                          const { GalleryMaterialsSection, galleryMaterialsLoader } = await import(
                            "@/pages/gallery"
                          );

                          return {
                            Component: GalleryMaterialsSection,
                            loader: galleryMaterialsLoader,
                          };
                        },
                      },
                      {
                        path: routes.galleryColors,
                        lazy: async () => {
                          const { GalleryColorsSection, galleryColorsLoader } = await import(
                            "@/pages/gallery"
                          );

                          return { Component: GalleryColorsSection, loader: galleryColorsLoader };
                        },
                      },
                      {
                        path: routes.galleryPalettes,
                        lazy: async () => {
                          const { GalleryPalettesSection, galleryPalettesLoader } = await import(
                            "@/pages/gallery"
                          );

                          return {
                            Component: GalleryPalettesSection,
                            loader: galleryPalettesLoader,
                          };
                        },
                      },
                    ],
                  },
                  {
                    path: routes.gallerySectionNew,
                    lazy: async () => {
                      const { NewSectionPage, newSectionHandle } = await import("@/pages/gallery");

                      return { Component: NewSectionPage, handle: newSectionHandle };
                    },
                  },
                  {
                    path: `${routes.gallerySections}/:id`,
                    lazy: async () => {
                      const { EditSectionPage, editSectionHandle, gallerySectionLoader } =
                        await import("@/pages/gallery");

                      return {
                        Component: EditSectionPage,
                        handle: editSectionHandle,
                        loader: gallerySectionLoader,
                      };
                    },
                  },
                  {
                    path: routes.galleryWorkNew,
                    lazy: async () => {
                      const { NewWorkPage, newWorkHandle } = await import("@/pages/gallery");

                      return { Component: NewWorkPage, handle: newWorkHandle };
                    },
                  },
                  {
                    path: `${routes.galleryWorks}/:id`,
                    lazy: async () => {
                      const { EditWorkPage, editWorkHandle, galleryWorkLoader } = await import(
                        "@/pages/gallery"
                      );

                      return {
                        Component: EditWorkPage,
                        handle: editWorkHandle,
                        loader: galleryWorkLoader,
                      };
                    },
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
