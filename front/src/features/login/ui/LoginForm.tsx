import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import portraitMark from "@/shared/assets/images/portraitMark.png";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { Spinner } from "@/shared/ui/spinner";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { type LoginFormValues, loginSchema } from "../model/loginSchema";
import styles from "./LoginForm.module.css";

interface LoginFormProps {
  isSubmitting: boolean;
  onSubmit: (values: LoginFormValues) => void;
  submitError?: string | undefined;
}

export function LoginForm({ isSubmitting, onSubmit, submitError }: LoginFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  return (
    <form className={styles.root} noValidate onSubmit={handleSubmit(onSubmit)}>
      <img className={styles.mark} src={portraitMark} alt="" />
      <div className={styles.fields}>
        <Input
          label="Логин"
          type="email"
          autoComplete="username"
          placeholder="Логин"
          disabled={isSubmitting}
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordInput
          label="Пароль"
          autoComplete="current-password"
          placeholder="Пароль"
          showPasswordLabel="Показать пароль"
          hidePasswordLabel="Скрыть пароль"
          disabled={isSubmitting}
          error={errors.password?.message}
          {...register("password")}
        />
      </div>
      {submitError ? (
        <p className={styles.submitError} role="alert">
          {submitError}
        </p>
      ) : null}
      <Button
        className={styles.submitButton}
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner />
            <VisuallyHidden>Выполняется вход</VisuallyHidden>
          </>
        ) : (
          "ВХОД"
        )}
      </Button>
    </form>
  );
}
