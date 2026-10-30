import { type ZodType, z } from "zod";

import { HttpError } from "./httpError";
import { NetworkError } from "./networkError";

const csrfTokenResponseSchema = z.object({
  csrfToken: z.string().min(1),
});

type HttpOptions = Omit<RequestInit, "body" | "credentials" | "method"> & {
  /**
   * Whether a change carries the CSRF token of the session in its X-CSRF-Token header; on by
   * default. Only a request made without a session, such as signing in, goes without it.
   */
  withCsrfToken?: boolean;
};

interface GetOptions<TSchema extends ZodType> extends HttpOptions {
  path: string;
  schema: TSchema;
}

interface BodyOptions<TBody extends object, TSchema extends ZodType> extends HttpOptions {
  body: TBody;
  path: string;
  schema: TSchema;
}

interface ConditionalBodyOptions<TBody extends object, TSchema extends ZodType>
  extends BodyOptions<TBody, TSchema> {
  /** The tag of the representation the change was made against, sent in If-Match. */
  etag: string;
}

interface ConditionalOptions extends HttpOptions {
  /** The tag of the representation the change was made against, sent in If-Match. */
  etag: string;
  path: string;
}

/** A representation with its entity tag, which a later change sends back in If-Match. */
export interface Tagged<T> {
  data: T;
  etag: string;
}

interface PostVoidOptions extends HttpOptions {
  path: string;
}

interface RequestOptions extends HttpOptions {
  /** Sent as JSON; `FormData` is sent as `multipart/form-data`. */
  body?: object;
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
}

function withIfMatch(headers: HeadersInit | undefined, etag: string): Headers {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("If-Match", etag);

  return requestHeaders;
}

function readETag(response: Response): string {
  const etag = response.headers.get("ETag");

  if (!etag) {
    throw new Error(`The response of ${response.url} has no ETag`);
  }

  return etag;
}

class Http {
  private readonly baseUrl: string;
  /** The CSRF token of the current session, asked for by the first change and then reused. */
  private csrfToken: Promise<string> | undefined;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<TSchema extends ZodType>({
    path,
    schema,
    ...options
  }: GetOptions<TSchema>): Promise<z.output<TSchema>> {
    const response = await this.request(path, {
      ...options,
      method: "GET",
    });

    return schema.parse(await response.json());
  }

  /** A GET that also returns the ETag of the representation, for a later conditional change. */
  async getWithETag<TSchema extends ZodType>({
    path,
    schema,
    ...options
  }: GetOptions<TSchema>): Promise<Tagged<z.output<TSchema>>> {
    const response = await this.request(path, {
      ...options,
      method: "GET",
    });

    return { data: schema.parse(await response.json()), etag: readETag(response) };
  }

  async post<TBody extends object, TSchema extends ZodType>({
    body,
    path,
    schema,
    ...options
  }: BodyOptions<TBody, TSchema>): Promise<z.output<TSchema>> {
    const response = await this.request(path, {
      ...options,
      body,
      method: "POST",
    });

    return schema.parse(await response.json());
  }

  /**
   * A PUT that replaces the representation only while it still has the tag `etag`; the server
   * rejects it with 412 otherwise. Returns the new representation and its tag.
   */
  async putIfMatch<TBody extends object, TSchema extends ZodType>({
    body,
    etag,
    headers,
    path,
    schema,
    ...options
  }: ConditionalBodyOptions<TBody, TSchema>): Promise<Tagged<z.output<TSchema>>> {
    const response = await this.request(path, {
      ...options,
      body,
      headers: withIfMatch(headers, etag),
      method: "PUT",
    });

    return { data: schema.parse(await response.json()), etag: readETag(response) };
  }

  /**
   * A PATCH that changes the representation only while it still has the tag `etag`; the server
   * rejects it with 412 otherwise. The body is a JSON Merge Patch (RFC 7396): the fields it sends
   * replace those of the representation. Returns the new representation and its tag.
   */
  async patchIfMatch<TBody extends object, TSchema extends ZodType>({
    body,
    etag,
    headers,
    path,
    schema,
    ...options
  }: ConditionalBodyOptions<TBody, TSchema>): Promise<Tagged<z.output<TSchema>>> {
    const requestHeaders = withIfMatch(headers, etag);
    requestHeaders.set("Content-Type", "application/merge-patch+json");

    const response = await this.request(path, {
      ...options,
      body,
      headers: requestHeaders,
      method: "PATCH",
    });

    return { data: schema.parse(await response.json()), etag: readETag(response) };
  }

  /** A POST without a body whose response has no content, such as an action endpoint. */
  async postVoid({ path, ...options }: PostVoidOptions): Promise<void> {
    await this.request(path, {
      ...options,
      method: "POST",
    });
  }

  /**
   * A DELETE that applies only while the representation still has the tag `etag`; the server
   * rejects it with 412 otherwise. The response has no content.
   */
  async deleteIfMatch({ etag, headers, path, ...options }: ConditionalOptions): Promise<void> {
    await this.request(path, {
      ...options,
      headers: withIfMatch(headers, etag),
      method: "DELETE",
    });
  }

  /** Forgets the CSRF token, e.g. once its session has ended. */
  forgetCsrfToken(): void {
    this.csrfToken = undefined;
  }

  private getCsrfToken(): Promise<string> {
    if (!this.csrfToken) {
      const token = this.get({ path: "/auth/csrf", schema: csrfTokenResponseSchema }).then(
        (response) => response.csrfToken,
      );
      this.csrfToken = token;
      // A failed request is not kept: the next change asks again.
      token.catch(() => {
        if (this.csrfToken === token) this.forgetCsrfToken();
      });
    }

    return this.csrfToken;
  }

  private async request(
    path: string,
    { withCsrfToken = true, ...options }: RequestOptions,
  ): Promise<Response> {
    let response: Response;

    if (options.method === "GET" || !withCsrfToken) {
      response = await this.send(path, options);
    } else {
      const token = this.getCsrfToken();
      response = await this.send(path, options, await token);

      if (response.status === 403) {
        // The session changed since the token was received, e.g. after signing in again in
        // another tab. The server rejects a wrong token before it handles the change, so the
        // change is sent once more with the token of the new session.
        if (this.csrfToken === token) this.forgetCsrfToken();
        response = await this.send(path, options, await this.getCsrfToken());
      }
    }

    if (!response.ok) {
      throw new HttpError(response.status);
    }

    return response;
  }

  private async send(
    path: string,
    { body, headers, ...options }: Omit<RequestOptions, "withCsrfToken">,
    csrfToken?: string,
  ): Promise<Response> {
    const isFormData = body instanceof FormData;
    const requestBody = isFormData ? body : body ? JSON.stringify(body) : undefined;
    const requestHeaders = new Headers(headers);

    // The browser sets the multipart Content-Type itself, with the boundary. A JSON body is sent as
    // application/json unless its method named another JSON type, such as a merge patch.
    if (body && !isFormData && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    if (csrfToken) {
      requestHeaders.set("X-CSRF-Token", csrfToken);
    }

    try {
      return await fetch(`${this.baseUrl}${path}`, {
        ...options,
        body: requestBody,
        credentials: "include",
        headers: requestHeaders,
      });
    } catch (error) {
      // A cancelled request is not a failure: its caller no longer needs the response.
      if (options.signal?.aborted) throw error;

      // fetch rejects with a TypeError, which a bug in the code throws as well.
      throw new NetworkError(error);
    }
  }
}

export const http = new Http("/api");
