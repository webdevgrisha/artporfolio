import type { UploadedFile } from "#middleware/upload";
import type { AuthUser } from "#services/auth";

declare global {
  namespace Express {
    interface Locals {
      /** Set by the requireAuth middleware. */
      auth?: AuthUser;
    }

    interface Request {
      /** Set by the parseUpload middleware. */
      file?: UploadedFile;
      /** The unparsed body. Cloud Functions reads the request before Express gets it. */
      rawBody?: Buffer;
    }
  }
}
