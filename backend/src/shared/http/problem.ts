/** One invalid value of a request body. */
export interface InvalidField {
  detail: string;
  /** JSON Pointer (RFC 6901) to the value, in URI fragment form, such as "#/alt". */
  pointer: string;
}

/** An error response body as defined by RFC 9457, Problem Details for HTTP APIs. */
export interface ProblemDetails {
  /** "about:blank" means the status code says all there is: the title is its reason phrase. */
  type: "about:blank";
  title: string;
  status: number;
  /** What went wrong in this occurrence; absent on 500. */
  detail?: string;
  /** Every invalid value of the request body; present only on 400 for a body. */
  errors?: InvalidField[];
}
