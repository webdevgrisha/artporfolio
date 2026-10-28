import { randomUUID } from "node:crypto";

import { getStorage } from "firebase-admin/storage";

import { firebaseApp } from "#services/firebaseApp";

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

/** A Firebase download URL: anyone with it can read the file, whatever the Storage rules say. */
function downloadUrl(path: string, token: string): string {
  const bucket = encodeURIComponent(storageBucket().name);

  return `${downloadHost()}/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

/** Saves a file that only the backend can read. */
export async function saveFile(path: string, data: Buffer, metadata: FileMetadata): Promise<void> {
  await storageBucket().file(path).save(data, { metadata, resumable: false });
}

/** Saves a file that anyone can read through the returned download URL. */
export async function saveDownloadableFile(
  path: string,
  data: Buffer,
  metadata: FileMetadata,
): Promise<string> {
  const token = randomUUID();

  await storageBucket()
    .file(path)
    .save(data, {
      metadata: { ...metadata, metadata: { firebaseStorageDownloadTokens: token } },
      resumable: false,
    });

  return downloadUrl(path, token);
}

export async function deleteFolder(path: string): Promise<void> {
  await storageBucket().deleteFiles({ prefix: `${path}/` });
}
