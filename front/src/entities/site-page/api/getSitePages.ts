import { z } from "zod";

import { http } from "@/shared/api/http";

import { type SitePages, sitePagesSchema } from "../model/sitePage";

const sitePagesResponseSchema = z.object({
  pages: sitePagesSchema,
});

interface GetSitePagesParams {
  signal?: AbortSignal;
}

export async function getSitePages({ signal }: GetSitePagesParams = {}): Promise<SitePages> {
  const response = await http.get({
    path: "/pages",
    schema: sitePagesResponseSchema,
    signal,
  });

  return response.pages;
}
