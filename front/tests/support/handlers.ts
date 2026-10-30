import { HttpResponse, http as mswHttp } from "msw/http";

/** The token the CSRF handler returns. */
export const csrfToken = "csrf-token";

/** Returns the CSRF token that the HTTP client asks for before its first change. */
export const csrfHandler = mswHttp.get("/api/auth/csrf", () => HttpResponse.json({ csrfToken }));

/** A response without content, such as that of a deletion. */
export function noContent() {
  return new HttpResponse(null, { status: 204 });
}

/** An error response of the API, as RFC 9457 Problem Details. */
export function problem(status: number) {
  return HttpResponse.json(
    { status, title: "Error", type: "about:blank" },
    { headers: { "Content-Type": "application/problem+json" }, status },
  );
}
