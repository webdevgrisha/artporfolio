import { z } from "zod";

import { authUserSchema } from "@/api/auth/schemas/authUser";

export const authUserResponseSchema = z.object({
  user: authUserSchema,
});
