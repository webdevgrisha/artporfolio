import { z } from "zod";

import { processPhotoSchema } from "#modules/about/process-photos/schema";
import { photoSchema } from "#shared/images/photo";

/** Plain text: no HTML or Markdown. Paragraphs are separated by a blank line. */
function aboutText(maxLength: number, description: string) {
  return z
    .string()
    .trim()
    .min(1)
    .max(maxLength)
    .meta({ description: `${description} Plain text; paragraphs are separated by a blank line.` });
}

const aboutTextFields = {
  about: aboutText(500, "Short introduction next to the photo."),
  biography: aboutText(2_000, "The «Biography» section."),
  creation: aboutText(2_000, "The «Artistic creation» section."),
};

/** The texts of the About page. Every text is required. */
export const aboutTextSchema = z.object(aboutTextFields).meta({ id: "AboutText" });

export const aboutTextBodySchema = z.strictObject(aboutTextFields);

/**
 * The texts as stored in Firestore. Only their shape is checked: the limits above apply when the
 * texts are saved, so tightening a limit later never makes saved texts unreadable.
 */
export const storedAboutTextSchema = z.object({
  about: z.string(),
  biography: z.string(),
  creation: z.string(),
});

export const aboutResponseSchema = z.object({
  text: aboutTextSchema.nullable().meta({ description: "`null` until the texts are first saved." }),
  photo: photoSchema.nullable().meta({ description: "«My photo»; `null` until one is uploaded." }),
  processPhotos: z
    .array(processPhotoSchema)
    .meta({ description: "In the order the site shows them." }),
});

export const aboutTextResponseSchema = z.object({ text: aboutTextSchema });

export type AboutText = z.infer<typeof aboutTextSchema>;
export type AboutResponse = z.infer<typeof aboutResponseSchema>;
export type AboutTextResponse = z.infer<typeof aboutTextResponseSchema>;
