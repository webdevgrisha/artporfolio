import { ApiError } from "./apiError";
import { apiUrl } from "./apiUrl";

/** A visitor waits this long for the API before the form tells them to try again. */
const timeoutMilliseconds = 5_000;

/**
 * Sends a JSON body to a resource of the API, such as `newsletter/subscribers`, for an answer with
 * no body. Rejects with ApiError when the API refused it or gave no answer in time.
 */
export async function postJson(path: string, body: unknown): Promise<void> {
  const url = apiUrl(path);

  let response: Response;

  try {
    response = await fetch(url, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(timeoutMilliseconds),
    });
  } catch (error) {
    throw new ApiError(`POST ${url.pathname} got no answer`, undefined, { cause: error });
  }

  if (!response.ok) {
    throw new ApiError(`POST ${url.pathname} answered ${response.status}`, response.status);
  }
}
