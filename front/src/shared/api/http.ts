import type { ZodType, z } from "zod";

import { HttpError } from "./httpError";

type HttpOptions = Omit<RequestInit, "body" | "credentials" | "method">;

interface GetOptions<TSchema extends ZodType> extends HttpOptions {
  path: string;
  schema: TSchema;
}

interface BodyOptions<TBody extends object, TSchema extends ZodType> extends HttpOptions {
  body: TBody;
  path: string;
  schema: TSchema;
}

interface PostVoidOptions extends HttpOptions {
  path: string;
}

interface DeleteOptions extends HttpOptions {
  path: string;
}

interface RequestOptions extends HttpOptions {
  /** Sent as JSON; `FormData` is sent as `multipart/form-data`. */
  body?: object;
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
}

class Http {
  private readonly baseUrl: string;

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

  async put<TBody extends object, TSchema extends ZodType>({
    body,
    path,
    schema,
    ...options
  }: BodyOptions<TBody, TSchema>): Promise<z.output<TSchema>> {
    const response = await this.request(path, {
      ...options,
      body,
      method: "PUT",
    });

    return schema.parse(await response.json());
  }

  async patch<TBody extends object, TSchema extends ZodType>({
    body,
    path,
    schema,
    ...options
  }: BodyOptions<TBody, TSchema>): Promise<z.output<TSchema>> {
    const response = await this.request(path, {
      ...options,
      body,
      method: "PATCH",
    });

    return schema.parse(await response.json());
  }

  /** A POST without a body whose response has no content, such as an action endpoint. */
  async postVoid({ path, ...options }: PostVoidOptions): Promise<void> {
    await this.request(path, {
      ...options,
      method: "POST",
    });
  }

  async delete({ path, ...options }: DeleteOptions): Promise<void> {
    await this.request(path, {
      ...options,
      method: "DELETE",
    });
  }

  private async request(
    path: string,
    { body, headers, ...options }: RequestOptions,
  ): Promise<Response> {
    const isFormData = body instanceof FormData;
    const requestBody = isFormData ? body : body ? JSON.stringify(body) : undefined;
    const requestHeaders = new Headers(headers);

    // The browser sets the multipart Content-Type itself, with the boundary.
    if (body && !isFormData) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      body: requestBody,
      credentials: "include",
      headers: requestHeaders,
    });

    if (!response.ok) {
      throw new HttpError(response.status);
    }

    return response;
  }
}

export const http = new Http("/api");
