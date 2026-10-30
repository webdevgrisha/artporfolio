import type { RequestHandler } from "express";

import type { UploadResponse } from "#modules/uploads/schema";
import { saveUpload } from "#shared/images/uploads";
import { uploadedFile } from "#shared/middleware/upload";

export const createUpload: RequestHandler<object, UploadResponse> = async (request, response) => {
  const id = await saveUpload(uploadedFile(request));

  response.status(201).json({ upload: { id } });
};
