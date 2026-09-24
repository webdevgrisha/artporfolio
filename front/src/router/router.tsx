import { createBrowserRouter, Navigate } from "react-router";

import { About } from "@/pages/Admin/About/About";
import { Contacts } from "@/pages/Admin/Contacts/Contacts";
import { Gallery } from "@/pages/Admin/Gallery/Gallery";
import { Login } from "@/pages/Admin/Login/Login";
import { Projects } from "@/pages/Admin/Projects/Projects";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/admin/login" replace />,
  },
  {
    path: "/admin",
    children: [
      {
        index: true,
        element: <Navigate to="/admin/projects" replace />,
      },
      {
        path: "login",
        element: <Login />,
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
        path: "projects",
        element: <Projects />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/admin/login" replace />,
  },
]);
