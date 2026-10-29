import { z } from "zod";

import { http } from "@/shared/api/http";

import { aboutPhotoSchema } from "../model/aboutPhoto";
import { aboutTextSchema } from "../model/aboutText";

const aboutSchema = z.object({
  /** `null` until the texts are first saved. */
  text: aboutTextSchema.nullable(),
  /** `null` until a photo is uploaded. */
  photo: aboutPhotoSchema.nullable(),
});

export type About = z.infer<typeof aboutSchema>;

interface GetAboutParams {
  signal?: AbortSignal;
}

export async function getAbout({ signal }: GetAboutParams = {}): Promise<About> {
  return http.get({
    path: "/about",
    schema: aboutSchema,
    signal,
  });
}
