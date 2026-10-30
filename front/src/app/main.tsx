import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";

import { queryClient } from "@/shared/api/queryClient";
import { Toaster } from "@/shared/ui/toast";

import { showMutationFeedback } from "./mutationFeedback";
import { router } from "./router";
import { reloadOnStaleChunks } from "./staleChunkReload";
import "./styles/reset.css";
import "./styles/globals.css";

reloadOnStaleChunks();
showMutationFeedback(queryClient);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* Rendered in development only: the production build replaces it with nothing. */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
    <Toaster />
  </React.StrictMode>,
);
