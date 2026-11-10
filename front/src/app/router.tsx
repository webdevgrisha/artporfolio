import { createBrowserRouter, Navigate } from "react-router";

import { requireSession } from "@/entities/user";
import { logoutAction } from "@/features/logout";
import { ErrorPage } from "@/pages/error";
import { NotFoundPage } from "@/pages/not-found";
import { adminHomePath, adminRouteId, routes } from "@/shared/config/routes";
import { PageLoading } from "@/shared/ui/page-loading";
import { AdminLayout, AdminLayoutSkeleton, AdminPageError } from "@/widgets/admin-layout";

// Every page loads with its own chunk; each page package exports the routes it renders.
const gallery = () => import("@/pages/gallery");
const projects = () => import("@/pages/projects");
const about = () => import("@/pages/about");
const contacts = () => import("@/pages/contacts");

export const router = createBrowserRouter([
  {
    // The last resort: an error that no route below handles replaces the whole screen. It is not
    // lazy, so it works when a chunk fails to load.
    ErrorBoundary: ErrorPage,
    children: [
      {
        path: "/admin",
        // Shown on the first load of the login page while the session is being checked; an admin
        // page shows the skeleton of its layout instead.
        HydrateFallback: PageLoading,
        children: [
          {
            path: routes.login,
            lazy: () => import("@/pages/login").then((page) => page.loginRoute),
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
            // The session is checked once here, on entering the admin, so moving between its pages
            // waits for no extra request; the layout checks it behind each move (useSessionCheck).
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
                    lazy: () => gallery().then((page) => page.galleryRoute),
                    // The text, the works, the collections, the sections, the materials, the colors
                    // and the palettes are saved independently; the page opens the works.
                    children: [
                      { index: true, element: <Navigate to={routes.galleryWorks} replace /> },
                      {
                        path: routes.galleryIntro,
                        lazy: () => gallery().then((page) => page.galleryIntroRoute),
                      },
                      {
                        path: routes.galleryWorks,
                        lazy: () => gallery().then((page) => page.galleryWorksRoute),
                      },
                      {
                        path: routes.galleryCollections,
                        lazy: () => gallery().then((page) => page.galleryCollectionsRoute),
                      },
                      {
                        path: routes.gallerySections,
                        lazy: () => gallery().then((page) => page.gallerySectionsRoute),
                      },
                      {
                        path: routes.galleryMaterials,
                        lazy: () => gallery().then((page) => page.galleryMaterialsRoute),
                      },
                      {
                        path: routes.galleryColors,
                        lazy: () => gallery().then((page) => page.galleryColorsRoute),
                      },
                      {
                        path: routes.galleryPalettes,
                        lazy: () => gallery().then((page) => page.galleryPalettesRoute),
                      },
                    ],
                  },
                  {
                    path: routes.galleryWorkNew,
                    lazy: () => gallery().then((page) => page.newWorkRoute),
                  },
                  {
                    path: `${routes.galleryWorks}/:id`,
                    lazy: () => gallery().then((page) => page.editWorkRoute),
                  },
                  {
                    path: routes.galleryCollectionNew,
                    lazy: () => gallery().then((page) => page.newCollectionRoute),
                  },
                  {
                    path: `${routes.galleryCollections}/:id`,
                    lazy: () => gallery().then((page) => page.editCollectionRoute),
                  },
                  {
                    path: routes.gallerySectionNew,
                    lazy: () => gallery().then((page) => page.newSectionRoute),
                  },
                  {
                    path: `${routes.gallerySections}/:id`,
                    lazy: () => gallery().then((page) => page.editSectionRoute),
                  },
                  {
                    path: routes.projects,
                    lazy: () => projects().then((page) => page.projectsRoute),
                    // The text and the list are saved independently; the page opens the list.
                    children: [
                      { index: true, element: <Navigate to={routes.projectsAll} replace /> },
                      {
                        path: routes.projectsIntro,
                        lazy: () => projects().then((page) => page.projectsIntroRoute),
                      },
                      {
                        path: routes.projectsAll,
                        lazy: () => projects().then((page) => page.projectsTableRoute),
                      },
                      {
                        path: routes.projectsOrder,
                        lazy: () => projects().then((page) => page.projectsOrderRoute),
                      },
                    ],
                  },
                  {
                    path: routes.projectNew,
                    lazy: () => projects().then((page) => page.newProjectRoute),
                  },
                  {
                    path: `${routes.projects}/:id`,
                    lazy: () => projects().then((page) => page.editProjectRoute),
                  },
                  {
                    path: routes.about,
                    lazy: () => about().then((page) => page.aboutRoute),
                    children: [
                      { index: true, element: <Navigate to={routes.aboutText} replace /> },
                      {
                        path: routes.aboutText,
                        lazy: () => about().then((page) => page.aboutTextRoute),
                      },
                      {
                        path: routes.aboutPhoto,
                        lazy: () => about().then((page) => page.aboutPhotoRoute),
                      },
                      {
                        path: routes.aboutProcess,
                        lazy: () => about().then((page) => page.aboutProcessRoute),
                      },
                    ],
                  },
                  {
                    path: routes.contacts,
                    lazy: () => contacts().then((page) => page.contactsRoute),
                    children: [
                      { index: true, element: <Navigate to={routes.contactLinks} replace /> },
                      {
                        path: routes.contactLinks,
                        lazy: () => contacts().then((page) => page.contactLinksRoute),
                      },
                      {
                        path: routes.contactPhoto,
                        lazy: () => contacts().then((page) => page.contactPhotoRoute),
                      },
                    ],
                  },
                  {
                    path: routes.currencies,
                    lazy: () => import("@/pages/currencies").then((page) => page.currenciesRoute),
                  },
                  {
                    path: routes.sitePages,
                    lazy: () => import("@/pages/site-pages").then((page) => page.sitePagesRoute),
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
