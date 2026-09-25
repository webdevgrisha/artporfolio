import { z } from "zod";

export const authUserSchema = z.object({
  email: z.email().nullable(),
  uid: z.string().min(1),
});

export const createSessionResponseSchema = z.object({
  user: authUserSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
