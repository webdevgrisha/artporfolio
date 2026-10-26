import { useActionData, useNavigation, useSearchParams, useSubmit } from "react-router";

import { documentTitle } from "@/config/documentTitle";
import { LoginForm } from "@/pages/Admin/Login/components/LoginForm/LoginForm";
import type { LoginFormValues } from "@/pages/Admin/Login/components/LoginForm/schema";
import styles from "@/pages/Admin/Login/Login.module.css";
import { type action, redirectToField } from "@/pages/Admin/Login/loginRoute";
import utilities from "@/styles/utilities.module.css";

export function Login() {
  const actionData = useActionData<typeof action>();
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
      <h1 className={utilities.visuallyHidden}>Вход в админ-панель</h1>
      <LoginForm
        isSubmitting={navigation.formData !== undefined}
        onSubmit={handleSubmit}
        submitError={actionData?.error}
      />
    </main>
  );
}
