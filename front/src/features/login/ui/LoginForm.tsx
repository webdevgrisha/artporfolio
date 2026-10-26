import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import portraitMark from "@/assets/images/portraitMark.png";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { PasswordInput } from "@/components/PasswordInput/PasswordInput";
import { Spinner } from "@/components/Spinner/Spinner";
import styles from "@/pages/Admin/Login/components/LoginForm/LoginForm.module.css";
import { type LoginFormValues, loginSchema } from "@/pages/Admin/Login/components/LoginForm/schema";
import utilities from "@/styles/utilities.module.css";

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
            <span className={utilities.visuallyHidden}>Выполняется вход</span>
          </>
        ) : (
          "ВХОД"
        )}
      </Button>
    </form>
  );
}
