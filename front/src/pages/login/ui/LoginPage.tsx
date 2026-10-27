import { useActionData, useNavigation, useSearchParams, useSubmit } from "react-router";

import { LoginForm, type LoginFormValues } from "@/features/login";
import { documentTitle } from "@/shared/lib/documentTitle";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { type loginAction, redirectToField } from "../model/loginRoute";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const actionData = useActionData<typeof loginAction>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  function handleSubmit(values: LoginFormValues) {
    void submit(
      { ...values, [redirectToField]: searchParams.get(redirectToField) ?? "" },
      { method: "post" },
    );
  }

  return (
    <main className={styles.root}>
      <title>{documentTitle("Вход")}</title>
      <VisuallyHidden as="h1">Вход в админ-панель</VisuallyHidden>
      <LoginForm
        isSubmitting={navigation.formData !== undefined}
        onSubmit={handleSubmit}
        submitError={actionData?.error}
      />
    </main>
  );
}
