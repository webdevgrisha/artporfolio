import { z } from "zod";

export const authUserSchema = z.object({
  email: z.email().nullable(),
  uid: z.string().min(1),
});

export type AuthUser = z.infer<typeof authUserSchema>;
