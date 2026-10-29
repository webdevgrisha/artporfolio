import { QueryClient } from "@tanstack/react-query";

import { HttpError } from "./httpError";

const maxRetries = 2;

/** The cache of server data, shared by the route loaders and the components. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A client error, such as an expired session, fails the same way again; a lost connection
      // or a server error may pass.
      retry: (failureCount, error) =>
        !(error instanceof HttpError && error.status < 500) && failureCount < maxRetries,
      // The admin is the only one who changes the data, and every save invalidates what it
      // changed. A page loads its data afresh when it is entered, so nothing is refetched in the
      // background under an open form, whose saved values come from that data.
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});
