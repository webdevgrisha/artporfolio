import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  type WorkFormValues,
  workMaxLengths,
} from "@/features/edit-gallery/work/model/workFormSchema";
import { emptyWorkFormValues } from "@/features/edit-gallery/work/model/workFormValues";
import { WorkTranslationFields } from "@/features/edit-gallery/work/ui/WorkTranslationFields";
import { translationValuesSchema } from "@/shared/lib/translationsForm";

const schema = z.looseObject({
  translations: translationValuesSchema({ ...workMaxLengths, alt: 250 }),
});

const values: WorkFormValues = {
  ...emptyWorkFormValues,
  description: "Масло, холст.",
  photoAlt: "Слон на закате",
  title: "Слон",
  translations: {
    ...emptyWorkFormValues.translations,
    en: { alt: "Elephant at dusk", city: "", description: "Oil on canvas.", title: "Elephant" },
  },
};

function Form({ onSave }: { onSave: (saved: WorkFormValues) => void }) {
  const form = useForm<WorkFormValues>({
    defaultValues: values,
    resolver: zodResolver(schema) as never,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSave)}>
        <WorkTranslationFields
          isSaving={false}
          language="en"
          saved={{ en: { title: { status: "edited", text: "Elephant" } } }}
        />
        <button type="submit">Сохранить</button>
      </form>
    </FormProvider>
  );
}

describe("WorkTranslationFields", () => {
  it("shows each text with its status and the Russian text", () => {
    render(<Form onSave={vi.fn()} />);

    expect(screen.getByLabelText("Название")).toHaveProperty("value", "Elephant");
    expect(screen.getByText("Исправлено вручную. Оригинал: Слон")).toBeDefined();
  });

  it("locks a field with no Russian text", () => {
    render(<Form onSave={vi.fn()} />);

    expect(screen.getByLabelText("Город")).toHaveProperty("disabled", true);
  });

  it("empties the texts of the language to translate them anew on save", async () => {
    const onSave = vi.fn();

    render(<Form onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Перевести заново" }));

    expect(await screen.findByText("Переведётся при сохранении. Оригинал: Слон")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]?.[0].translations.en).toEqual({
      alt: "",
      city: "",
      description: "",
      title: "",
    });
  });

  it("submits the form with a locked field", async () => {
    const onSave = vi.fn();

    render(<Form onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]?.[0].translations.en.title).toBe("Elephant");
  });
});
