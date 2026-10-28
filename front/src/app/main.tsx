import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";

import { Toaster } from "@/shared/ui/toast";

import { router } from "./router";
import { reloadOnStaleChunks } from "./staleChunkReload";
import "./styles/reset.css";
import "./styles/globals.css";

reloadOnStaleChunks();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>,
);
