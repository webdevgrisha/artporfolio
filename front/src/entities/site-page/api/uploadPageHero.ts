import { z } from "zod";

import { http } from "@/shared/api/http";
import { type Image, imageSchema } from "@/shared/api/image";

import type { SitePageId } from "../model/sitePage";

const heroResponseSchema = z.object({
  hero: imageSchema,
});

interface UploadPageHeroParams {
  csrfToken: string;
  file: File;
  page: SitePageId;
}

/** Uploads or replaces the hero of the page and returns it as stored by the server. */
export async function uploadPageHero({
  csrfToken,
  file,
  page,
}: UploadPageHeroParams): Promise<Image> {
  const body = new FormData();
  body.set("file", file);

  const response = await http.put({
    path: `/pages/${page}/hero`,
    body,
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: heroResponseSchema,
  });

  return response.hero;
}
