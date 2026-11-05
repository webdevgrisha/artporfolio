import { z } from "zod";

import { uploadIdSchema } from "#shared/images/uploads";

export const uploadResponseSchema = z.object({
  /** Valid for a day; send the id in the request that uses the photo. */
  id: uploadIdSchema,
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
