import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import {
  listPhotoSchema,
  photoListBodySchema,
  storedListPhotoSchema,
} from "#shared/images/photo-list";

/** The most photos one project may have; raise it when the artist needs more. */
export const maxProjectPhotos = 20;

const projectIdSchema = z.uuid();

/** The path parameters of a request about one project. */
export const projectParamsSchema = z.object({
  id: projectIdSchema,
});

/**
 * A project as the client sends it, to create one or to replace a saved one. Every field is sent;
 * an empty link is not shown on the site.
 */
export const projectBodySchema = z.strictObject({
  /** The name in the list of projects, so it cannot be empty. */
  title: z.string().trim().min(1).max(100),
  /**
   * What the project is about, which the visitor reads beside it, so it cannot be empty. Plain
   * text: no HTML or Markdown. Paragraphs are separated by a blank line.
   */
  description: z.string().trim().min(1).max(2_000),
  /** Unlike z.url(), rejects "javascript:" links, which would run code when a visitor clicks them. */
  link: z
    .string()
    .trim()
    .max(2_048)
    .pipe(z.union([z.literal(""), z.httpUrl()])),
  /**
   * In the order the site shows them; a saved photo left out is deleted. The site opens a project
   * into its photos, so it needs at least one.
   */
  photos: photoListBodySchema(maxProjectPhotos).min(1),
});

/**
 * A project as stored in Firestore, in its own document of the `projects` collection. Only the
 * shape is checked: the rules above apply when a project is saved, so tightening a rule later
 * never makes a saved project unreadable.
 */
export const storedProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string(),
  photos: z.array(storedListPhotoSchema),
  /** The place in the list: the site shows the projects by ascending position. */
  position: z.number(),
  /** Set by the server when the project is created. */
  createdAt: z.instanceof(Timestamp),
  /** Set by the server whenever the admin saves the project; moving it does not count. */
  updatedAt: z.instanceof(Timestamp),
});

/** A project as the API returns it. */
export const projectSchema = z.object({
  id: projectIdSchema,
  title: z.string(),
  description: z.string(),
  link: z.string(),
  photos: z.array(listPhotoSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/** The order of the projects: every project, once, in the order the site shows them. */
export const projectsOrderBodySchema = z.strictObject({
  ids: z
    .array(projectIdSchema)
    .refine((ids) => new Set(ids).size === ids.length, "Each id must appear once"),
});

export const projectsOrderSchema = z.object({ ids: z.array(projectIdSchema) });

export const projectsResponseSchema = z.object({
  /** In the order the site shows them. */
  projects: z.array(projectSchema),
});

export type ProjectParams = z.infer<typeof projectParamsSchema>;
export type ProjectBody = z.infer<typeof projectBodySchema>;
export type StoredProject = z.infer<typeof storedProjectSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectsOrder = z.infer<typeof projectsOrderSchema>;
export type ProjectsResponse = z.infer<typeof projectsResponseSchema>;
