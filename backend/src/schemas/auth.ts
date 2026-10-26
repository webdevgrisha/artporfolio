import { z } from "zod";

export const loginBodySchema = z
  .object({
    idToken: z.string().trim().min(1),
  })
  .strict();

export type LoginBody = z.infer<typeof loginBodySchema>;
