import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import adminLoginMark from "@/assets/images/adminLoginMark.png";
import { Button } from "@/components/Button/Button";
import { Input } from "@/components/Input/Input";
import { PasswordInput } from "@/components/PasswordInput/PasswordInput";
import { Spinner } from "@/components/Spinner/Spinner";
import styles from "@/pages/Login/components/LoginForm/LoginForm.module.css";
import { type LoginFormValues, loginSchema } from "@/pages/Login/components/LoginForm/schema";

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    formState: { errors, isSubmitting },
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
      <div className={styles.mark} aria-hidden="true">
        <img className={styles.markImage} src={adminLoginMark} alt="" />
      </div>
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
      <Button className={styles.submitButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner label="Выполняется вход" /> : "ВХОД"}
      </Button>
    </form>
  );
}
