import { useActionData, useNavigation, useSearchParams, useSubmit } from "react-router";

import { LoginForm, type LoginFormValues } from "@/features/login";
import { redirectToParam } from "@/shared/config/routes";
import { documentTitle } from "@/shared/lib/documentTitle";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import type { loginAction } from "../model/loginRoute";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const actionData = useActionData<typeof loginAction>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  function handleSubmit(values: LoginFormValues) {
    void submit(
      { ...values, [redirectToParam]: searchParams.get(redirectToParam) ?? "" },
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
