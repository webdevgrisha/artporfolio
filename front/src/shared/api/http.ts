import type { ZodType, z } from "zod";

import { HttpError } from "@/http/httpError";

type HttpOptions = Omit<RequestInit, "body" | "credentials" | "method">;

interface GetOptions<TSchema extends ZodType> extends HttpOptions {
  path: string;
  schema: TSchema;
}

interface PostOptions<TBody extends object, TSchema extends ZodType> extends HttpOptions {
  body: TBody;
  path: string;
  schema: TSchema;
}

interface PostVoidOptions<TBody extends object> extends HttpOptions {
  body?: TBody;
  path: string;
}

interface RequestOptions extends HttpOptions {
  body?: object;
  method: "GET" | "POST";
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
  }: PostOptions<TBody, TSchema>): Promise<z.output<TSchema>> {
    const response = await this.request(path, {
      ...options,
      body,
      method: "POST",
    });

    return schema.parse(await response.json());
  }

  async postVoid<TBody extends object = never>({
    body,
    path,
    ...options
  }: PostVoidOptions<TBody>): Promise<void> {
    await this.request(path, {
      ...options,
      body,
      method: "POST",
    });
  }

  private async request(
    path: string,
    { body, headers, ...options }: RequestOptions,
  ): Promise<Response> {
    const requestBody = body ? JSON.stringify(body) : undefined;
    const requestHeaders = new Headers(headers);

    if (body) {
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
