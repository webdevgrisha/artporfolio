import { HttpError } from "./httpError";

interface CreateOnceParams<TSaved> {
  /** Creates the resource at the id the client picked; refused with 412 when it already exists. */
  create: () => Promise<TSaved>;
  /** Reads the ETag of the resource as it is now. */
  fetchEtag: () => Promise<string>;
  /** Replaces the resource made from the version with the ETag. */
  replace: (etag: string) => Promise<TSaved>;
}

/**
 * Creates a resource at an id the client picked. A try may create it even though its response is
 * lost: the next try then finds it there (412) and replaces it, so it is neither lost nor doubled.
 */
export async function createOnce<TSaved>({
  create,
  fetchEtag,
  replace,
}: CreateOnceParams<TSaved>): Promise<TSaved> {
  try {
    return await create();
  } catch (error) {
    if (!(error instanceof HttpError && error.status === 412)) throw error;
  }

  return replace(await fetchEtag());
}
