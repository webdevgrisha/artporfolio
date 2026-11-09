import { z } from "zod";

export const translationStateSchema = z.object({
  /** Why nothing is translated for now, or null while everything works. */
  halted: z.enum(["limit", "key", "paused"]).nullable(),
  /** How much of the plan is used; null when DeepL does not say. */
  usage: z.object({ limit: z.number(), used: z.number() }).nullable(),
});

export type TranslationState = z.infer<typeof translationStateSchema>;
