import { z } from "zod";

export const loginBodySchema = z
  .object({
    idToken: z.string().trim().min(1),
  })
  .strict();

/** The signed-in admin. */
export const userSchema = z.object({
  email: z.email().nullable(),
  uid: z.string(),
});

export const userResponseSchema = z.object({ user: userSchema });

export type LoginBody = z.infer<typeof loginBodySchema>;
export type AuthUser = z.infer<typeof userSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
