import { createBrowserRouter, Navigate } from "react-router";

import { About } from "@/pages/Admin/About/About";
import { AdminLayout } from "@/pages/Admin/AdminLayout/AdminLayout";
import { Contacts } from "@/pages/Admin/Contacts/Contacts";
import { Gallery } from "@/pages/Admin/Gallery/Gallery";
import { Login } from "@/pages/Admin/Login/Login";
import { Personalization } from "@/pages/Admin/Personalization/Personalization";
import { Projects } from "@/pages/Admin/Projects/Projects";
import { NotFound } from "@/pages/NotFound/NotFound";
import { RequireAuth } from "@/router/RequireAuth/RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/admin/login" replace />,
  },
  {
    path: "/admin",
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/admin/projects" replace />,
              },
              {
                path: "about",
                element: <About />,
              },
              {
                path: "contacts",
                element: <Contacts />,
              },
              {
                path: "gallery",
                element: <Gallery />,
              },
              {
                path: "personalization",
                element: <Personalization />,
              },
              {
                path: "projects",
                element: <Projects />,
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
