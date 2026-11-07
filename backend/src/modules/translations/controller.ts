import type { RequestHandler, Response } from "express";

import { readerOf } from "#modules/auth/middleware";
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
import { NotFoundError } from "#shared/http/errors";

/**
 * Translations are the admin's for now: they hold the texts of hidden works too. The site will read
 * them through its own resources, which know what a visitor may see.
 */
function assertAdmin(locals: Response["locals"]): void {
  if (readerOf(locals) !== "admin") {
    throw new NotFoundError("There is no such page");
  }
}

export const readStatus: RequestHandler<object, TranslationStatusResponse> = async (
  _request,
  response,
) => {
  assertAdmin(response.locals);

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
  assertAdmin(response.locals);

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
