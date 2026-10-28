import busboy from "busboy";
import type { Request, RequestHandler } from "express";

import { BadRequestError, PayloadTooLargeError } from "#shared/http/errors";

/** The longest file name most file systems allow. */
export const maxFileNameLength = 255;

export interface UploadedFile {
  data: Buffer;
  name: string;
  size: number;
}

interface UploadOptions {
  /** Name of the form field that holds the file. */
  fileField: string;
  maxFileSize: number;
}

interface MultipartBody {
  fields: Record<string, string>;
  file: UploadedFile | undefined;
}

function createParser(request: Request, { maxFileSize }: UploadOptions) {
  try {
    return busboy({
      // Lets file names contain non-Latin characters, such as Cyrillic.
      defParamCharset: "utf8",
      headers: request.headers,
      limits: { fields: 10, fileSize: maxFileSize, files: 1 },
    });
  } catch {
    // busboy throws when the Content-Type is not multipart/form-data.
    throw new BadRequestError("Expected a multipart/form-data body");
  }
}

function fileError(field: string, fileName: string, options: UploadOptions) {
  if (field !== options.fileField) {
    return new BadRequestError(`Unexpected file field "${field}"`);
  }

  if (fileName.length > maxFileNameLength) {
    return new BadRequestError("The file name is too long");
  }

  return undefined;
}

function readMultipart(request: Request, options: UploadOptions): Promise<MultipartBody> {
  const parser = createParser(request, options);

  return new Promise((resolve, reject) => {
    // No prototype: field names come from the client, and "__proto__" must stay a plain key.
    const fields: Record<string, string> = Object.create(null);
    let file: UploadedFile | undefined;

    parser.on("field", (name, value) => {
      fields[name] = value;
    });

    parser.on("file", (field, stream, { filename = "" }) => {
      const error = fileError(field, filename, options);

      if (error) {
        stream.resume();
        reject(error);
        return;
      }

      const chunks: Buffer[] = [];

      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("limit", () => reject(new PayloadTooLargeError("The file is too large")));
      stream.on("end", () => {
        const data = Buffer.concat(chunks);
        file = { data, name: filename, size: data.length };
      });
    });

    parser.on("filesLimit", () => reject(new BadRequestError("Only one file is allowed")));
    parser.on("fieldsLimit", () => reject(new BadRequestError("Too many form fields")));
    parser.on("error", () => reject(new BadRequestError("Invalid multipart/form-data body")));
    parser.on("close", () => resolve({ fields, file }));

    // Cloud Functions has already read the body; locally it is still a stream.
    if (request.rawBody) {
      parser.end(request.rawBody);
    } else {
      request.pipe(parser);
    }
  });
}

/**
 * Parses a multipart/form-data body with exactly one file. The file goes to request.file and the
 * text fields to request.body, so validateBody can check them.
 */
export function parseUpload(options: UploadOptions): RequestHandler {
  return async (request, _response, next) => {
    const { fields, file } = await readMultipart(request, options);

    if (!file) {
      throw new BadRequestError(`A file is required in the "${options.fileField}" field`);
    }

    request.body = fields;
    request.file = file;
    next();
  };
}

/** The file parsed by parseUpload, for handlers mounted after it. */
export function uploadedFile(request: Pick<Request, "file">): UploadedFile {
  if (!request.file) {
    throw new Error("parseUpload must run before the handler that reads the file");
  }

  return request.file;
}
