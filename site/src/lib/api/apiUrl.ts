import { API_URL } from "astro:env/server";

/** The address of a resource of the API, such as `about` for `/api/about`. */
export function apiUrl(path: string): URL {
  return new URL(`${API_URL.replace(/\/$/, "")}/${path}`);
}
