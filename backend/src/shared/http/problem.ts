/** One invalid value of a request: in its body, named by `pointer`, or in its query, by `parameter`. */
export type InvalidField =
  | {
      detail: string;
      /** JSON Pointer (RFC 6901) to the value in the body, in URI fragment form, such as "#/alt". */
      pointer: string;
    }
  | {
      detail: string;
      /** The name of the query parameter, such as "lang". */
      parameter: string;
    };

/** An error response body as defined by RFC 9457, Problem Details for HTTP APIs. */
export interface ProblemDetails {
  /** "about:blank" means the status code says all there is: the title is its reason phrase. */
  type: "about:blank";
  title: string;
  status: number;
  /** What went wrong in this occurrence; absent on 500. */
  detail?: string;
  /** Every invalid value of the request body or query; present only on 400 for those. */
  errors?: InvalidField[];
}
