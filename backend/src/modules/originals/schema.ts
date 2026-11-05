import { z } from "zod";

/**
 * The path of an original in Cloud Storage, as storage.ts → originalUrl puts it into the URL:
 * folders named by ids, then the file. Nothing else in the bucket can be read through it.
 */
const originalPathSchema = z.string().regex(/^(?:[\w-]+\/)+original\.(?:jpeg|png)$/);

/** The path parameters of a request for an original: the segments of its path in the bucket. */
export const originalParamsSchema = z.object({
  path: z
    .array(z.string())
    .transform((segments) => segments.join("/"))
    .pipe(originalPathSchema),
});

export type OriginalParams = z.input<typeof originalParamsSchema>;
