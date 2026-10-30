import { z } from "zod";

import { http } from "@/shared/api/http";
import { photoSchema } from "@/shared/api/photo";

import { aboutTextSchema } from "../model/aboutText";

const aboutSchema = z.object({
  /** Every text is empty until the texts are first saved. */
  text: aboutTextSchema,
  /** `null` until a photo is uploaded. */
  photo: photoSchema.nullable(),
});

export type About = z.infer<typeof aboutSchema>;

interface GetAboutParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

export async function getAbout({ signal }: GetAboutParams): Promise<About> {
  return http.get({
    path: "/about",
    schema: aboutSchema,
    signal,
  });
}
