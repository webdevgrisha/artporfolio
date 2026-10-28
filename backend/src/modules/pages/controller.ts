import type { RequestHandler } from "express";

import type { PageParams } from "#modules/pages/schema";
import { deletePageHero, getPages, savePageHero } from "#modules/pages/service";
import { uploadedFile } from "#shared/middleware/upload";

export const readPages: RequestHandler = async (_request, response) => {
  const pages = await getPages();

  response.status(200).json({ pages });
};

export const uploadHero: RequestHandler<PageParams> = async (request, response) => {
  const hero = await savePageHero(request.params.page, uploadedFile(request));

  response.status(200).json({ hero });
};

export const deleteHero: RequestHandler<PageParams> = async (request, response) => {
  await deletePageHero(request.params.page);

  response.status(204).end();
};
