import { z } from "zod";

import { uploadIdSchema } from "#shared/images/uploads";

/** An upload takes only the file: other form fields are rejected. */
export const uploadBodySchema = z.strictObject({});

export const uploadResponseSchema = z.object({
  /** Valid for a day; send the id in the request that uses the photo. */
  upload: z.object({ id: uploadIdSchema }),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
