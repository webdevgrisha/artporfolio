import { useMutation, useQueryClient } from "@tanstack/react-query";

import { contactsQuery } from "@/entities/contacts";

import { saveContacts } from "./saveContacts";

/**
 * Saves the changed parts of the contacts, then loads them again. That happens after a failed save
 * too: a request that failed may still have changed the contacts on the server.
 */
export function useSaveContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveContacts,
    // Awaited before the save resolves, so the form resets its fields to the loaded contacts.
    onSettled: () => queryClient.invalidateQueries({ queryKey: contactsQuery.queryKey }),
  });
}
