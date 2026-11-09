import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { FormEvent, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Tagged } from "@/shared/api/http";
import { HttpError } from "@/shared/api/httpError";
import { useSavedForm } from "@/shared/ui/edit-form";

const toast = vi.hoisted(() => ({ showErrorToast: vi.fn(), showSuccessToast: vi.fn() }));

vi.mock("@/shared/ui/toast", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...toast,
}));

interface Values {
  name: string;
}

const initial: Tagged<Values> = { data: { name: "Холст" }, etag: '"read"' };

type Save = (values: Values, etag: string) => Promise<Tagged<Values>>;

beforeEach(() => {
  vi.clearAllMocks();
});

function setUp(save: Save) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  const { result } = renderHook(
    () => {
      const form = useForm<Values>({ defaultValues: initial.data });
      const savedForm = useSavedForm({
        form,
        initial,
        save,
        toValues: (data) => data,
        toastId: "values-save",
      });

      return { form, ...savedForm };
    },
    { wrapper },
  );

  return result;
}

const submitEvent = { persist() {}, preventDefault() {} } as unknown as FormEvent<HTMLFormElement>;

async function edit(result: ReturnType<typeof setUp>, name: string) {
  await act(async () => result.current.form.setValue("name", name, { shouldDirty: true }));
}

async function submit(result: ReturnType<typeof setUp>) {
  await act(async () => result.current.editForm.onSubmit(submitEvent));
}

describe("useSavedForm", () => {
  it("sends the changes with the ETag of the base, then starts from the saved resource", async () => {
    const save = vi.fn<Save>((values) => Promise.resolve({ data: values, etag: '"saved"' }));
    const result = setUp(save);

    await edit(result, "Масло");
    await submit(result);
    await edit(result, "Акварель");
    await submit(result);

    expect(save.mock.calls).toEqual([
      [{ name: "Масло" }, '"read"'],
      [{ name: "Акварель" }, '"saved"'],
    ]);
    expect(result.current.saved).toEqual({ data: { name: "Акварель" }, etag: '"saved"' });
    expect(result.current.editForm.hasUnsavedChanges).toBe(false);
  });

  it("sends nothing without changes", async () => {
    const save = vi.fn<Save>();
    const result = setUp(save);

    await submit(result);

    expect(save).not.toHaveBeenCalled();
  });

  it.each([500, 412])(
    "keeps the changes and the base after a save failed with %i",
    async (status) => {
      const result = setUp(() => Promise.reject(new HttpError(status)));

      await edit(result, "Масло");
      await submit(result);

      expect(result.current.form.getValues()).toEqual({ name: "Масло" });
      expect(result.current.saved).toBe(initial);
    },
  );
});
