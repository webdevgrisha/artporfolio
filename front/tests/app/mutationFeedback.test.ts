import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { showMutationFeedback } from "@/app/mutationFeedback";
import { HttpError } from "@/shared/api/httpError";
import type { MutationFeedback } from "@/shared/api/queryClient";
import { showErrorToast, showSuccessToast } from "@/shared/ui/toast";

vi.mock("@/shared/ui/toast", () => ({
  savedMessage: "Изменения сохранены",
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

const queryClient = new QueryClient();
let unsubscribe: () => void;

beforeEach(() => {
  vi.mocked(showErrorToast).mockReset();
  vi.mocked(showSuccessToast).mockReset();
  unsubscribe = showMutationFeedback(queryClient);
});

afterEach(() => {
  unsubscribe();
});

function runMutation(mutationFn: () => Promise<unknown>, feedback?: MutationFeedback) {
  return queryClient
    .getMutationCache()
    .build(queryClient, { meta: feedback ? { feedback } : undefined, mutationFn })
    .execute(undefined);
}

describe("showMutationFeedback", () => {
  const feedback: MutationFeedback = {
    getErrorMessage: (error) =>
      error instanceof HttpError ? `failed ${String(error.status)}` : "",
    toastId: "thing-save",
  };

  it("says a change is saved, by default as a form save", async () => {
    await runMutation(() => Promise.resolve(), feedback);

    expect(showSuccessToast).toHaveBeenCalledWith("Изменения сохранены", { id: "thing-save" });
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("says the success message of the change", async () => {
    await runMutation(() => Promise.resolve(), { ...feedback, successMessage: "Фото удалено" });

    expect(showSuccessToast).toHaveBeenCalledWith("Фото удалено", { id: "thing-save" });
  });

  it("says why a change failed, and the change still rejects", async () => {
    await expect(runMutation(() => Promise.reject(new HttpError(400)), feedback)).rejects.toThrow();

    expect(showErrorToast).toHaveBeenCalledWith("failed 400", { id: "thing-save" });
    expect(showSuccessToast).not.toHaveBeenCalled();
  });

  it("shows nothing for a change without feedback", async () => {
    await runMutation(() => Promise.resolve());
    await expect(runMutation(() => Promise.reject(new HttpError(400)))).rejects.toThrow();

    expect(showSuccessToast).not.toHaveBeenCalled();
    expect(showErrorToast).not.toHaveBeenCalled();
  });
});
