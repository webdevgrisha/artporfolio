import { z } from "zod";

import { http } from "@/shared/api/http";
import { type Image, imageSchema } from "@/shared/api/image";

import type { SitePageId } from "../model/sitePage";

const heroResponseSchema = z.object({
  hero: imageSchema,
});

interface ReplacePageHeroParams {
  page: SitePageId;
  /** The new file, uploaded with `uploadImage`. */
  uploadId: string;
}

/** Sets or replaces the hero of the page and returns it as stored by the server. */
export async function replacePageHero({ page, uploadId }: ReplacePageHeroParams): Promise<Image> {
  const response = await http.put({
    path: `/pages/${page}/hero`,
    body: { uploadId },
    schema: heroResponseSchema,
  });

  return response.hero;
}
