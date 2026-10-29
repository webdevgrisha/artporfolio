import { z } from "zod";

import { http } from "@/shared/api/http";
import { photoSchema } from "@/shared/api/photo";

import { aboutTextSchema } from "../model/aboutText";
import { processPhotoSchema } from "../model/processPhoto";

const aboutSchema = z.object({
  /** `null` until the texts are first saved. */
  text: aboutTextSchema.nullable(),
  /** `null` until a photo is uploaded. */
  photo: photoSchema.nullable(),
  /** In the order the site shows them. */
  processPhotos: z.array(processPhotoSchema),
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
