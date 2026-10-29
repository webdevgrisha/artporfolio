import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { flushSync } from "react-dom";
import { type FieldErrors, type FieldPath, FormProvider, useForm } from "react-hook-form";
import { useRevalidator } from "react-router";

import type { About } from "@/entities/about";
import { toSavedPhotoValues } from "@/shared/lib/photoForm";
import { EditForm } from "@/shared/ui/edit-form";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { Tab, TabList, TabPanel, Tabs } from "@/shared/ui/tabs";
import { showSaveResultToast } from "@/shared/ui/toast";

import { getAboutChanges } from "../model/aboutChanges";
import { type AboutFormValues, aboutFormSchema } from "../model/aboutFormSchema";
import { toAboutFormValues, toProcessPhotoRows } from "../model/aboutFormValues";
import { aboutTextFields } from "../model/aboutTextFields";
import { saveAbout } from "../model/saveAbout";
import { AboutTextFields } from "./AboutTextFields";
import { ProcessPhotoFields } from "./ProcessPhotoFields";

// One toast for the result of saving: a new result replaces the previous one.
const saveToastId = "about-save";

type AboutTab = "photo" | "process" | "text";

/**
 * The fields that can be invalid, in display order, with the tab that shows each of them. The
 * process photos come last, on their own tab.
 */
const validatedFields: readonly (readonly [keyof AboutFormValues, AboutTab])[] = [
  ...aboutTextFields.map((field) => [field.name, "text"] as const),
  ["photoAlt", "photo"],
];

interface EditAboutFormProps {
  /** The About page as stored on the server, from the route loader. */
  about: About;
  className?: string;
}

export function EditAboutForm({ about, className }: EditAboutFormProps) {
  const form = useForm<AboutFormValues>({
    defaultValues: toAboutFormValues(about),
    resolver: zodResolver(aboutFormSchema),
    // A field on a hidden tab cannot take the focus: handleInvalid shows its tab first.
    shouldFocusError: false,
  });
  const {
    formState: { dirtyFields, isDirty, isSubmitting },
    getValues,
    handleSubmit,
    reset,
    resetField,
    setFocus,
    setValue,
  } = form;
  const [tab, setTab] = React.useState<AboutTab>("text");
  const { revalidate } = useRevalidator();

  async function saveChanges(values: AboutFormValues) {
    const { error, photoSaved, processPhotos, textSaved } = await saveAbout(
      getAboutChanges(values, dirtyFields, about),
      about.processPhotos,
    );

    if (textSaved || photoSaved || processPhotos?.isChanged) {
      // A saved photo gets new URLs, so the route loads the page again.
      await revalidate();
    }

    // What was saved is no longer modified; a part that failed keeps its unsaved changes.
    if (textSaved) {
      for (const field of aboutTextFields) {
        resetField(field.name, { defaultValue: values[field.name] });
      }
    }

    if (photoSaved) {
      const photoValues = toSavedPhotoValues(values);
      resetField("photo", { defaultValue: photoValues.photo });
      resetField("photoAlt", { defaultValue: photoValues.photoAlt });
    }

    if (processPhotos) {
      // The list on the server is the saved value now; rows whose change failed stay modified.
      resetField("processPhotos", { defaultValue: toProcessPhotoRows(processPhotos.photos) });
      setValue("processPhotos", processPhotos.rows, { shouldDirty: true });
    }

    showSaveResultToast(error, { id: saveToastId });
  }

  function focusField(name: FieldPath<AboutFormValues>, fieldTab: AboutTab) {
    // The tab is rendered synchronously, so its field can take the focus right away.
    flushSync(() => setTab(fieldTab));
    setFocus(name);
  }

  function handleInvalid(fieldErrors: FieldErrors<AboutFormValues>) {
    const firstInvalid = validatedFields.find(([name]) => fieldErrors[name]);
    if (firstInvalid) {
      const [name, fieldTab] = firstInvalid;
      focusField(name, fieldTab);
      return;
    }

    const invalidRow = getValues("processPhotos").findIndex(
      (_row, index) => fieldErrors.processPhotos?.[index]?.alt,
    );
    if (invalidRow !== -1) focusField(`processPhotos.${invalidRow}.alt`, "process");
  }

  return (
    // The fields of every tab read the form from the context.
    <FormProvider {...form}>
      <EditForm
        className={className}
        hasUnsavedChanges={isDirty}
        isSaving={isSubmitting}
        onRevert={() => reset()}
        onSubmit={handleSubmit(saveChanges, handleInvalid)}
      >
        <Tabs value={tab} onValueChange={setTab}>
          <TabList label="Разделы страницы «О сайте»">
            <Tab value="text">Тексты</Tab>
            <Tab value="photo">Моё фото</Tab>
            <Tab value="process">Процесс</Tab>
          </TabList>

          <TabPanel value="text">
            <AboutTextFields isSaving={isSubmitting} />
          </TabPanel>
          <TabPanel value="photo">
            <PhotoFields label="Моё фото" isSaving={isSubmitting} serverPhoto={about.photo} />
          </TabPanel>
          <TabPanel value="process">
            <ProcessPhotoFields isSaving={isSubmitting} serverPhotos={about.processPhotos} />
          </TabPanel>
        </Tabs>
      </EditForm>
    </FormProvider>
  );
}
