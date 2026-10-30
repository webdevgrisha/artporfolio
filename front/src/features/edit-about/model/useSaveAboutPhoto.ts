import { useMutation, useQueryClient } from "@tanstack/react-query";

import { aboutQuery } from "@/entities/about";

import { saveAboutPhoto } from "./saveAboutPhoto";

/**
 * Saves a change of «Моё фото», then loads the About page again. That happens after a failed save
 * too: a request that failed may still have changed the photo on the server.
 */
export function useSaveAboutPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveAboutPhoto,
    onSettled: () => queryClient.invalidateQueries({ queryKey: aboutQuery.queryKey }),
  });
}
