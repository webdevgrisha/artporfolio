import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type AboutText, aboutQuery, updateAboutText } from "@/entities/about";

/**
 * Replaces all texts, then loads the About page again. That happens after a failed save too: a
 * request that failed may still have changed the texts on the server.
 */
export function useSaveAboutText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: AboutText) => updateAboutText({ text }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: aboutQuery.queryKey }),
  });
}
