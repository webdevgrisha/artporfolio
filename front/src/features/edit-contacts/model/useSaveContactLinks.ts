import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type Contacts, contactsQuery, updateContacts } from "@/entities/contacts";

/**
 * Replaces all links, then loads the contacts again. That happens after a failed save too: a
 * request that failed may still have changed the contacts on the server.
 */
export function useSaveContactLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contacts: Contacts) => updateContacts({ contacts }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: contactsQuery.queryKey }),
  });
}
