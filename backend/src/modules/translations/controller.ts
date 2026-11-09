import type { RequestHandler } from "express";

import type {
  LanguageParams,
  ResourceParams,
  TranslationPatchBody,
} from "#modules/translations/schema";
import {
  editTranslations,
  getTranslationStatus,
  getTranslations,
  type ResourceTranslations,
  retryTranslations,
  type TranslationStatusResponse,
} from "#modules/translations/service";

export const readStatus: RequestHandler<object, TranslationStatusResponse> = async (
  _request,
  response,
) => {
  response
    .status(200)
    .set("Cache-Control", "private, no-cache")
    .json(await getTranslationStatus());
};

export const retry: RequestHandler = async (_request, response) => {
  await retryTranslations();

  response.status(202).end();
};

export const readTranslations: RequestHandler<ResourceParams, ResourceTranslations> = async (
  request,
  response,
) => {
  // The translator changes them at any moment, so no cache may keep them.
  response
    .status(200)
    .set("Cache-Control", "private, no-cache")
    .json(await getTranslations(request.params.resource));
};

export const patchTranslations: RequestHandler<
  LanguageParams,
  ResourceTranslations,
  TranslationPatchBody
> = async (request, response) => {
  const { language, resource } = request.params;

  response.status(200).json(await editTranslations(resource, language, request.body));
};
