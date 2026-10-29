import { z } from "zod";

/** One invalid value of a request body. */
export const invalidFieldSchema = z
  .object({
    detail: z.string().meta({ description: "What is wrong with the value." }),
    pointer: z.string().meta({
      description: "JSON Pointer (RFC 6901) to the value, in URI fragment form.",
      example: "#/alt",
    }),
  })
  .meta({ id: "InvalidField" });

/** An error response body as defined by RFC 9457, Problem Details for HTTP APIs. */
export const problemDetailsSchema = z
  .object({
    type: z.literal("about:blank").meta({
      description: "Always `about:blank`: the status code says all there is.",
    }),
    title: z.string().meta({
      description: "The reason phrase of the status code.",
      example: "Bad Request",
    }),
    status: z.number().int().min(400).max(599),
    detail: z.string().optional().meta({
      description: "What went wrong in this occurrence. Absent on `500`.",
      example: "Invalid request body",
    }),
    errors: z.array(invalidFieldSchema).optional().meta({
      description: "Every invalid value of the request body. Present only on `400` for a body.",
    }),
  })
  .meta({ id: "ProblemDetails" });

export type InvalidField = z.infer<typeof invalidFieldSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
