import { z } from "zod";

import type { AboutText } from "@/entities/about";

// Mirror the server rules in backend/src/modules/about/schema.ts.
export const aboutTextMaxLengths: Readonly<Record<keyof AboutText, number>> = {
  about: 500,
  biography: 2_000,
  creation: 2_000,
};

/** An empty text hides its section on the site. */
function aboutText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Не длиннее ${String(maxLength)} символов`);
}

export const aboutTextFormSchema = z.object({
  about: aboutText(aboutTextMaxLengths.about),
  biography: aboutText(aboutTextMaxLengths.biography),
  creation: aboutText(aboutTextMaxLengths.creation),
});

export type AboutTextFormValues = z.infer<typeof aboutTextFormSchema>;
