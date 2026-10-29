import { queryOptions } from "@tanstack/react-query";

import { getContacts } from "./getContacts";

/** The contacts with their photo as stored on the server. A save of either invalidates them. */
export const contactsQuery = queryOptions({
  queryFn: ({ signal }) => getContacts({ signal }),
  queryKey: ["contacts"],
});
