import type { RequestHandler } from "express";

import type {
  Section,
  SectionBody,
  SectionParams,
  SectionsResponse,
} from "#modules/gallery/sections/schema";
import {
  createSection,
  deleteSection,
  getSection,
  listSections,
  replaceSection,
} from "#modules/gallery/sections/service";
import { ifMatchHeader, isCreateOnly } from "#shared/middleware/preconditions";

export const readSections: RequestHandler<object, SectionsResponse> = async (
  _request,
  response,
) => {
  const { data, etag } = await listSections();

  response.status(200).set("ETag", etag).json({ sections: data });
};

export const readSection: RequestHandler<SectionParams, Section> = async (request, response) => {
  const { data, etag } = await getSection(request.params.id);

  response.status(200).set("ETag", etag).json(data);
};

/** Creates the section with If-None-Match: *, or replaces the version named in If-Match. */
export const putSection: RequestHandler<SectionParams, Section, SectionBody> = async (
  request,
  response,
) => {
  const { id } = request.params;

  if (isCreateOnly(request)) {
    const { data, etag } = await createSection(id, request.body);

    response.status(201).set("ETag", etag).json(data);
    return;
  }

  const { data, etag } = await replaceSection(id, request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};

export const removeSection: RequestHandler<SectionParams> = async (request, response) => {
  await deleteSection(request.params.id, ifMatchHeader(request));

  response.status(204).end();
};
