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
 * The replacement takes the version there now, so it would also overwrite a change made to the
 * new resource in another tab between the two tries. That needs a lost response and a second tab
 * at once; refusing instead would leave the usual case, one tab after a lost response, on a form
 * that can no longer save.
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
