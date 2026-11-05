import { deleteImageFilesOrWarn, type StoredImage } from "#shared/images/stored-image";
import { publishUpload } from "#shared/images/uploads";

/** The files of a save in progress. */
export interface ImageFiles {
  /** Copies an upload into a new version under `folder`; the copy goes if the save fails. */
  publish(uploadId: string, folder: string): Promise<StoredImage>;
  /** Names a folder the saved content no longer uses; it goes once the save is done. */
  removeAfterSave(folder: string): void;
}

/**
 * Saves content with its image files, in the order that never leaves the site with a link to a
 * missing file: `save` copies the new files and writes the content, and only then are the replaced
 * files removed. If it fails, the content stays as it was and the copies are removed. The uploads
 * stay until the bucket deletes them, so a save repeated after a lost response can still use them.
 */
export async function saveWithImages<T>(save: (files: ImageFiles) => Promise<T>): Promise<T> {
  const copies: string[] = [];
  const replaced: string[] = [];

  const files: ImageFiles = {
    async publish(uploadId, folder) {
      const image = await publishUpload(uploadId, folder);

      copies.push(`${folder}/${image.version}`);
      return image;
    },
    removeAfterSave(folder) {
      replaced.push(folder);
    },
  };

  let result: T;

  try {
    result = await save(files);
  } catch (error) {
    await Promise.all(copies.map(deleteImageFilesOrWarn));
    throw error;
  }

  await Promise.all(replaced.map(deleteImageFilesOrWarn));

  return result;
}
