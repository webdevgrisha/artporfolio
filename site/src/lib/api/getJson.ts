import type { z } from "zod";

import type { Language } from "@/lib/i18n/languages";

import { ApiError } from "./apiError";
import { apiUrl } from "./apiUrl";

/** A page waits this long for the API before it shows an error instead of hanging. */
const timeoutMilliseconds = 5_000;

/**
 * Reads a resource of the API in the language of the page, such as `about` for `/api/about`,
 * and checks it against the schema the page relies on. Rejects with ApiError when no usable data
 * came: an error status, no answer in time, or an answer of another shape.
 */
export async function getJson<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  { language }: { language: Language },
): Promise<z.output<Schema>> {
  const url = apiUrl(path);
  url.searchParams.set("lang", language);

  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMilliseconds),
    });
  } catch (error) {
    throw new ApiError(`GET ${url.pathname} got no answer`, undefined, { cause: error });
  }

  if (!response.ok) {
    throw new ApiError(`GET ${url.pathname} answered ${response.status}`, response.status);
  }

  const parsed = schema.safeParse(await response.json().catch(() => undefined));

  if (!parsed.success) {
    throw new ApiError(`GET ${url.pathname} answered an unexpected shape`, response.status, {
      cause: parsed.error,
    });
  }

  return parsed.data;
}
