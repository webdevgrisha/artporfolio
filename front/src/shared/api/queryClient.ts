import { QueryClient } from "@tanstack/react-query";

import { HttpError } from "./httpError";

const maxRetries = 2;

/** How a change tells its result; the app shows it in a toast (app/mutationFeedback.ts). */
export interface MutationFeedback {
  /** The text for a failure, usually from `getSaveErrorMessage`. */
  getErrorMessage: (error: unknown) => string;
  /** The text once the change succeeded; «Изменения сохранены» by default. */
  successMessage?: string;
  /** Toasts with the same id replace each other: one id for one action on one thing. */
  toastId: string;
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      feedback?: MutationFeedback;
    };
  }
}

/** The cache of server data, shared by the route loaders and the components. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A client error, such as an expired session, fails the same way again; a lost connection
      // or a server error may pass.
      retry: (failureCount, error) =>
        !(error instanceof HttpError && error.status < 500) && failureCount < maxRetries,
      // The admin is the only one who changes the data, and every save puts what it saved into
      // the cache. A page loads its data afresh when it is entered. A reload under an open form
      // changes its props, so a form finds its changes against the values it was opened with,
      // not against the data.
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});
