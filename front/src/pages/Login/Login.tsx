import { LoginForm } from "@/pages/Login/components/LoginForm/LoginForm";
import styles from "@/pages/Login/Login.module.css";

export function Login() {
  return (
    <main className={styles.root}>
      <LoginForm onSubmit={() => undefined} />
    </main>
  );
}
