import { z } from "zod";

export const loginBodySchema = z
  .object({
    idToken: z.string().trim().min(1),
  })
  .strict();

export type LoginBody = z.infer<typeof loginBodySchema>;

/** The signed-in admin. */
export interface AuthUser {
  email: string | null;
  uid: string;
}

/** Who reads a public resource: the admin sees what is hidden from the visitors too. */
export type Reader = "admin" | "visitor";
