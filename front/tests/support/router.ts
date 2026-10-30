import { RouterContextProvider } from "react-router";

/** The arguments of a route loader or action for a request to `path` on the admin's origin. */
export function routeArgs(path: string, init?: RequestInit) {
  const url = new URL(path, window.location.origin);

  return {
    context: new RouterContextProvider(),
    params: {},
    pattern: url.pathname,
    request: new Request(url, init),
    url,
  };
}

/** The arguments of a route action for a form posted to `path`. */
export function formActionArgs(path: string, fields: Record<string, string>) {
  return routeArgs(path, { body: new URLSearchParams(fields), method: "POST" });
}

/** The response that a loader or an action throws, such as a redirect. */
export async function thrownResponse(promise: Promise<unknown>): Promise<Response> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }

  throw new Error("Expected a thrown response");
}
