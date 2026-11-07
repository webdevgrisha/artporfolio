import { pipeline } from "node:stream/promises";

import type { RequestHandler } from "express";

import type { OriginalParams } from "#modules/originals/schema";
import { openFile } from "#shared/firebase/storage";
import { NotFoundError } from "#shared/http/errors";

/** Sends the original as a download, without keeping it in a cache: it is the admin's alone. */
export const downloadOriginal: RequestHandler<OriginalParams> = async (request, response) => {
  const file = await openFile(request.params.path);

  if (!file) {
    throw new NotFoundError();
  }

  response.status(200).set({
    "Cache-Control": "private, no-store",
    "Content-Length": String(file.size),
    "Content-Type": file.contentType,
    ...(file.contentDisposition && { "Content-Disposition": file.contentDisposition }),
  });
  await pipeline(file.stream, response);
};
