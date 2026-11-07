import { zodResolver } from "@hookform/resolvers/zod";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  type WorkFormValues,
  workMaxLengths,
} from "@/features/edit-gallery/work/model/workFormSchema";
import { emptyWorkFormValues } from "@/features/edit-gallery/work/model/workFormValues";
import { workLanguageFields } from "@/features/edit-gallery/work/model/workTranslation";
import type { TargetLanguage } from "@/shared/config/languages";
import { translationValuesSchema } from "@/shared/lib/translationsForm";
import type { TranslatedField } from "@/shared/ui/language-form";
import { TranslationFields } from "@/shared/ui/language-form/TranslationFields";

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

function Form({
  fields = workLanguageFields,
  language = "en",
  onSave,
}: {
  fields?: readonly TranslatedField[];
  language?: TargetLanguage;
  onSave: (saved: WorkFormValues) => void;
}) {
  const form = useForm<WorkFormValues>({
    defaultValues: { ...values, photos: [{ alt: "Набросок" }] as WorkFormValues["photos"] },
    resolver: zodResolver(schema) as never,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSave)}>
        <TranslationFields
          fields={fields}
          isSaving={false}
          language={language}
          saved={{ en: { title: { status: "edited", text: "Elephant" } } }}
        />
        <button type="submit">Сохранить</button>
      </form>
    </FormProvider>
  );
}

describe("TranslationFields", () => {
  it("shows each text with its status and the Russian text", () => {
    render(<Form onSave={vi.fn()} />);

    expect(screen.getByLabelText("Название")).toHaveProperty("value", "Elephant");
    expect(screen.getByText("Исправлено вручную. Оригинал: Слон")).toBeDefined();
  });

  it("locks a field with no Russian text", () => {
    render(<Form onSave={vi.fn()} />);

    expect(screen.getByLabelText("Город")).toHaveProperty("disabled", true);
  });

  it("empties one text to translate it anew, leaving the others", async () => {
    const onSave = vi.fn();

    render(<Form onSave={onSave} />);

    const title = screen.getByLabelText("Название").closest("div");

    fireEvent.click(within(title as HTMLElement).getByRole("button"));

    expect(await screen.findByText("Переведётся при сохранении. Оригинал: Слон")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]?.[0].translations.en).toEqual({
      alt: "Elephant at dusk",
      city: "",
      description: "Oil on canvas.",
      title: "",
    });
  });

  it("empties the description too", async () => {
    render(<Form onSave={vi.fn()} />);

    const description = screen.getByLabelText("Описание").closest("div");

    fireEvent.click(within(description as HTMLElement).getByRole("button"));

    await waitFor(() => expect(screen.getByLabelText("Описание")).toHaveProperty("value", ""));
  });

  it("reads the Russian text of a row of a list by its path", () => {
    render(
      <Form fields={[{ field: "row", label: "Масло", source: "photos.0.alt" }]} onSave={vi.fn()} />,
    );

    expect(screen.getByText("Переведётся при сохранении. Оригинал: Набросок")).toBeDefined();
  });

  it("lays out Arabic from right to left", () => {
    const { container } = render(<Form language="ar" onSave={vi.fn()} />);

    expect(container.querySelector('[dir="rtl"]')).not.toBeNull();
  });

  it("submits the form with a locked field", async () => {
    const onSave = vi.fn();

    render(<Form onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]?.[0].translations.en.title).toBe("Elephant");
  });
});
