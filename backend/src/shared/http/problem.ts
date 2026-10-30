import { z } from "zod";

/** One invalid value of a request body. */
export const invalidFieldSchema = z.object({
  detail: z.string(),
  /** JSON Pointer (RFC 6901) to the value, in URI fragment form, such as "#/alt". */
  pointer: z.string(),
});

/** An error response body as defined by RFC 9457, Problem Details for HTTP APIs. */
export const problemDetailsSchema = z.object({
  /** "about:blank" means the status code says all there is: the title is its reason phrase. */
  type: z.literal("about:blank"),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  /** What went wrong in this occurrence; absent on 500. */
  detail: z.string().optional(),
  /** Every invalid value of the request body; present only on 400 for a body. */
  errors: z.array(invalidFieldSchema).optional(),
});

export type InvalidField = z.infer<typeof invalidFieldSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
