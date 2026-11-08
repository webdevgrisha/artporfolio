import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { putSavedResource } from "@/shared/api/savedResource";

const queryKey = ["resource"];

describe("putSavedResource", () => {
  it("keeps the saved version when a read begun before the save ends after it", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(queryKey, "old");
    let endRead: (data: string) => void = () => undefined;
    const oldRead = new Promise<string>((resolve) => {
      endRead = resolve;
    });
    // The cancelled read rejects; a page left before its data arrived never looks at it.
    const reading = queryClient
      .fetchQuery({ queryFn: () => oldRead, queryKey, staleTime: 0 })
      .catch(() => undefined);

    await putSavedResource(queryClient, queryKey, "new");
    endRead("old");
    await reading;

    expect(queryClient.getQueryData(queryKey)).toBe("new");
  });
});
