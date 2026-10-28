import { randomUUID } from "node:crypto";

import { getStorage } from "firebase-admin/storage";

import { firebaseApp } from "#shared/firebase/app";

/** A file readable through a Firebase download URL, which needs the file's path and token. */
export interface DownloadableFile {
  path: string;
  token: string;
}

// A type alias, not an interface: the Storage SDK expects metadata with an index signature.
export type FileMetadata = {
  cacheControl?: string;
  contentType: string;
};

/** The project's default Cloud Storage bucket. */
export function storageBucket() {
  return getStorage(firebaseApp()).bucket();
}

function downloadHost(): string {
  const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;

  return emulatorHost ? `http://${emulatorHost}` : "https://firebasestorage.googleapis.com";
}

/**
 * A Firebase download URL: anyone with it can read the file, whatever the Storage rules say.
 * URLs are built when files are read, not stored, so the images can later be served from another
 * host, such as a CDN, by changing only this function.
 */
export function downloadUrl({ path, token }: DownloadableFile): string {
  const bucket = encodeURIComponent(storageBucket().name);

  return `${downloadHost()}/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

/** Saves a file that only the backend can read. */
export async function saveFile(path: string, data: Buffer, metadata: FileMetadata): Promise<void> {
  await storageBucket().file(path).save(data, { metadata, resumable: false });
}

/** Saves a file that anyone can read through its download URL; see downloadUrl. */
export async function saveDownloadableFile(
  path: string,
  data: Buffer,
  metadata: FileMetadata,
): Promise<DownloadableFile> {
  const token = randomUUID();

  await storageBucket()
    .file(path)
    .save(data, {
      metadata: { ...metadata, metadata: { firebaseStorageDownloadTokens: token } },
      resumable: false,
    });

  return { path, token };
}

export async function deleteFolder(path: string): Promise<void> {
  await storageBucket().deleteFiles({ prefix: `${path}/` });
}
