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

export type LoginBody = z.infer<typeof loginBodySchema>;
export type AuthUser = z.infer<typeof userSchema>;

/** Who reads a public resource: the admin sees what is hidden from the visitors too. */
export type Reader = "admin" | "visitor";
