import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type AboutText, aboutQuery, updateAboutText } from "@/entities/about";
import { getCsrfToken } from "@/shared/api/csrf";

/**
 * Replaces all texts, then loads the About page again. That happens after a failed save too: a
 * request that failed may still have changed the texts on the server.
 */
export function useSaveAboutText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: AboutText) =>
      updateAboutText({ csrfToken: await getCsrfToken(), text }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: aboutQuery.queryKey }),
  });
}
