import { QueryClient } from "@tanstack/react-query";

import { HttpError } from "./httpError";
import { NetworkError } from "./networkError";

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
      // Only a lost connection or a server error may pass on a retry. Anything else fails the same
      // way again: a client error, such as an expired session, a response of an unexpected
      // shape, or a bug.
      retry: (failureCount, error) =>
        failureCount < maxRetries &&
        (error instanceof NetworkError || (error instanceof HttpError && error.status >= 500)),
      // The admin is the only one who changes the data, and every save puts what it saved into
      // the cache. A page loads its data afresh when it is entered. A reload under an open form
      // changes its props, so a form finds its changes against the values it was opened with,
      // not against the data.
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});
