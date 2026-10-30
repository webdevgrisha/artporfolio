import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";
import { type MutationFeedback, queryClient } from "@/shared/api/queryClient";
import { showErrorToast, showSuccessToast } from "@/shared/ui/toast";

vi.mock("@/shared/ui/toast", () => ({
  savedMessage: "Изменения сохранены",
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(showErrorToast).mockReset();
  vi.mocked(showSuccessToast).mockReset();
});

function shouldRetry(failureCount: number, error: Error): boolean {
  const { retry } = queryClient.getDefaultOptions().queries ?? {};
  if (typeof retry !== "function") throw new Error("Expected a retry function");

  return Boolean(retry(failureCount, error));
}

function runMutation(mutationFn: () => Promise<unknown>, feedback?: MutationFeedback) {
  return queryClient
    .getMutationCache()
    .build(queryClient, { meta: feedback ? { feedback } : undefined, mutationFn })
    .execute(undefined);
}

describe("queryClient", () => {
  it.each([400, 401, 404])("does not retry a query that failed with %d", (status) => {
    expect(shouldRetry(0, new HttpError(status))).toBe(false);
  });

  it.each([
    ["a server error", new HttpError(503)],
    ["a lost connection", new NetworkError(new TypeError())],
  ])("retries %s twice", (_name, error) => {
    expect(shouldRetry(0, error)).toBe(true);
    expect(shouldRetry(1, error)).toBe(true);
    expect(shouldRetry(2, error)).toBe(false);
  });
});

describe("mutation feedback", () => {
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

  it("says why a change failed and still rejects", async () => {
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
