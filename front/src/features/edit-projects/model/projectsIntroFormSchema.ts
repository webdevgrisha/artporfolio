import { z } from "zod";

// Mirrors the server rule in backend/src/modules/projects-intro/schema.ts.
export const maxIntroLength = 1_000;

export const projectsIntroFormSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Введите текст")
    .max(maxIntroLength, `Не длиннее ${String(maxIntroLength)} символов`),
});

export type ProjectsIntroFormValues = z.infer<typeof projectsIntroFormSchema>;
